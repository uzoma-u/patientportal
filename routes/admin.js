const sequelize = require('./../config/db');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const passport = require('passport');
const bcrypt = require('bcrypt');
const utils = require('../lib/utils');
const auth = require('../config/passport')
const admin = require('../config/admin')
const User = require('../models/User')
const Medication = require('../models/Medication')
const RegisteredUser = require('../models/RegisteredUser')
const Reminder = require('../models/Reminder')
const Admin = require('../models/Admin')
const pathToKey = path.join(__dirname, '..', 'rsa_id_pub.pem');
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');


const express = require('express');
const router = express.Router();



router.get('/', async (req, res) => {
    try {
        const count = await User.count()
        const usersResult = await User.findAll({
            include: Medication
        });
        console.log(JSON.stringify(usersResult, null, 2))
        
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
        const usersResult = await User.findOne({
            where: {
                id: req.params.id
            }, include: Medication});
        console.log(JSON.stringify(usersResult, null, 2))
        
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

router.post('/newuser', async (req, res) => {
    try {
        const {name, patientid, email, phone, diagnosis, allergies} = req.body

        const newUser = await User.create({name, patientid, email, phone, diagnosis, allergies})
        
        console.log(newUser.toJSON())
        res.redirect('/admin')
    }
    catch(err) {
        res.render('error/500')
    } 
});

router.post('/users/:id/newmedication', async (req, res) => {
    try {
        const user_id = req.params.id
        
        // const userMed = await Medication.findAll({where: {user_id: req.body.params.id}})
        // if (userMed) {
        //     if (userMed.medication_name === req.body.medication_name) return redirect('/admin')
        // }
        
        const { medication_name, strength, dosage_form, dose, frequency_type, frequency, 
            quantity, refillable, refills, refill_date, prescribed_by} = req.body

        const newMedication = await Medication.create({
            user_id,
            medication_name, 
            strength,
            dosage_form,
            dose, 
            frequency_type,
            frequency, 
            quantity, 
            refillable, 
            refills, 
            refill_date, 
            prescribed_by,
        })
        console.log(newMedication)
        res.redirect('/admin')
    }
    catch(err) {
        console.log('Error: ', err)
        res.render('error/500')
    }
});

router.get('users/update/user', async (req, res) => {
    try {
        const theUser = await User.findOne({ email: req.body.email})
        await theUser.save({ fields: []})
    }
    catch(err) {
        console.log(err)
    }
});

router.get('/newmedication', (req, res) => {
    res.render('newmedication')
})



router.post('/delete', async (req, res) => {
    try {
        const theUser = await User.findOne( {where: { id: req.body.userid} })
        console.log(req.body.userid)
        const removed = await theUser.destroy();

        // console.log(removed)
        res.redirect('/users')
    }
    catch(err) {
        console.log(err)
    }
});


router.post('/drop', async (req, res) => {
    try {
    // await User.drop();
    // await RegisteredUser.drop();
    // await Medication.drop();
    await Reminder.drop();
    // await Admin.drop();
    
    console.log('done')
    }
    catch(err) {
      console.log(err)
    }
  })

router.post('/create', async (req, res) => {
    try {
    // await User.sync();
    // await Medication.sync();
    await Reminder.sync();
    // await Admin.sync();
    // await RegisteredUser.sync();
    console.log('done')
    }
    catch(err) {
      console.log(err)
    }
  });

  router.post('/insert', async (req, res) => {
      try {
    //   const med = await Medication.findOne({where: {id: req.body.id}})
    //   med.prescribed_by = req.body.prescribed_by

    //   const rem = await Reminder.findOne({where: {medication_id: 1}})
    //   rem.user_id = 1
    //   await rem.save()

    //   console.log("done")
    //   res.send(rem)
      }
      catch(error) {
        console.log(error)
      }
  })

  router.post('/login', async (req, res) => {
    try {
        const aUser = await User.findOne({email: req.body.email})

        const regUser = await RegisteredUser.findOne({where: {user_id: aUser.id} })
        if(!regUser) return res.status(400).send('Invalid user details...')
        
        const isMatch = await bcrypt.compare(req.body.password, regUser.password)
        if (!isMatch) return res.status(400).send('Invalid user details...')
        
        console.log(isMatch)
        const userToken = utils.issueJWT(regUser, {passphrase: 'top secret'});
        res.status(200).json({ success: true, token: userToken.token, expiresIn: userToken.expires })
    }
    catch(err) {
        console.log(err)
    }
});






module.exports = router;