const Product = require('../models/product');
const Order = require('../models/order');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET);

//constants
const ITEMS_PER_PAGE = 2;

//GET request to /
exports.getIndex = (req, res, next) => {
  const page = req.query.page || 1;
  let totalItems = 0;
  Product.find().countDocuments()
  .then(numItems =>{
    totalItems = numItems;
    return Product.find()
    .skip((page-1)*ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
    .then(products => {
      //render page with results
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Home',
        path: '/',
        totalProducts: totalItems,
        currentPage: page,
        lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      next(new Error(err));
    });
};

//GET request to /cart
exports.getCart = (req, res, next) => {
  req.user.populate('cart.items.product')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
      });
    })
    .catch(err => {
      next(new Error(err));
    });
};

//POST request to /cart
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      next(new Error(err));
    });
};

//POST request to /cart-delete-item
exports.postCartDeleteItem = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      next(new Error(err));
    });
}

//GET request to /checkout
exports.getCheckout = (req, res, next) =>{
  let products;
  let totalPrice = 0;
  req.user.populate('cart.items.product')
  .execPopulate()
  .then(user =>{
    products = user.cart.items;
    products.forEach(p => {
      totalPrice += p.quantity * p.product.price;
    });
    return stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: products.map( p =>{
        return {
          name: p.product.title,
          description: p.product.description,
          amount: p.product.price * 100,
          currency: 'usd',
          quantity: p.quantity
        };
      }),
      success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
      cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
    });
  })
  .then(stripeSession =>{
    res.render('shop/checkout', {
      path: '/checkout',
      pageTitle: 'Checkout',
      products: products,
      totalPrice: totalPrice,
      stripeSessionId: stripeSession.id
    });
  })
  .catch(err => {
    next(new Error(err));
  });
}

//GET request to /checkout/success
exports.getCheckoutSuccess = (req, res, next) => {
  req.user.populate('cart.items.product')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return {
          quantity: i.quantity,
          product: {
            ...i.product._doc
          }
        };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user._id
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(result => {
      res.redirect('/orders');
    })
    .catch(err => {
      next(new Error(err));
    });
}

//GET request to /orders
exports.getOrders = (req, res, next) => {
  Order.find({
      'user.userId': req.user._id
    })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch(err => {
      next(new Error(err));
    });
};

//GET request to /products
exports.getProducts = (req, res, next) => {
  const page = req.query.page  || 1;
  let totalItems = 0;
  Product.find().countDocuments()
  .then(numItems =>{
    totalItems = numItems;
    return Product.find()
    .skip((page-1)*ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
    .then(products => {
      //render page with results
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All products',
        path: '/products',
        totalProducts: totalItems,
        currentPage: page,
        lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      next(new Error(err));
    });
};

//GET request to /products/:productId
exports.getProduct = (req, res, next) => {
  Product.findById(req.params.productId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch(err => {
      next(new Error(err));
    });
}
