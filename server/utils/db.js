const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/campus_food.db');

// 创建数据库连接
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 查询方法
const query = (sql, params = []) => {
  return db.prepare(sql).all(...params);
};

const get = (sql, params = []) => {
  return db.prepare(sql).get(...params);
};

const run = (sql, params = []) => {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return { id: result.lastInsertRowid, changes: result.changes };
};

module.exports = { db, query, get, run };
