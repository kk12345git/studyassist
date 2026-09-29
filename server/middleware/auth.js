const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'studyassist_jwt_secret_key_147_smart_guide';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
