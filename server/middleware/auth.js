// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    //console.log('Middleware auth called');

    // Récupérer le token depuis les cookies
    const token = req.cookies.token;

    // Vérifier si le token existe
    if (!token) {
        console.log('No token found, redirecting to /auth/login');
        //res.redirect('/auth/login');
    }

    //console.log('Token from cookie:', token);

    try {
        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        //console.log('Token is valid, user authenticated');
        next();
    } catch (err) {
        console.log('Token is not valid');
        //res.status(401).json({ msg: 'Token is not valid' });
        res.redirect('/auth/login');

    }
};