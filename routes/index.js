const { ensureAuthenticated } = require('../config/auth');
const Medication = require('../models/Medication');
const User = require('./../models/User');
const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
    res.render('index');
});

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        if(req.user) {
            // Return user and user's medications
            const user = await User.findOne({ where: {id: req.user}, include: Medication });
            res.render('dashboard', {
            user: user,
            });
        }
    }
    catch(error) {
        console.log(error);
    }
});





module.exports = router;