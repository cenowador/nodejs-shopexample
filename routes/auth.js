//global modules
const express = require('express');
const {check, body} = require('express-validator');

//local modules
const authController = require('../controllers/auth');

//models
const User = require('../models/user');

//router
const router = express.Router();

//validators
const passwordValidator = body('password','A senha deve ter pelo menos 5 caracteres!')
    .isLength({min: 5})
    .isAlphanumeric('pt-BR');
const emailValidator = body('email', 'Entre um e-mail válido.').isEmail();
const newEmailValidator = body('email')
    .isEmail()
    .withMessage('Entre um e-mail válido.')
    .custom((value, {req}) => {
        return User.findOne({
            email: value
        }).then(userDoc => {
            if (userDoc) {
                return Promise.reject(
                    'Este e-mail já está registrado!'
                );
            }
        });
    });
const passwordConfirmationValidator = body('confirm-password').custom((value, {req}) => {
    if (value !== req.body.password) {
        throw new Error('As senhas devem ser iguais!');
    }
    return true;
});

//routes
router.get('/login', authController.getLogin);
router.post('/login',[
    emailValidator,
    passwordValidator
    ], authController.postLogin);
router.post('/logout', authController.postLogout);
router.post('/new-password', [
        passwordValidator,
        passwordConfirmationValidator
    ], authController.postNewPassword);
router.get('/reset', authController.getReset);
router.post('/reset', emailValidator, authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.get('/signup', authController.getSignup);
router.post('/signup',[
        newEmailValidator,
        passwordValidator,
        passwordConfirmationValidator
    ], authController.postSignup
);

module.exports = router;