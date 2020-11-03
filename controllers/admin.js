//global modules
const {validationResult} = require('express-validator');

//local modules
const Product = require('../models/product');
const fileHandling = require('../util/file-handling');

//GET request to /admin/add-product
exports.getAddProduct = (req, res, next) => {
  let validationErrors = req.flash('validationErrors');
  if (validationErrors.length <= 0)
    validationErrors = [];

  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    validationErrors: validationErrors
  });
};

//POST request to /admin/add-product
exports.postAddProduct = (req, res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    req.flash('validationErrors', validationErrors.array());
    return res.status(422).redirect('/admin/add-product');
  }
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if(!image){
    req.flash('validationErrors', [{param:'productImage', msg: 'Insert a valid image'}]);
    return res.status(422).redirect('/admin/add-product');
  }
  const product = new Product({
    title: title,
    price: price,
    imageUrl: image.path,
    description: description,
    userId: req.session.user
  });
  product.save()
    .then(results => {
      res.redirect('/admin/products');
    })
    .catch(err => {
      next(new Error(err));
    });
};

//GET request to /admin/edit-product/:productId
exports.getEditProduct = (req, res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    req.flash('validationErrors', validationErrors.array());
    return res.status(422).redirect('/admin/add-product');
  }

  const editMode = (req.query.edit === 'true');
  if (!editMode)
    return res.redirect('/');

  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product)
        return res.redirect('/');

      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        validationErrors: []
      });
    })
    .catch(err => {
      next(new Error(err));
    });
};

//POST request to /admin/edit-product
exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  Product.findById(productId)
    .then(updatedProduct => {
      if(!updatedProduct)
        return res.redirect('/');

      if (updatedProduct.userId.toString() !== req.user._id.toString())
        return res.redirect('/');

      updatedProduct.title = title;
      updatedProduct.price = price;
      if(image){
        fileHandling.deleteFile(updatedProduct.imageUrl);
        updatedProduct.imageUrl = image.path;
      }
      updatedProduct.description = description;
      return updatedProduct.save()
        .then(() => {
          //redirects user back to admin area
          res.redirect('/admin/products');
        })
    })
    .catch(err => {
      next(new Error(err));
    });
}

//DELETE request to /admin/product/:productId
exports.deleteProduct = (req, res, next) => {
  const productId = req.params.productId;
  if (productId) {
    Product.findById(productId)
    .then(product =>{
      if(!product)
        throw new Error('Product not found');
      
      if(product.imageUrl)
        fileHandling.deleteFile(product.imageUrl);
      
        Product.deleteOne({
          _id: productId,
          userId: req.user._id
        })
        .then(() => {
          res.status(200).json({message: 'product deleted'});
        })
    })
    .catch(err => {
      res.status(500).json({message: 'failed to delete product!'});
    })
  }
};

//GET request to /admin/products
exports.getProducts = (req, res, next) => {
  Product.find({
      userId: req.user._id
    })
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      });
    });
};
