const fs = require('fs');
const ObjectId = require('mongoose').Types.ObjectId;
const Product = require('../models/product');
const User = require('../models/user');

const deleteFile = (filePath) =>{
    fs.unlink(filePath, (err) =>{
        if(err)
            throw err;
    })
}

const resetDatabase = (mongoose) => {
    console.log('Reseting database...');
    const defaultProducts = [
        {
            title: 'Celular',
            price: 12.99,
            imageUrl: 'https://files.catbox.moe/kbl9ej.jpg',
            description: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão em latim utilizado na produção gráfica para preencher os espaços de texto em publicações (jornais, revistas, e sites) para testar e ajustar aspectos visuais (layout, tipografia, formatação, etc.) antes de utilizar conteúdo real. Também é utilizado em catálogos tipográficos, para demonstrar textos e títulos escritos com as fontes.',
            userId: ObjectId('5fa092e20a98ac309cdbaccb')
        },
        {
            title: 'Notebook',
            price: 1200.99,
            imageUrl: 'https://files.catbox.moe/1rt32r.jpg',
            description: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão em latim utilizado na produção gráfica para preencher os espaços de texto em publicações (jornais, revistas, e sites) para testar e ajustar aspectos visuais (layout, tipografia, formatação, etc.) antes de utilizar conteúdo real. Também é utilizado em catálogos tipográficos, para demonstrar textos e títulos escritos com as fontes.',
            userId: ObjectId('5fa092e20a98ac309cdbaccb')
        },
        {
            title: 'Garrafa de Água',
            price: 10.99,
            imageUrl: 'https://files.catbox.moe/h8ojpz.jpg',
            description: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão em latim utilizado na produção gráfica para preencher os espaços de texto em publicações (jornais, revistas, e sites) para testar e ajustar aspectos visuais (layout, tipografia, formatação, etc.) antes de utilizar conteúdo real. Também é utilizado em catálogos tipográficos, para demonstrar textos e títulos escritos com as fontes.',
            userId: ObjectId('5fa092e20a98ac309cdbaccb')
        },
        {
            title: 'Caderno',
            price: 20.99,
            imageUrl: 'https://files.catbox.moe/tsdcjy.jpg',
            description: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão em latim utilizado na produção gráfica para preencher os espaços de texto em publicações (jornais, revistas, e sites) para testar e ajustar aspectos visuais (layout, tipografia, formatação, etc.) antes de utilizar conteúdo real. Também é utilizado em catálogos tipográficos, para demonstrar textos e títulos escritos com as fontes.',
            userId: ObjectId('5fa092e20a98ac309cdbaccb')
        },
        {
            title: 'Xícara',
            price: 15.99,
            imageUrl: 'https://files.catbox.moe/3a3eqj.webp',
            description: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão em latim utilizado na produção gráfica para preencher os espaços de texto em publicações (jornais, revistas, e sites) para testar e ajustar aspectos visuais (layout, tipografia, formatação, etc.) antes de utilizar conteúdo real. Também é utilizado em catálogos tipográficos, para demonstrar textos e títulos escritos com as fontes.',
            userId: ObjectId('5fa092e20a98ac309cdbaccb')
        }
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
                    console.log('Failed to drop sessions collection!');
                    throw new Error(err);
                });
            }
            if(names.some(c => c.name === 'orders')) {
                mongoose.connection.db.dropCollection('orders')
                .catch(err => {
                    console.log('Failed to drop orders collection!');
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
                    return Product.deleteMany({})
                    .then(result => {
                        return Product.insertMany(defaultProducts);
                    })
                })
            }
        })
    })
    .catch(err => {
        console.log('Failed to fully reset database!');
        throw new Error(err);
    });
}

exports.deleteFile = deleteFile;
exports.resetDatabase = resetDatabase;