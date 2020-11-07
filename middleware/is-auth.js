module.exports = (req, res, next) => {
    if(!req.session.user){
        req.flash('notAuthorized', 'Não autorizado!');
        return res.redirect('/login');
    }
    next();
}