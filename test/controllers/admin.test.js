const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

//configuring chai
const expect = chai.expect;
chai.use(chaiHttp);

//stubs
const expressValidator = require('express-validator');
const Product = require('../../models/product');
const ObjectId = require('mongoose').Types.ObjectId;

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

        });

        describe('postEditProduct', function(){
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

        });
    });
});