//global modules
const express = require('express');
const path = require('path');
const multer = require('multer');
const {body, oneOf} = require('express-validator');

//local modules
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

//router
const router = express.Router();

//multer config
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('public', 'images'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    cb(null, (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ));
};
const upload = multer({
    storage: fileStorage,
    fileFilter: fileFilter
});

//validator for the product form
const productValidator = [
    body('title', 'O título deve conter pelo menos 5 caracteres!')
    .isLength({min: 1}).isAlphanumeric('pt-BR'),
    body('price', 'Preço inválido!')
    .isFloat({min: 0.00}),
    body('description', 'Máximo de 2000 caracteres!')
    .isLength({max: 2000}),
    oneOf([
        body('description').isAlphanumeric('pt-BR'),
        body('description').isEmpty()
    ], 'Descrição inválida!')
];

//routes
router.get('/add-product', isAuth, adminController.getAddProduct);
router.post('/add-product', isAuth, upload.single('productImage'), productValidator, adminController.postAddProduct);
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);
router.post('/edit-product', isAuth, upload.single('productImage'), productValidator, adminController.postEditProduct);
router.delete('/product/:productId', isAuth, adminController.deleteProduct);
router.get('/products', isAuth, adminController.getProducts);

module.exports = router;
