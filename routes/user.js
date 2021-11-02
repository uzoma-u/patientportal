const { validationResult, checkSchema } = require('express-validator');
const RegisteredUser = require('../models/RegisteredUser');
const Medication = require('../models/Medication');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const auth = require('../config/auth');
const schedule = require('node-schedule');
const passport = require('passport');
const utils = require('../lib/utils');
const moment = require('moment');
const express = require('express');
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
            const theErrors = {}
            errors.array().map(error => {
                theErrors[error.param] = error.msg
            });
            return res.render('register', {errors: theErrors});
        }
        else {
            const aUser = await User.findOne({ where: { email: req.body.email } });
            
            if (!aUser) {
                req.flash('error_msg','User not found');
                res.render('register');
            }
            else {
                const aregUser = await RegisteredUser.findOne({ where: {user_id: aUser.id } });
                if (!aregUser) {
                    const hashPassword = await utils.passwordHash(req.body.password);
                    const regUser = await RegisteredUser.create({ user_id: aUser.id, password: hashPassword });

                    req.flash('success_msg', 'Registered succesfully');
                    res.render('login', {});
                }
                res.render('login');
            }
        }
    }
    catch (error) {
        console.log(error);
        res.redirect('/register');
    }
});

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out')
    res.redirect('/user/login')
});

router.get('/medications/:id', async (req, res) => {
    try {
        let medTaken = []
        const medication = await Medication.findOne({ where: { id: req.params.id }, include: Reminder })
        const medicationReminder = await medication.getReminder();

        const howLong = (medication.quantity / (medication.dose * medication.frequency));
        let duration;

        if (howLong < 7) duration = howLong.toString() + " Days"
        else duration = (Math.floor(howLong / 7)).toString() + " Weeks"

        const obj = []
        if (medicationReminder) {
            medicationReminder.intake_log.forEach(log => { 
                const ob = log.logs.map(each => { 
                    if (each.status === "Taken") { medTaken.push(each.status); return each.status} });
                })
            
            medicationReminder.reminder_times.forEach(time => {
                const newObj = { reminder_time: time, reminder_dose: medication.dose }
                obj.push(newObj);
            });
        }
        const medRemain = medication.quantity-medTaken.length

        res.render('medication', {
            medication,
            duration,
            medTaken,
            medRemain,
            reminderObj: obj,
            reminder: medicationReminder
        });
    }
    catch (error) {
        console.log(error);
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
            const theErrors = {}
            errors.array().map(error => {
                theErrors[error.param] = error.msg
            });
            return res.render('reminder', {
                errors: theErrors
            });
        }
        else {
            const medication = await Medication.findOne({ where: { id: req.params.id } })

            if (medication.reminder) {
                res.send(medication.reminder);
            }
            const reminder_times = req.body.times.split(',').map(time => { return parseInt(time) });

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

            const newReminder = await Reminder.create({
                user_id: medication.user_id,
                medication_id: req.params.id,
                reminder_frequency_type: req.body.frequency,
                start_date: req.body.start_date,
                reminder_interval: interval,
                reminder_times: reminder_times,
                reminder_note: req.body.note,
                reminder_dose: medication.dose
            });
        }
        res.redirect('/user/medications')
    }
    catch (err) {
        console.log(err)
    }
});


router.get('/myreminders', async (req, res) => {
    try {
        const myMeds = await Medication.findAll({ where: { user_id: req.user }, include: Reminder }); 

        let myReminders = []
        
        myMeds.forEach(med => {
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
                    reminders = utils.weeklyRule(medRem.reminder_interval, medRem.start_date, medRem.reminder_times, count)
                }
                console.log(reminders)
                reminders.map((timestamp) => {
                    let ne = {
                        id: medRem.id,
                        date: moment.utc(timestamp).format('L'),
                        time: moment.utc(timestamp).format('LT'),
                        medicine: med.medication_name
                    }
                    const dateLog = medRem.intake_log.find(obj => { return obj.date === ne.date});
                    
                    if (dateLog !== undefined) {
                        const timeLog = dateLog.logs.find(obj => { return obj.time === ne.time});

                        if (timeLog !== undefined) {
                            ne.status = timeLog.status
                        }
                    }                   
                    myReminders.push(ne);
                    myReminders.sort((a, b) => new Date(a.date) - new Date(b.date))

                    return ne
                }); 
            }  
        });

        const groupedReminders = utils.groupBy(myReminders, 'date');
        
        const groupedRemindersKeys = Object.keys(groupedReminders)

        const myGroupedReminders = groupedRemindersKeys.map(key => {
            
            const groupedByTime = utils.groupBy(groupedReminders[key], 'time')

            const timeGroupedKeys = Object.keys(groupedByTime)
            
            const timeRems = timeGroupedKeys.map(each => {
                return {
                    time: each,
                    value: groupedByTime[each]
                }
            });
            return {
                date: key,
                value: timeRems
            }
        })
        
        res.render('myreminders', {
            myreminders: myGroupedReminders
        });
    }
    catch (error) {
        console.log(error)
    }
});


router.post('/medicationlog/:id/taken', async (req, res) => {
    try {
        const theRem = await Reminder.findOne( {where: {id: req.params.id} });
        
        const search = theRem.intake_log.find(log => { return log.date === req.body.date });

        if (search !== undefined) {

            search.logs.push({time: req.body.time, status: req.body.status});

            const theIndex = theRem.intake_log.findIndex(log => { return log.date === req.body.date });

            const newIntakeLog = theRem.intake_log

            newIntakeLog[theIndex] = search;
      
            theRem.intake_log = newIntakeLog;
            theRem.changed("intake_log", true);
            await theRem.save();          
        }
        else { 
            let anIntakeLog = []
            const newLog = {date: req.body.date, logs: [{ time: req.body.time, status: req.body.status} ]}
            anIntakeLog.push(newLog);

            theRem.update({intake_log: theRem.intake_log.concat(anIntakeLog)});
            await theRem.save()
        }
        res.redirect('/user/myreminders');
    }
    catch(error) {
        console.log(error);
    }
});


router.post('/medicationlog/:id/missed', async (req, res) => {
    try {
        const theRem = await Reminder.findOne( {where: {id: req.params.id} });
        
        const search = theRem.intake_log.find(log => { return log.date === req.body.date });

        if (search !== undefined) {

            search.logs.push({time: req.body.time, status: req.body.status});

            const remIntakeLog = theRem.intake_log

            const theIndex = remIntakeLog.findIndex(log => { return log.date === req.body.date });

            remIntakeLog[theIndex] = search;
      
            theRem.intake_log = remIntakeLog;
            theRem.changed("intake_log", true);
            await theRem.save();          
        }
        else { 
            let anIntakeLog = []
            const newLog = {date: req.body.date, logs: [{ time: req.body.time, status: req.body.status} ]}

            anIntakeLog.push(newLog);

            theRem.update({intake_log: theRem.intake_log.concat(anIntakeLog)});
            await theRem.save()
        }
        res.redirect('/user/myreminders');
    }
    catch(error) {
        console.log(error);
    }
});

router.get('/reminder/:id/delete', async (req, res) => {
    try {
        await Reminder.destroy({ where: { id: req.params.id } });
        console.log('done')
        res.redirect('/dashboard')
    }
    catch (error) {
        console.log(error)
    }
});


router.get('/appreminders', async (req, res) => {
    try {
        let ee = []
        const d = new Date();

        const allReminders = await Reminder.findAll();

        allReminders.forEach(rem => {
            let reminders = []
            if (rem.reminder_frequency_type.toLowerCase() === 'hourly') {
                reminders = utils.hourlyRule(rem.reminder_interval, rem.start_date, rem.reminder_times, count)
            }
            else if (rem.reminder_frequency_type.toLowerCase() === 'daily') {
                console.log(rem.reminder_interval, rem.start_date, rem.reminder_times, count)
                reminders = utils.dailyRule(rem.reminder_interval, rem.start_date, rem.reminder_times, count)
            }
            else if (rem.reminder_frequency_type.toLowerCase() === 'weekly') {
                reminders = utils.weeklyRule(rem.reminder_interval, rem.start_date, rem.reminder_times, count)
            }
            console.log(reminders)
            ee.concat(reminders)
            console.log(ee)
        })
        

       intake_log.forEach(log => {if (log.date === d) {
           const job = schedule.scheduleJob({});
        }});
    }
    catch(err) {
        console.log(err)
    }
});



                    
                    
module.exports = router                 

