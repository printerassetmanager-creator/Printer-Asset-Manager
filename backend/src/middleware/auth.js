const jwt = require('jsonwebtoken');

const isAdminRole = (role) => role === 'admin' || role === 'super_admin';
const isSuperAdminRole = (role) => role === 'super_admin';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

const superAdminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!isSuperAdminRole(req.user.role)) {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
  });
};

module.exports = { authMiddleware, adminMiddleware, superAdminMiddleware };
