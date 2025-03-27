// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    console.log('🔍 Checking for token in header...');

    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        console.log('❌ No token found, authorization denied');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        console.log('🔑 Token found, verifying...');

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log('✅ Token is valid, adding user info to request');

        // Add user info to request
        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();
    } catch (err) {
        console.log('❌ Token is not valid');
        res.status(401).json({ message: 'Token is not valid' });
    }
};