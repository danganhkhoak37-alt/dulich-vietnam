const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

class PostgreSQLAdapter {
  constructor(connectionString) {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const poolConfig = { connectionString };
    if (!isLocal) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
    this.pool = new Pool(poolConfig);
  }

  translateSql(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  async get(sql, params = []) {
    const queryStr = this.translateSql(sql);
    const result = await this.pool.query(queryStr, params);
    return result.rows[0];
  }

  async all(sql, params = []) {
    const queryStr = this.translateSql(sql);
    const result = await this.pool.query(queryStr, params);
    return result.rows;
  }

  async run(sql, params = []) {
    let queryStr = this.translateSql(sql);
    const trimmed = queryStr.trim();
    const isInsert = /^insert\s+into/i.test(trimmed);

    if (isInsert && !/returning\s+/i.test(trimmed)) {
      queryStr += ' RETURNING id';
    }

    const result = await this.pool.query(queryStr, params);
    const lastID = isInsert ? result.rows[0]?.id : undefined;
    return {
      lastID,
      changes: result.rowCount
    };
  }

  async exec(sql) {
    await this.pool.query(sql);
  }

  async close() {
    await this.pool.end();
  }
}

class SQLiteAdapter {
  constructor(filename) {
    this.filename = filename;
    this.db = null;
  }

  async init() {
    this.db = await open({
      filename: this.filename,
      driver: sqlite3.Database
    });
    return this;
  }

  async get(sql, params = []) {
    return this.db.get(sql, params);
  }

  async all(sql, params = []) {
    return this.db.all(sql, params);
  }

  async run(sql, params = []) {
    return this.db.run(sql, params);
  }

  async exec(sql) {
    return this.db.exec(sql);
  }

  async close() {
    await this.db.close();
  }
}

let dbInstance = null;

module.exports = {
  async init() {
    if (dbInstance) return dbInstance;

    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      console.log('🔌 Connecting to PostgreSQL database...');
      dbInstance = new PostgreSQLAdapter(dbUrl);
    } else {
      console.log('🔌 Connecting to local SQLite database...');
      const sqliteAdapter = new SQLiteAdapter('./database.sqlite');
      dbInstance = await sqliteAdapter.init();
    }
    return dbInstance;
  },

  get current() {
    return dbInstance;
  }
};
