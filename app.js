//env variables
require('dotenv').config()

//global modules
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const helmet = require('helmet');

//local modules
const errorController = require('./controllers/error'); //error controller

//constants
const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

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

//app configs
app.set('view engine', 'pug');
app.use(helmet());
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
        const serverPort = process.env.PORT || 3000;
        app.listen(serverPort, () => console.log(`Server running on Port ${serverPort}`));
    })
    .catch(err => {
        next(new Error(err));
    });
