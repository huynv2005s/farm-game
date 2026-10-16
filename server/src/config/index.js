require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3005,
  JWT_SECRET: process.env.JWT_SECRET || 'farm_secret_super_key_2026_cozy',
  JWT_EXPIRES_IN: '7d',
  DEFAULT_PLOT_COUNT: 16, // 4x4 initial farm plot layout
  INITIAL_GOLD: 500,
  INITIAL_ENERGY: 100,
  BASE_DIR: 'C:/Go/Farm'
};
