const expect = require('chai').expect;

//tested file
const isAuth = require('../../middleware/is-auth.js');

describe('middleware', function(){
    describe('is-auth', function(){
        it('should redirect if not authorized', function(){
            const req = {
                flash(){
                    return true;
                },
                session: {
                    user: null
                }
            }
            const res = {
                status(code){
                    this.reqStatus = code;
                    return this;
                },
                redirect(){
                    return true;
                },
                reqStatus: 200
            }
            isAuth(req, res, ()=>{});
            expect(res.reqStatus).to.equal(401);
        })
    })
});