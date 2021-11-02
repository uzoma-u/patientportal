const auth = require('../config/auth');
const User = require('../models/User');
const Medication = require('../models/Medication');
const RegisteredUser = require('../models/RegisteredUser');
const express = require('express');
const { validationResult, checkSchema } = require('express-validator');
const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const count = await User.count()
        const usersResult = await User.findAll({
            include: Medication
        });
        
        res.render('admin', {
            users: usersResult,
            counts: count,
            pageTestScript: '../public/qa/tests-admins.js'
        });
    }
    catch(err) {
        console.log(err)
        res.render('error/500');
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const usersResult = await User.findOne({where: {id: req.params.id}, include: Medication});
        
        res.render('users', {
            user: usersResult,
            pageTestScript: '../public/qa/tests-admins.js'
        });
    }
    catch(err) {
        console.log(err)
        res.render('error/500');
    }
});

router.post('/newuser', checkSchema(auth.newpatientSchema), async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            const theError = {}

            errors.array().map(each => {
                theError[each.param] = each.msg
            });
            return res.render('admin', {
                error: theError
            });
        }
        const {name, patientid, email, phone, diagnosis, allergies} = req.body

        const newUser = await User.create({name, patientid, email, phone, diagnosis, allergies});
        
        res.redirect('/admin');
    }
    catch(err) {
        console.log(err)
        res.render('error/500')
    } 
});

router.post('/users/:id/newmedication', async (req, res) => {
    try {
        const user_id = req.params.id
        
        const { medication_name, strength, dosage_form, dose, frequency_type, frequency, 
            quantity, refillable, refills, refill_date, prescribed_by} = req.body
        
        const aMed = await Medication.findOne({ where: {medication_name: medication_name}});

        if (!aMed) {
            const newMedication = await Medication.create({
                user_id, medication_name, strength, dosage_form,dose, frequency_type, frequency, 
                quantity, refill_date, prescribed_by,
            });
            console.log(newMedication);
            res.redirect('/admin');
        }
    }
    catch(err) {
        console.log('Error: ', err);
        res.render('error/500');
    }
});


router.post('/delete/user/:id', async (req, res) => {
    try {
        
        const theUser = await User.findOne( {where: { id: req.params.id} });
        console.log(req.body.userid);
        
        const removed = await theUser.destroy();
        console.log(removed);
        
        res.redirect('/admin');
    }
    catch(err) {
        console.log(err);
    }
});


router.post('/drop', async (req, res) => {
    try {
        // await Reminder.drop();
        // await Medication.drop();
        // await RegisteredUser.drop();
        // await User.drop();
        // await Admin.drop();
    
    console.log('done')
    res.send('done')
    }
    catch(err) {
      console.log(err)
    }
  })

router.post('/create', async (req, res) => {
    try {
    // await User.sync();
    // await Medication.sync();
    // await Reminder.sync();
    // await Admin.sync();
    // await RegisteredUser.sync();
    console.log('done')
    res.send('done')
    }
    catch(err) {
      console.log(err);
    }
  });






module.exports = router;