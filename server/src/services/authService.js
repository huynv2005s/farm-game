const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('C:/Go/Farm/server/src/db/index.js');
const config = require('C:/Go/Farm/server/src/config/index.js');

function generateToken(userId) {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
}

function register({ username, password, gender, characterName }) {
  if (!username || !password || !characterName) {
    throw new Error('Vui lòng điền đầy đủ tên đăng nhập, mật khẩu và tên nhân vật!');
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanCharName = characterName.trim();
  const validGender = gender === 'female' ? 'female' : 'male';

  const existing = db.queryOne('SELECT id FROM users WHERE username = ?', [cleanUsername]);
  if (existing) {
    throw new Error('Tên tài khoản này đã được sử dụng, vui lòng chọn tên khác!');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userId = crypto.randomUUID();

  // Execute registration in atomic transaction
  return db.transaction(() => {
    // 1. Insert user
    db.run(
      `INSERT INTO users (id, username, password_hash, character_name, gender, avatar_url, level, exp, gold, energy, max_energy)
       VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)`,
      [
        userId,
        cleanUsername,
        passwordHash,
        cleanCharName,
        validGender,
        validGender === 'female' ? '/assets/sprites/farmer_female_grid.png' : '/assets/sprites/farmer_male_grid.png',
        config.INITIAL_GOLD,
        config.INITIAL_ENERGY,
        config.INITIAL_ENERGY
      ]
    );

    // 2. Initialize farm plots (16 plots: 4x4 grid)
    for (let i = 0; i < config.DEFAULT_PLOT_COUNT; i++) {
      const plotId = crypto.randomUUID();
      db.run(
        `INSERT INTO farm_plots (id, user_id, plot_index, crop_id, planted_at, watered_at, is_watered, original_yield, remaining_yield, stolen_count, max_stealable, is_harvested)
         VALUES (?, ?, ?, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0)`,
        [plotId, userId, i]
      );
    }

    // 3. Initialize farm defense (Guard Dog "Vàng")
    db.run(
      `INSERT INTO farm_defenses (user_id, dog_name, dog_level, bite_rate, is_fed, bone_count)
       VALUES (?, 'Vàng', 1, 0.35, 1, 5)`,
      [userId]
    );

    // 4. Starter inventory (Seeds)
    const starterSeeds = [
      { item: 'seed_wheat', qty: 6 },
      { item: 'seed_radish', qty: 6 },
      { item: 'seed_carrot', qty: 4 },
      { item: 'seed_strawberry', qty: 2 }
    ];

    for (const seed of starterSeeds) {
      db.run(
        `INSERT INTO inventories (id, user_id, item_id, quantity, quality)
         VALUES (?, ?, ?, ?, 1)`,
        [crypto.randomUUID(), userId, seed.item, seed.qty]
      );
    }

    const user = db.queryOne(
      'SELECT id, username, character_name, gender, avatar_url, level, exp, gold, energy, max_energy FROM users WHERE id = ?',
      [userId]
    );

    const token = generateToken(userId);
    return { token, user };
  });
}

function login({ username, password }) {
  if (!username || !password) {
    throw new Error('Vui lòng nhập tên đăng nhập và mật khẩu!');
  }

  const cleanUsername = username.trim().toLowerCase();
  const user = db.queryOne('SELECT * FROM users WHERE username = ?', [cleanUsername]);
  if (!user) {
    throw new Error('Tài khoản hoặc mật khẩu không chính xác!');
  }

  const match = bcrypt.compareSync(password, user.password_hash);
  if (!match) {
    throw new Error('Tài khoản hoặc mật khẩu không chính xác!');
  }

  // Update last login
  db.run("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", [user.id]);

  const token = generateToken(user.id);
  const safeUser = {
    id: user.id,
    username: user.username,
    character_name: user.character_name,
    gender: user.gender,
    avatar_url: user.avatar_url,
    level: user.level,
    exp: user.exp,
    gold: user.gold,
    energy: user.energy,
    max_energy: user.max_energy
  };

  return { token, user: safeUser };
}

module.exports = {
  register,
  login
};
