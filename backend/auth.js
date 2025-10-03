const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Middleware to check if user is management (admin or manager)
function requireManagement(req, res, next) {
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Management access required' });
    }
    next();
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Middleware to check specific permission
function requirePermission(permission) {
    return (req, res, next) => {
        const db = req.app.get('db');
        if (!db.hasPermission(req.user.id, permission)) {
            return res.status(403).json({ error: `Permission required: ${permission}` });
        }
        next();
    };
}

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            full_name: user.full_name
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
}

module.exports = {
    authenticateToken,
    requireManagement,
    requireAdmin,
    requirePermission,
    generateToken
};