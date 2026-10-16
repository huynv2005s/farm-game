const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = 'C:/Go/Farm/server/data/farm.sqlite';

let dbInstance = null;
let saveTimeout = null;

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      if (dbInstance) {
        const data = dbInstance.export();
        const buffer = Buffer.from(data);
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DB_PATH, buffer);
      }
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }, 200);
}

function persistSync() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, buffer);
}

async function initDatabase() {
  if (dbInstance) return dbInstance;
  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Run schema
  const schemaPath = 'C:/Go/Farm/server/src/db/schema.sql';
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    dbInstance.run(schemaSql);
    persistSync();
  }

  return dbInstance;
}

function query(sql, params = []) {
  if (!dbInstance) throw new Error('Database not initialized! Call initDatabase() first.');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  if (!dbInstance) throw new Error('Database not initialized! Call initDatabase() first.');
  dbInstance.run(sql, params);
  scheduleSave();
}

function transaction(fn) {
  if (!dbInstance) throw new Error('Database not initialized! Call initDatabase() first.');
  dbInstance.run('BEGIN TRANSACTION;');
  try {
    const result = fn();
    dbInstance.run('COMMIT;');
    persistSync();
    return result;
  } catch (error) {
    dbInstance.run('ROLLBACK;');
    throw error;
  }
}

process.on('exit', () => persistSync());
process.on('SIGINT', () => { persistSync(); process.exit(0); });
process.on('SIGTERM', () => { persistSync(); process.exit(0); });

module.exports = {
  initDatabase,
  query,
  queryOne,
  run,
  transaction,
  persistSync
};
