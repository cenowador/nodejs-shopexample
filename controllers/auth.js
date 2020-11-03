const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {
    validationResult
} = require('express-validator');

const User = require('../models/user');

//mail configuration
const mailUri = `smtps://${process.env.SMTP_API}:${process.env.SMTP_SECRET}@${process.env.SMTP_SERVER}`;
const mailTransporter = nodemailer.createTransport(mailUri);

//GET request to /login
exports.getLogin = (req, res, next) => {
    let errorMessage = req.flash('wrongInfo');
    if (errorMessage.length <= 0)
        errorMessage = null;

    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        wrongInfo: errorMessage
    });
};

//POST request to /login
exports.postLogin = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            wrongInfo: errors.array()[0].msg
        });
    }

    const email = req.body.email;
    const password = req.body.password;
    User.findOne({
            email: email
        })
        .then(user => {
            if (!user) {
                req.flash('wrongInfo', 'Wrong email or password!');
                return res.redirect('/login');
            }

            bcrypt.compare(password, user.password)
                .then(passwordMatch => {
                    if (passwordMatch) {
                        req.session.user = user;
                        return req.session.save(err => {
                            if (err)
                                console.log(err);

                            res.render('auth/login', {
                                path: '/login',
                                pageTitle: 'Login',
                                user: req.session.user
                            });
                        });
                    }
                    res.redirect('/login');
                })
                .catch(err => {
                    console.log(err);
                    return res.redirect('/login');
                });
        })
        .catch(err => {
            next(new Error(err));
        });
};

//POST request to /logout
exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err)
            console.log(err);
        res.redirect('/');
    })
};

//POST request to /new-password
exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const newPassword = req.body.password;
    const token = req.body.token;
    let resetUser;
    User.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            },
            _id: userId
        })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            next(new Error(err));
        });
};

//GET request to /reset
exports.getReset = (req, res, next) => {
    let emailState = req.flash('emailState');
    if (emailState.length <= 0)
        emailState = null;

    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        emailState: emailState
    });
}

//POST request to /reset
exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        const email = req.body.email;
        User.findOne({
                email: email
            })
            .then(user => {
                if (!user) {
                    req.flash('emailState', 'This email is not registered!');
                    return res.redirect('/reset');
                } else {
                    req.flash('emailState', 'Please check your email!');
                    user.resetToken = token;
                    user.resetTokenExpiration = Date.now() + 3600000;
                    user.save()
                        .then(result => {
                            // setup e-mail data with unicode symbols
                            const mailOptions = {
                                from: 'Shop Example <jorge@fabled.ch>', // sender address
                                to: email, // list of receivers
                                subject: 'Password reset', // Subject line
                                html: `http://localhost:3000/reset/${token}` // html body
                            }
                            /*mailTransporter.sendMail(mailOptions, (err, info) =>{
                                if(err)
                                    console.log(err);
                            })*/
                            console.log(token);
                            return res.redirect('/reset');
                        })
                }
            })
            .catch(err => {
                next(new Error(err));
            });
    });
}

//GET request to /reset/:token
exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        .then(user => {
            let errorMessage = req.flash('wrongToken');
            if (errorMessage.length <= 0)
                errorMessage = null;
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'Set a new password',
                wrongInfo: errorMessage,
                userId: user._id.toString(),
                token: token
            });
        })
        .catch(err => {
            next(new Error(err));
        });
}

//GET request to /signup
exports.getSignup = (req, res, next) => {
    let existingEmail = req.flash('existingEmail');
    if (existingEmail.length <= 0)
        existingEmail = null;

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'SignUp',
        existingEmail: existingEmail
    });
}

//POST request to /signup
exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg
        });
    }
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: {
                    items: []
                }
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/login');
            // setup e-mail data with unicode symbols
            const mailOptions = {
                from: 'Shop Example <jorge@fabled.ch>', // sender address
                to: email, // list of receivers
                subject: 'You\'ve signed up', // Subject line
                html: "<h2>thank you for signing up!</h2>" // html body
            }
            /*mailTransporter.sendMail(mailOptions, (err, info) =>{
                if(err)
                    console.log(err);
            })*/
        })
        .catch(err => {
            next(new Error(err));
        });
}