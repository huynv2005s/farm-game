const authService = require('C:/Go/Farm/server/src/services/authService.js');

function register(req, res) {
  try {
    const { username, password, gender, characterName } = req.body;
    const result = authService.register({ username, password, gender, characterName });
    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản và chọn nhân vật thành công!',
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

function login(req, res) {
  try {
    const { username, password } = req.body;
    const result = authService.login({ username, password });
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

function me(req, res) {
  return res.status(200).json({
    success: true,
    data: req.user
  });
}

module.exports = {
  register,
  login,
  me
};
