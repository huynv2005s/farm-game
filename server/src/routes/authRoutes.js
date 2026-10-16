const express = require('express');
const authController = require('C:/Go/Farm/server/src/controllers/authController.js');
const { authenticateToken } = require('C:/Go/Farm/server/src/middleware/auth.js');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.me);

module.exports = router;
