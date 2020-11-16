const fs = require('fs');
const Product = require('../models/product');
const User = require('../models/user');

const deleteFile = (filePath) =>{
    fs.unlink(filePath, (err) =>{
        if(err)
            throw err;
    })
}

const resetDatabase = (mongoose) => {
    const defaultProductsId = [
        '5fb27e6074540e0fd05be3b6',
        '5fb292c2e2e86b2938c4a644',
        '5fb292ece2e86b2938c4a645',
        '5fb29305e2e86b2938c4a646',
        '5fb2931ae2e86b2938c4a647'
    ];
    const defaultUser = {
        _id: '5fa092e20a98ac309cdbaccb',
        email: 'admin@test.com',
        password: '$2b$12$EyF.IjtaNbeVMTMUDDDPE.eeI.hdOCdvGBCZRiKo0UWxBS37NhDMi',
        cart: {
            items: []
        }
    }
    mongoose.connection.db.listCollections().toArray(function(err, names) {
        if(names && names.length){
            if(names.some(c => c.name === 'sessions')) {
                mongoose.connection.db.dropCollection('sessions')
                .catch(err => {
                    throw new Error(err);
                });
            }    
        }
    });
    return User.deleteMany({
        _id: {$ne: defaultUser._id}
    })
    .then(result =>{
        return User.findById(defaultUser._id)
        .then(u => {
            if(u){
                u.email = defaultUser.email;
                u.password = defaultUser.password;
                u.cart = defaultUser.cart;
                return u.save()
                .then(result => {
                    return Product.deleteMany({
                        _id: {$nin: defaultProductsId}
                    });
                })
            }
        })
    })
    .catch(err => {
        throw new Error(err);
    });
}

exports.deleteFile = deleteFile;
exports.resetDatabase = resetDatabase;