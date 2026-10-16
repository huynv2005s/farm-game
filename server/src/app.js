const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('C:/Go/Farm/server/src/config/index.js');
const db = require('C:/Go/Farm/server/src/db/index.js');
const authRoutes = require('C:/Go/Farm/server/src/routes/authRoutes.js');
const farmRoutes = require('C:/Go/Farm/server/src/routes/farmRoutes.js');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend assets from public directory
const publicDir = path.resolve('C:/Go/Farm/public');
app.use(express.static(publicDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farm', farmRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'Cozy Farm RPG Online',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for SPA routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(publicDir, 'index.html'));
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống máy chủ'
  });
});

async function startServer() {
  try {
    await db.initDatabase();
    console.log('✅ SQLite Database initialized successfully with ACID support & indexing.');

    app.listen(config.PORT, () => {
      console.log(`🌾 Cozy Farm RPG Server is running at: http://localhost:${config.PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};
