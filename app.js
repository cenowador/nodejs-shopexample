//env variables
require('dotenv').config()

//global modules
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const morgan = require('morgan');
const mongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const helmet = require('helmet');

//local modules
const errorController = require('./controllers/error'); //error controller
const generateNonce = require('./util/nonce'); //nonce generator
const resetDb = require('./util/file-handling').resetDatabase;

//constants
const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}.t7fjx.mongodb.net/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

//models
const User = require('./models/user');

//routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

//express app
const app = express();

//packages configs
const sessionStorage = new mongoDbStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
//morgan file stream
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

//app configs
app.set('view engine', 'pug');
app.use((req, res, next)=>{
    res.locals.cspNonce = generateNonce();
    helmet.contentSecurityPolicy({
        directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["https://js.stripe.com", "'self'", `'nonce-${res.locals.cspNonce}'`],
        "script-src-elem": ["https://js.stripe.com", "'self'", `'nonce-${res.locals.cspNonce}'`],
        "img-src":["https://files.catbox.moe", "'self'"]
        },
    });
    next();
});
//cors
app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', 'catbox.moe, stripe.com, js.stripe.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization');
    next();
});
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/images', express.static(path.join(__dirname, 'public', 'images')));
app.use(flash());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStorage
}));
//csrf protection
app.use(csrf());
// setup the logger
app.use(morgan('combined', { stream: accessLogStream }))

//sets user for each request
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }

    User.findById(req.session.user._id)
        .then(currentUser => {
            req.user = currentUser;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});

//this is sent to every request made
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.csrfToken = req.csrfToken();
    next();
});

//setting routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
//app.get('/500', errorController.get500);
app.use(errorController.get404);

//internal server error handling
/* app.use((error, req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Server Error',
        path: '/500',
        error: error
    });
}); */

//removes deprecated methods
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
//connect to database
mongoose.connect(MONGODB_URI)
.then(() => {
    //restart DB
    return resetDb(mongoose)
    .then(result => {
        const serverPort = process.env.PORT || 3000;
        app.listen(serverPort, () => console.log(`Server running on Port ${serverPort}`));
    })
})
.catch(err => {
    throw new Error(err);
});
