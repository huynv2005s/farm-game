const crypto = require('crypto');
const db = require('C:/Go/Farm/server/src/db/index.js');
const { CROPS, SEED_TO_CROP } = require('C:/Go/Farm/server/src/constants/crops.js');

function calculatePlotStatus(plot) {
  if (!plot.crop_id) {
    return {
      ...plot,
      status: 'EMPTY',
      stage: 0,
      progressPercent: 0,
      secondsRemaining: 0
    };
  }

  const crop = CROPS[plot.crop_id];
  if (!crop) {
    return { ...plot, status: 'UNKNOWN', stage: 0, progressPercent: 0, secondsRemaining: 0 };
  }

  const now = Date.now();
  const elapsedSecs = Math.max(0, (now - plot.planted_at) / 1000);
  const totalGrowthSecs = crop.growthSeconds;
  const isReady = elapsedSecs >= totalGrowthSecs;

  const stageDuration = totalGrowthSecs / crop.stages;
  const currentStage = Math.min(crop.stages, Math.floor(elapsedSecs / stageDuration) + 1);
  const progressPercent = Math.min(100, Math.floor((elapsedSecs / totalGrowthSecs) * 100));
  const secondsRemaining = Math.max(0, Math.ceil(totalGrowthSecs - elapsedSecs));

  return {
    ...plot,
    cropName: crop.vietnameseName,
    cropEnglishName: crop.name,
    status: isReady ? 'HARVESTABLE' : 'GROWING',
    stage: currentStage,
    maxStages: crop.stages,
    progressPercent,
    secondsRemaining,
    spriteFolder: crop.spriteFolder
  };
}

function getFarmState(userId) {
  const plotsRaw = db.query(
    'SELECT * FROM farm_plots WHERE user_id = ? ORDER BY plot_index ASC',
    [userId]
  );
  const plots = plotsRaw.map(calculatePlotStatus);

  const defense = db.queryOne('SELECT * FROM farm_defenses WHERE user_id = ?', [userId]) || {
    dog_name: 'Vàng',
    dog_level: 1,
    is_fed: 1,
    bone_count: 5
  };

  const inventory = db.query(
    'SELECT item_id, quantity, quality FROM inventories WHERE user_id = ? AND quantity > 0',
    [userId]
  );

  const user = db.queryOne(
    'SELECT id, username, character_name, gender, level, exp, gold, energy, max_energy FROM users WHERE id = ?',
    [userId]
  );

  return {
    user,
    plots,
    defense,
    inventory
  };
}

function plantCrop(userId, plotIndex, seedId) {
  return db.transaction(() => {
    const user = db.queryOne('SELECT energy FROM users WHERE id = ?', [userId]);
    if (user.energy < 2) throw new Error('Không đủ thể lực! Cần 2 thể lực để gieo hạt.');

    const plot = db.queryOne(
      'SELECT * FROM farm_plots WHERE user_id = ? AND plot_index = ?',
      [userId, plotIndex]
    );
    if (!plot) throw new Error('Ô đất không tồn tại!');
    if (plot.crop_id) throw new Error('Ô đất này đã được gieo hạt!');

    const cropId = SEED_TO_CROP[seedId];
    if (!cropId || !CROPS[cropId]) throw new Error('Loại hạt giống không hợp lệ!');

    const invItem = db.queryOne(
      'SELECT id, quantity FROM inventories WHERE user_id = ? AND item_id = ?',
      [userId, seedId]
    );
    if (!invItem || invItem.quantity < 1) throw new Error('Bạn không có loại hạt giống này trong túi!');

    // Deduct seed
    if (invItem.quantity === 1) {
      db.run('DELETE FROM inventories WHERE id = ?', [invItem.id]);
    } else {
      db.run('UPDATE inventories SET quantity = quantity - 1 WHERE id = ?', [invItem.id]);
    }

    // Deduct energy
    db.run('UPDATE users SET energy = energy - 2 WHERE id = ?', [userId]);

    // Calculate crop yield (random between min and max)
    const crop = CROPS[cropId];
    const yieldAmount = Math.floor(Math.random() * (crop.yieldMax - crop.yieldMin + 1)) + crop.yieldMin;
    const maxStealable = Math.floor(yieldAmount * 0.3);

    // Update plot
    const now = Date.now();
    db.run(
      `UPDATE farm_plots 
       SET crop_id = ?, planted_at = ?, is_watered = 1, watered_at = ?, original_yield = ?, remaining_yield = ?, max_stealable = ?, stolen_count = 0, is_harvested = 0
       WHERE id = ?`,
      [cropId, now, now, yieldAmount, yieldAmount, maxStealable, plot.id]
    );

    return getFarmState(userId);
  });
}

function waterPlot(userId, plotIndex) {
  return db.transaction(() => {
    const user = db.queryOne('SELECT energy FROM users WHERE id = ?', [userId]);
    if (user.energy < 1) throw new Error('Không đủ thể lực để tưới nước!');

    const plot = db.queryOne(
      'SELECT * FROM farm_plots WHERE user_id = ? AND plot_index = ?',
      [userId, plotIndex]
    );
    if (!plot) throw new Error('Ô đất không tồn tại!');

    db.run('UPDATE users SET energy = energy - 1 WHERE id = ?', [userId]);
    db.run(
      'UPDATE farm_plots SET is_watered = 1, watered_at = ? WHERE id = ?',
      [Date.now(), plot.id]
    );

    return getFarmState(userId);
  });
}

function harvestCrop(userId, plotIndex) {
  return db.transaction(() => {
    const user = db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.energy < 1) throw new Error('Không đủ thể lực để thu hoạch!');

    const plot = db.queryOne(
      'SELECT * FROM farm_plots WHERE user_id = ? AND plot_index = ?',
      [userId, plotIndex]
    );
    if (!plot || !plot.crop_id) throw new Error('Không có cây trồng trên ô đất này!');

    const crop = CROPS[plot.crop_id];
    const now = Date.now();
    const elapsedSecs = (now - plot.planted_at) / 1000;
    if (elapsedSecs < crop.growthSeconds) {
      throw new Error('Cây chưa chín, hãy kiên nhẫn đợi thêm chút nữa!');
    }

    const harvestYield = Math.max(1, plot.remaining_yield);
    const expGained = crop.expGain;

    // Add harvest product to inventory
    const existingProduct = db.queryOne(
      'SELECT id, quantity FROM inventories WHERE user_id = ? AND item_id = ?',
      [userId, plot.crop_id]
    );

    if (existingProduct) {
      db.run('UPDATE inventories SET quantity = quantity + ? WHERE id = ?', [harvestYield, existingProduct.id]);
    } else {
      db.run(
        'INSERT INTO inventories (id, user_id, item_id, quantity, quality) VALUES (?, ?, ?, ?, 1)',
        [crypto.randomUUID(), userId, plot.crop_id, harvestYield]
      );
    }

    // Update player exp & level calculation
    let newExp = user.exp + expGained;
    let newLevel = user.level;
    const expForNextLevel = newLevel * 100;
    if (newExp >= expForNextLevel) {
      newLevel += 1;
      newExp -= expForNextLevel;
    }

    db.run(
      'UPDATE users SET exp = ?, level = ?, energy = energy - 1 WHERE id = ?',
      [newExp, newLevel, userId]
    );

    // Reset plot to empty
    db.run(
      `UPDATE farm_plots 
       SET crop_id = NULL, planted_at = NULL, watered_at = NULL, is_watered = 0, original_yield = 0, remaining_yield = 0, stolen_count = 0, max_stealable = 0, is_harvested = 1
       WHERE id = ?`,
      [plot.id]
    );

    return {
      state: getFarmState(userId),
      harvested: {
        cropId: plot.crop_id,
        cropName: crop.vietnameseName,
        yield: harvestYield,
        expGained
      }
    };
  });
}

const DEFAULT_LAYOUT = {
  farmhouse: { x: 300, y: 195 },
  shipping_bin: { x: 435, y: 235 },
  water_well: { x: 175, y: 235 },
  dog: { x: 385, y: 285 },
  barn: { x: 740, y: 195 },
  chicken_coop: { x: 950, y: 200 },
  windmill: { x: 1150, y: 190 },
  fish_pond: { x: 970, y: 560 },
  garden_bed: { x: 355, y: 505 },
  hay1: { x: 620, y: 235 },
  hay2: { x: 865, y: 245 },
  bush1: { x: 670, y: 470 },
  bush2: { x: 1220, y: 500 }
};

function getFarmLayout(userId) {
  // Ensure table exists
  db.run("CREATE TABLE IF NOT EXISTS farm_layouts (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, layout_json TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')));");

  const row = db.queryOne('SELECT layout_json FROM farm_layouts WHERE user_id = ?', [userId]);
  if (!row || !row.layout_json) {
    return DEFAULT_LAYOUT;
  }
  try {
    return { ...DEFAULT_LAYOUT, ...JSON.parse(row.layout_json) };
  } catch (e) {
    return DEFAULT_LAYOUT;
  }
}

function saveFarmLayout(userId, layoutData) {
  if (!layoutData || typeof layoutData !== 'object') {
    throw new Error('Dữ liệu bố cục không hợp lệ!');
  }
  db.run("CREATE TABLE IF NOT EXISTS farm_layouts (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, layout_json TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')));");

  const layoutJson = JSON.stringify(layoutData);
  const existing = db.queryOne('SELECT user_id FROM farm_layouts WHERE user_id = ?', [userId]);
  if (existing) {
    db.run("UPDATE farm_layouts SET layout_json = ?, updated_at = datetime('now') WHERE user_id = ?", [layoutJson, userId]);
  } else {
    db.run("INSERT INTO farm_layouts (user_id, layout_json, updated_at) VALUES (?, ?, datetime('now'))", [userId, layoutJson]);
  }
  db.persistSync();
  return getFarmLayout(userId);
}

module.exports = {
  getFarmState,
  plantCrop,
  waterPlot,
  harvestCrop,
  getFarmLayout,
  saveFarmLayout,
  DEFAULT_LAYOUT
};
