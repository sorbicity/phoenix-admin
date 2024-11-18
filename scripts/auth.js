const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(401).json({ message: 'توکن احراز هویت یافت نشد' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'توکن نامعتبر است' });
    }
};

module.exports = adminAuth;
