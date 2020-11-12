const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {validationResult} = require('express-validator');

const User = require('../models/user');
const session = require('express-session');

//mail configuration
const mailUri = `smtps://${process.env.SMTP_API}:${process.env.SMTP_SECRET}@${process.env.SMTP_SERVER}`;
const mailTransporter = nodemailer.createTransport(mailUri);

//GET request to /login
exports.getLogin = (req, res, next) => {
    let validationErrors = req.flash('validationErrors');
    if (validationErrors.length <= 0)
        validationErrors = [];

    //if inserted wrong info
    let wrongInfo = req.flash('wrongInfo');
    if (wrongInfo.length <= 0)
        wrongInfo = null;
    else
        wrongInfo = wrongInfo[0];
    
    //if not authorized
    let notAuth = req.flash('notAuthorized');
    if (notAuth.length <= 0)
        notAuth = null;
    else
        notAuth = notAuth[0];

    //old user input
    let oldEmail = req.flash('oldEmail');
    if (oldEmail.length <= 0)
        oldEmail = null;
    else
        oldEmail = oldEmail[0];

    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Entrar',
        oldEmail: oldEmail,
        wrongInfo: wrongInfo,
        notAuthorized: notAuth,
        validationErrors: validationErrors
    });
};

//POST request to /login
exports.postLogin = (req, res, next) => {
    const validationErrors = validationResult(req);
    if(!validationErrors.isEmpty()) {
        req.flash('validationErrors', validationErrors.array());
        return res.status(422).redirect('/login');
    }
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
    .then(user => {
        if (!user) {
            req.flash('oldEmail', email);
            req.flash('wrongInfo', 'Email ou senha incorretos!');
            return res.status(401).redirect('/login');
        }
        bcrypt.compare(password, user.password)
        .then(passwordMatch => {
            if(!passwordMatch){
                req.flash('oldEmail', email);
                req.flash('wrongInfo', 'Email ou senha incorretos!');
                return res.status(401).redirect('/login');
            }
            req.session.user = user;
            return req.session.save(err => {
                if (err){
                    next(new Error(err));
                }
                res.redirect('/admin/products');
            });
        })
    })
    .catch(err => {
        next(new Error(err));
    });
};

//POST request to /logout
exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err){
            next(new Error(err));
        }
        res.redirect('/');
    });
};

//POST request to /new-password
exports.postNewPassword = (req, res, next) => {
    const token = req.body.token;
    const validationErrors = validationResult(req);
    if(!validationErrors.isEmpty()) {
        req.flash('validationErrors', validationErrors.array());
        return res.status(422).redirect(req.protocol + '://' + req.get('host') + '/reset/' + token);
    }
    const userId = req.body.userId;
    const newPassword = req.body.password;
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
    .then(result =>{
        return req.session.destroy();
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
    let invalidEmail = req.flash('invalidEmail');
    if(invalidEmail.length <= 0)
        invalidEmail = null;
    else
        invalidEmail = invalidEmail[0].msg

    let emailState = req.flash('emailState');
    if (emailState.length <= 0)
        emailState = null;

    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Alterar Senha',
        emailState: emailState,
        invalidEmail: invalidEmail
    });
}

//POST request to /reset
exports.postReset = (req, res, next) => {
    const validationErrors = validationResult(req);
    if(!validationErrors.isEmpty()) {
        req.flash('invalidEmail', validationErrors.array()[0])
        return res.status(422).redirect('/reset');
    }
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            next(new Error(err));
        }
        const token = buffer.toString('hex');
        const email = req.body.email;
        User.findOne({email: email})
        .then(user => {
            if (!user) {
                req.flash('emailState', 'Este e-mail não está registrado!');
                return res.redirect('/reset');
            } else {
                req.flash('emailState', 'Verifique seu e-mail!');
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                user.save()
                    .then(result => {
                        // setup e-mail data with unicode symbols
                        const mailOptions = {
                            from: 'Loja Exemplo <jorge@fabled.ch>', // sender address
                            to: email, // list of receivers
                            subject: 'Mudança de Senha', // Subject line
                            html: `${req.protocol + '://' + req.get('host') + '/reset/' + token}` // html body
                        }
                        mailTransporter.sendMail(mailOptions, (err, info) =>{
                            if(err)
                                next(new Error(err));
                        })
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
    let validationErrors = req.flash('validationErrors');
    if (validationErrors.length <= 0)
        validationErrors = [];

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
            pageTitle: 'Alterar Senha',
            wrongInfo: errorMessage,
            userId: user._id.toString(),
            token: token,
            validationErrors: validationErrors
        });
    })
    .catch(err => {
        next(new Error(err));
    });
}

//GET request to /signup
exports.getSignup = (req, res, next) => {
    let validationErrors = req.flash('validationErrors');
    if (validationErrors.length <= 0)
        validationErrors = [];
        
    //old user input
    let oldEmail = req.flash('oldEmail');
    if (oldEmail.length <= 0)
        oldEmail = null;
    else
        oldEmail = oldEmail[0];

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Inscreva-se',
        validationErrors: validationErrors,
        oldEmail: oldEmail
    });
}

//POST request to /signup
exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
        req.flash('oldEmail', email);
        req.flash('validationErrors', validationErrors.array());
        return res.status(422).redirect('/signup');
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
            from: 'Loja Exemplo <jorge@fabled.ch>', // sender address
            to: email, // list of receivers
            subject: 'Você se inscreveu!', // Subject line
            html: "<h2>Obrigado por se inscrever!</h2>" // html body
        }
        mailTransporter.sendMail(mailOptions, (err, info) =>{
            if(err)
                next(new Error(err));
        })
    })
    .catch(err => {
        next(new Error(err));
    });
}