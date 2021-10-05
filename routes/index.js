const {validateInput, issueJWT} = require('./../lib/utils')
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
        session=req.session;
        if(session.req.user) {
            const user = await User.findOne({ where: {id: req.user},
                include: {
                model: Medication
                }
            });
            console.log(JSON.stringify(user, null, 2));

            res.render('dashboard', {
            user: user,
            });
        }
    }
    catch(error) {
        console.log(error)
    }
})







module.exports = router;