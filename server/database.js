/**
 * SQLite Database Connection and Schema Initializer
 * Uses Node.js native node:sqlite (Node 22+) with transparent fallback to better-sqlite3.
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

function getDbPath(customPath) {
  if (customPath) return customPath;
  if (process.env.DATABASE_PATH) {
    return path.isAbsolute(process.env.DATABASE_PATH)
      ? process.env.DATABASE_PATH
      : path.resolve(process.cwd(), process.env.DATABASE_PATH);
  }
  return path.resolve(__dirname, '../data/launchpad.db');
}

/**
 * Creates and initializes a database instance with unified prepared statements.
 */
function createDatabase(overridePath) {
  const targetPath = getDbPath(overridePath);

  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  let db;

  // Prefer Node 22+ built-in node:sqlite (zero native compilation needed)
  try {
    const { DatabaseSync } = require('node:sqlite');
    db = new DatabaseSync(targetPath);
  } catch (err) {
    try {
      const Database = require('better-sqlite3');
      db = new Database(targetPath);
    } catch (fallbackErr) {
      console.error('Fatal: Failed to load both node:sqlite and better-sqlite3.', fallbackErr);
      throw err;
    }
  }

  // Set foreign keys and WAL mode if on disk
  try {
    db.exec('PRAGMA foreign_keys = ON;');
    if (targetPath !== ':memory:') {
      db.exec('PRAGMA journal_mode = WAL;');
    }
  } catch (e) {
    // Ignore pragma notice for in-memory databases
  }

  // Load and apply schema
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  return db;
}

let defaultDb = null;
function getDatabase() {
  if (!defaultDb) {
    defaultDb = createDatabase();
  }
  return defaultDb;
}

function resetDefaultDatabase() {
  if (defaultDb) {
    try {
      if (typeof defaultDb.close === 'function') defaultDb.close();
    } catch (e) {}
    defaultDb = null;
  }
}

module.exports = {
  createDatabase,
  getDatabase,
  getDbPath,
  resetDefaultDatabase
};
