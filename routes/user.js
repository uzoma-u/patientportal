const { validationResult, checkSchema } = require('express-validator');
const fs = require('fs');
const path = require('path');
const passport = require('passport');
const moment = require('moment');
const _ = require('lodash');
const pathToKey = path.join(__dirname, '..', 'rsa_id_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');
const utils = require('../lib/utils');
const auth = require('../config/auth')
const { ensureAuthenticated } = require('../config/auth');
const User = require('../models/User');
const Medication = require('../models/Medication');
const RegisteredUser = require('../models/RegisteredUser');
const Reminder = require('../models/Reminder');

const express = require('express');
const { groupBy } = require('lodash');
const router = express.Router();




router.get('/login', (req, res) => {
    res.render('login')
});

router.get('/register', (req, res) => {
    res.render('register')
});

router.post('/login', checkSchema(auth.logSchema), async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const theError = {}

        errors.array().map(each => {
            theError[each.param] = each.msg
        });
        console.log(theError)
        return res.render('login', {
            errors: theError
        });
    }
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/user/login',
        failureFlash: true,
        session: true
    })(req, res, next)
});

router.post('/register', checkSchema(auth.regSchema), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // console.log(errors)
            // return res.render('register', {
            //     errors: errors.array()
            // })
            const theErrors = {}
            errors.array().map(error => {

                theErrors[error.param] = error.msg

            })

            return res.render('register', {
                errors: theErrors
            })
        }
        const aUser = await User.findOne({ where: { email: req.body.email } })
        if (!aUser)
            req.flash('error_msg', 'Registered was not succesful, User not found')
        res.render('register', {

        })
        console.log(req.body.password)
        const hashPassword = await utils.passwordHash(req.body.password)
        console.log(hashPassword)
        const regUser = await RegisteredUser.create({ user_id: aUser.id, password: hashPassword })

        // const token = utils.generateJasonWebToken(regUser.id)
        const token = regUser.generateJasonWebToken()
        req.flash('success_msg', 'Registered succesfully')
        res.render('login', {})
        // res.status('x-authentication-token', token)
        // console.log(regUser)
        // res.send(regUser.user_id, aUser.email, token)
    }
    catch (error) {
        console.log(error)
    }

});

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out')
    res.redirect('/user/login')
});

router.get('/medications', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ where: { id: req.user }, include: Medication })
        res.render('dashboard', {
            user: user
        });
    }
    catch (error) {
        console.log(error)
    }
});

router.get('/medications/:id', async (req, res) => {
    try {
        const medication = await Medication.findOne({ where: { id: req.params.id }, include: Reminder })
        const medicationReminder = await medication.getReminder() //Reminder.findOne({where: {medication_id: medication.id}})

        const remainingQuantity = medicationReminder
        const howLong = (medication.quantity / (medication.dose * medication.frequency))
        let duration;
        if (howLong < 7) duration = howLong.toString() + " Days"
        else duration = (Math.floor(howLong / 7)).toString() + " Weeks"

        const obj = []
        if (medicationReminder) {
            medicationReminder.reminder_times.forEach(time => {
                const newObj = { reminder_time: time, reminder_dose: medication.dose }
                obj.push(newObj)

            })
            console.log(obj)
        }
        console.log(obj)


        console.log(medicationReminder)
        res.render('medication', {
            medication: medication,
            reminder: medicationReminder,
            duration: duration,
            reminderObj: obj
        });
    }
    catch (error) {
        console.log(error)
    }
});

router.get('/medications/:id/newreminder', async (req, res) => {
    try {
        const aMedication = await Medication.findOne({ where: { id: req.params.id } })

        res.render('reminder', {
            medication: aMedication
        });
    }
    catch (err) {
        console.err('Error:', err)
        res.render('error/500')
    }
});

router.post('/medications/:id/newreminder', checkSchema(auth.reminderSchema), async (req, res) => {

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // console.log(errors)
            // return res.render('register', {
            //     errors: errors.array()
            // })
            const theErrors = {}
            errors.array().map(error => {
                theErrors[error.param] = error.msg
            })
            console.log(errors)
            return res.render('reminder', {
                errors: theErrors
            })
        }
        else {
            const medication = await Medication.findOne({ where: { id: req.params.id } })
            const reminder = await Reminder.findOne({ where: { medication_id: medication.id } })

            if (reminder) return res.redirect('/user/medications')

            let interval;
            if (req.body.frequency === 'hourly') {
                interval = req.body.hourly_interval
            }
            else if (req.body.frequency === 'daily') {
                interval = req.body.daily_interval
            }
            else if (req.body.frequency === 'weekly') {
                interval = req.body.weekly_interval
            }

            const reminderTime = []
            req.body.times.split(',').forEach(time => {
                console.log(time)
                reminderTime.push(parseInt(time.slice(0, 2)))
            })
            console.log(typeof req.body.times)
            console.log(reminderTime)

            const newReminder = await Reminder.create({
                user_id: medication.user_id,
                medication_id: req.params.id,
                reminder_frequency_type: req.body.frequency,
                start_date: req.body.start_date,
                reminder_interval: interval,
                reminder_times: reminderTime,
                reminder_frequency: req.body.times.split(',').length,
                reminder_message: req.body.message,
                reminder_dose: medication.dose
            });
            console.log(newReminder)
            res.redirect('/user/medications/:req.params.id')
            // res.send(newReminder);
        }
    }
    catch (err) {
        console.log(err)
    }
});


router.get('/medications/:id/reminder/update', async (req, res) => {
    try {
        const reminder = await Reminder.findOne({ where: { medication_id: req.params.id } })
        res.render('reminder')
    }
    catch (error) {
        console.log(error)
    }
});

router.post('/medications/:id/reminder/update', async (req, res) => {
    try {
        const updatedReminder = await Reminder.update({
            user_id: req.body.user_id,
            medication_id: req.params.id,
            reminder_frequency_type: req.body.frequency,
            start_date: req.body.start_date,
            reminder_interval: interval,
            reminder_times: req.body.times.split(','),
            reminder_frequency: req.body.times.split(',').length,
            reminder_message: req.body.message
        },
            { where: { medication_id: req.params.id } })

    }
    catch (error) {
        console.log(error)
    }
});

router.get('/medications/:id/reminder/:id/delete', async (req, res) => {
    try {
        // session=req.session
        // session.user_id=req.user
        const deletedReminder = await Reminder.destroy({ where: { id: req.params.id } });
        console.log('done')
        res.redirect('/dashboard')
    }
    catch (error) {
        console.log(error)
    }
});


router.get('/myreminders', async (req, res) => {
    try {
        const meds = await Medication.findAll({ where: { user_id: req.user }, include: Reminder });

        let testReminders = []
        
        meds.forEach(med => {

            const count = med.quantity

            if (med.reminder) {
                const medRem = med.reminder

                let reminders = []

                if (medRem.reminder_frequency_type.toLowerCase() === 'hourly') {
                    reminders = utils.hourlyRule(medRem.reminder_interval, medRem.start_date, medRem.reminder_times, count)
                }
                else if (medRem.reminder_frequency_type.toLowerCase() === 'daily') {
                    console.log(medRem.reminder_interval, medRem.start_date, medRem.reminder_times, count)

                    reminders = utils.dailyRule(medRem.reminder_interval, medRem.start_date, medRem.reminder_times, count)
                }
                else if (medRem.reminder_frequency_type.toLowerCase() === 'weekly') {
                    reminders = utils.weeklyRule(reminder_interval, start_date, reminder_times, count)
                }
                // console.log(reminders)

                reminders.map((timestamp) => {
                    const refDate = moment.utc(timestamp).format('L');
                    const refTime = moment.utc(timestamp).format('LT')

                    testReminders.push({
                        date: refDate,
                        time: refTime,
                        medicine: med.medication_name,
                        description: medRem.reminder_message
                    });
                });
            }
        })
        
        const groupedReminders = utils.groupBy(testReminders, 'date');
        // console.log(groupedReminders)

        const groupedRemindersKeys = Object.keys(groupedReminders)

        const myreminders = groupedRemindersKeys.map(key => {
            // console.log(groupedReminders[key])
            
            const res = utils.groupBy(groupedReminders[key], 'time')

            const resGroupedKeys = Object.keys(res)
            // console.log(res);
            const myrems = resGroupedKeys.map(ke => {
                return {
                    time: ke,
                    value: res[ke]
                }
            });
            console.log(myrems)

            return {
                date: key,
                value: myrems
            }
        })
        console.log(myreminders)

        res.render('myreminders', {
            myreminders
        })
    }
    catch (error) {
        console.log(error)
    }
});








module.exports = router






// const sortedTestReminders = _.sortBy(testReminders, ['date', 'time.slice(6, 7)']) //, 'time.slice(0, 2)'])
                // console.log(sortedTestReminders)
                // testReminders.sort(function(z, y) {
                //     return z.date - y.date
                // })
                // console.log(testReminders)
                // const groupedTestReminders = _.groupBy(sortedTestReminders, ['date'])
                // console.log(groupedTestReminders)
                // groupedTestReminders.forEach(testReminder => {
                //     const objExist = objRems.find(ob => {return ob.date === testReminder.date && ob.time === testReminder.time})

                //     if (objExist) {
                //         objExist.medication.push(testReminder.medicine)
                //         objExist.reminder_message.push(testReminder.description)
                //     }
                //     else {
                //         const newObj = {reminder_date: testReminder.date, reminder_time: testReminder.time, medication: [testReminder.medicine], reminder_message: [testReminder.description]}
                //         objRems.push(newObj)
                //     }
                // })   
                // console.log(objRems)



// testReminders.forEach(testReminder => {
        //         const objExist = objRems.find( (ob) => { return ob.reminder_date === testReminder.date && ob.reminder_time === testReminder.time})

        //         if (objExist) {
        //             if (objExist.reminder_time === testReminder.time) 
        //             objExist.property.push( {medications: testReminder.medicine, reminder_message: testReminder.description}  )

        //             else {
        //                 objExist.reminder_time = testReminder.time  
        //                 objExist.property.push( {medications: testReminder.medicine, reminder_message: testReminder.description} ) }
        //         }
        //         else {
        //             const newObj = {
        //                 reminder_date: testReminder.date, 
        //                 reminder_time: testReminder.time, 
        //                 property: [ { medications: testReminder.medicine, reminder_message: testReminder.description } ]
        //             }
        //             objRems.push(newObj)
        //         }
        //     })
        //     console.log(objRems)
