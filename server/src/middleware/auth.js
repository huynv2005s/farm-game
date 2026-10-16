const jwt = require('jsonwebtoken');
const config = require('C:/Go/Farm/server/src/config/index.js');
const db = require('C:/Go/Farm/server/src/db/index.js');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để tiếp tục!' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ!' });
    }

    const user = db.queryOne('SELECT id, username, character_name, gender, level, exp, gold, energy, max_energy FROM users WHERE id = ?', [decoded.userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người chơi không tồn tại!' });
    }

    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken
};
