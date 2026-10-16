-- =========================================================================
-- FARM RPG & STEALTH MULTIPLAYER DATABASE SCHEMA (SQLite / PostgreSQL Compatible)
-- Reference: DATABASE_AND_ONLINE_SPEC.md
-- =========================================================================

-- 1. Bảng users (Thông tin người chơi & Nhân vật)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    character_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 500,
    energy INTEGER DEFAULT 100,
    max_energy INTEGER DEFAULT 100,
    last_login_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- 2. Bảng farm_plots (Từng ô đất trồng trọt trên bản đồ trang trại)
CREATE TABLE IF NOT EXISTS farm_plots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plot_index INTEGER NOT NULL,               -- Thứ tự ô trên lưới (0 -> 15 hoặc 23)
    crop_id TEXT DEFAULT NULL,                 -- NULL nếu ô trống; 'crop_strawberry', 'crop_wheat'...
    planted_at INTEGER DEFAULT NULL,           -- Timestamp ms lúc gieo hạt
    watered_at INTEGER DEFAULT NULL,           -- Timestamp ms lúc tưới nước
    is_watered INTEGER DEFAULT 0,              -- 0: khô, 1: đã tưới
    
    -- Cơ chế phục vụ ăn trộm & thu hoạch (Anti-cheat & Anti-double-steal):
    original_yield INTEGER DEFAULT 0,          -- Sản lượng ước tính khi chín (VD: 10 trái)
    remaining_yield INTEGER DEFAULT 0,         -- Sản lượng thực tế còn lại
    stolen_count INTEGER DEFAULT 0,            -- Đã bị trộm bao nhiêu quả
    max_stealable INTEGER DEFAULT 0,           -- Giới hạn trộm tối đa (VD: 30%)
    is_harvested INTEGER DEFAULT 0,            -- 0: chưa thu hoạch, 1: đã thu hoạch
    
    UNIQUE(user_id, plot_index)
);

-- 3. Bảng farm_animals (Vật nuôi trong chuồng)
CREATE TABLE IF NOT EXISTS farm_animals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    animal_id TEXT NOT NULL,                   -- 'animal_chicken', 'animal_cow'...
    nickname TEXT,
    growth_stage TEXT DEFAULT 'baby',          -- 'baby', 'adult'
    bought_at TEXT DEFAULT (datetime('now')),
    last_fed_at TEXT,
    last_petted_at TEXT,
    affection_points INTEGER DEFAULT 0,        -- Tim tình cảm (0 - 1000)
    
    -- Sản phẩm chu kỳ:
    product_ready_at INTEGER DEFAULT NULL,
    has_product INTEGER DEFAULT 0,
    product_stolen INTEGER DEFAULT 0
);

-- 4. Bảng farm_defenses (Chó canh nhà & Hệ thống phòng thủ)
CREATE TABLE IF NOT EXISTS farm_defenses (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    dog_name TEXT DEFAULT 'Vàng',
    dog_level INTEGER DEFAULT 1,
    bite_rate REAL DEFAULT 0.35,               -- 35% tỉ lệ phát hiện & cắn kẻ trộm
    is_fed INTEGER DEFAULT 1,                  -- 1: đã no bụng, sẵn sàng bảo vệ
    bone_count INTEGER DEFAULT 5               -- Lượt sủa / cắn còn lại
);

-- 4b. Bảng farm_layouts (Bố cục tùy chỉnh trang trại của người chơi)
CREATE TABLE IF NOT EXISTS farm_layouts (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    layout_json TEXT NOT NULL,                 -- Lưu tọa độ các công trình, ao cá, vườn rau
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 5. Bảng inventories (Túi đồ & Kho hàng người chơi)
CREATE TABLE IF NOT EXISTS inventories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,                     -- 'seed_wheat', 'crop_strawberry', 'tool_hoe'...
    quantity INTEGER NOT NULL DEFAULT 0,
    quality INTEGER DEFAULT 1,                 -- 1: Thường, 2: Bạc, 3: Vàng
    UNIQUE(user_id, item_id, quality)
);

-- 6. Bảng plot_steal_records (Chống spam trộm lặp lại 1 ô)
CREATE TABLE IF NOT EXISTS plot_steal_records (
    id TEXT PRIMARY KEY,
    plot_id TEXT NOT NULL REFERENCES farm_plots(id) ON DELETE CASCADE,
    thief_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantity_stolen INTEGER NOT NULL,
    stolen_at TEXT DEFAULT (datetime('now')),
    UNIQUE(plot_id, thief_id)
);

-- 7. Bảng steal_logs (Nhật ký trộm & Lịch sử phá án)
CREATE TABLE IF NOT EXISTS steal_logs (
    id TEXT PRIMARY KEY,
    victim_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thief_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,                 -- 'CROP_STOLEN', 'EGG_STOLEN', 'DOG_BITTEN'
    item_id TEXT NOT NULL,
    item_quantity INTEGER NOT NULL,
    thief_penalty_gold INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- =========================================================================
-- INDEXES CHO TRUY VẤN TỐC ĐỘ CAO (HIGH PERFORMANCE OPTIMIZATION)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_plots_user_index ON farm_plots(user_id, plot_index);
CREATE INDEX IF NOT EXISTS idx_inventories_user_item ON inventories(user_id, item_id);
CREATE INDEX IF NOT EXISTS idx_animals_user ON farm_animals(user_id);
CREATE INDEX IF NOT EXISTS idx_steal_records_plot_thief ON plot_steal_records(plot_id, thief_id);
CREATE INDEX IF NOT EXISTS idx_steal_logs_victim ON steal_logs(victim_id);
