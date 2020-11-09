const expect = require('chai').expect;
const sinon = require('sinon');

//stubs
const expressValidator = require('express-validator');
const Product = require('../../models/product');

//tested file
const adminController = require('../../controllers/admin');

//fakes validation
const fakeValidation = sinon.fake.returns({
    isEmpty(){return true}
});

describe('controllers', function(){
    describe('admin', function(){
        describe('postAddProduct', function(){
            it('should return status 422 if there are validation errors', function(){
                //fake objects
                const fakeReq = {
                    flash(){return true},
                    body:{
                        title: '',
                        price: 0,
                        description: ''
                    },
                    file: '',
                    session: {
                        user: ''
                    }
                }
                const fakeRes = {
                    status(code){
                        this.statusCode = code;
                        return this;
                    },
                    redirect(){return true;},
                    statusCode: 500
                }

                //expectations
                adminController.postAddProduct(fakeReq, fakeRes, ()=>{});
                expect(fakeRes.statusCode).to.equal(422);
            });

            it('should return status 422 if there is no valid image', function(){
                //fake objects
                const fakeReq = {
                    flash(){return true},
                    body:{
                        title: '',
                        price: 0,
                        description: ''
                    },
                    file: '',
                    session: {
                        user: ''
                    }
                }
                const fakeRes = {
                    status(code){
                        this.statusCode = code;
                        return this;
                    },
                    redirect(){return true;},
                    statusCode: 500
                }

                //fakes validation
                sinon.stub(expressValidator, 'validationResult').callsFake(fakeValidation);

                //expectations
                adminController.postAddProduct(fakeReq, fakeRes, ()=>{});
                sinon.restore();
                expect(fakeRes.statusCode).to.equal(422);
            });

            it('should return status 200 if product was saved', function(done){
                //fake objects
                const fakeReq = {
                    flash(){return true},
                    body:{
                        title: '',
                        price: 0,
                        description: ''
                    },
                    file: {
                        path: 'path'
                    },
                    session: {
                        user: ''
                    }
                }
                const fakeRes = {
                    statusCode: 500,
                    redirect: function(){
                        this.statusCode = 200;
                        done();
                    }
                }
                //fake methods
                sinon.stub(expressValidator, 'validationResult').callsFake(fakeValidation);
                sinon.stub(Product.prototype, 'save').callsFake(sinon.fake.resolves(true));

                //expectations
                adminController.postAddProduct(fakeReq, fakeRes, ()=>{});
                sinon.restore();
                expect(fakeRes.statusCode).to.equal(200);
            });
        });
    });
});