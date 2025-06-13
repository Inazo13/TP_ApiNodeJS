const Database = require('better-sqlite3');
const db = new Database('superheros.db');
db.exec(`CREATE TABLE IF NOT EXISTS heroes (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
publisher TEXT,
gender TEXT,
race TEXT,
power TEXT,
alignment TEXT,
height_cm INTEGER,
weight_kg INTEGER,
createdAt TEXT
);`);
module.exports = db;