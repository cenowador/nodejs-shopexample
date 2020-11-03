//global modules
const express = require('express');
const {check, body} = require('express-validator');

//local modules
const authController = require('../controllers/auth');

//models
const User = require('../models/user');

//router
const router = express.Router();

//routes
router.get('/login', authController.getLogin);
router.post('/login',
    [
        body('email', 'Please enter a valid email.').isEmail(),
        body('password', 'Please enter a valid password.').isLength({min: 5})
    ], authController.postLogin);
router.post('/logout', authController.postLogout);
router.post('/new-password', authController.postNewPassword);
router.get('/reset', authController.getReset);
router.post('/reset', check('email').isEmail(), authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.get('/signup', authController.getSignup);
router.post('/signup',
    [
        check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, {req}) => {
            return User.findOne({
                email: value
            }).then(userDoc => {
                if (userDoc) {
                    return Promise.reject(
                        'E-Mail exists already, please pick a different one.'
                    );
                }
            });
        }),
        body('password',
            'Please enter a password with only numbers and text and at least 5 characters.'
        )
        .isLength({min: 5})
        .isAlphanumeric(),
        body('confirmPassword').custom((value, {req}) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match!');
            }
            return true;
        })
    ], authController.postSignup
);

module.exports = router;