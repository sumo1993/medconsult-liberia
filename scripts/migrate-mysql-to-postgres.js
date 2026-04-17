/* eslint-disable no-console */
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
  return env;
}

function qi(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function pick(row, ...keys) {
  for (const key of keys) {
    if (typeof row[key] !== 'undefined') return row[key];
  }
  return undefined;
}

function mapMySqlTypeToPg(col) {
  const dataType = String(pick(col, 'DATA_TYPE', 'data_type') || '').toLowerCase();
  const colType = String(pick(col, 'COLUMN_TYPE', 'column_type') || '').toLowerCase();
  const maxLen = pick(col, 'CHARACTER_MAXIMUM_LENGTH', 'character_maximum_length');
  const precision = pick(col, 'NUMERIC_PRECISION', 'numeric_precision');
  const scale = pick(col, 'NUMERIC_SCALE', 'numeric_scale');

  if (colType.startsWith('tinyint(1)')) return 'boolean';

  if (['tinyint', 'smallint', 'mediumint', 'int', 'integer'].includes(dataType)) return 'integer';
  if (dataType === 'bigint') return 'bigint';
  if (dataType === 'decimal' || dataType === 'numeric') {
    if (precision && scale !== null) return `numeric(${precision},${scale})`;
    if (precision) return `numeric(${precision})`;
    return 'numeric';
  }
  if (['float', 'double', 'real'].includes(dataType)) return 'double precision';
  if (dataType === 'char') return maxLen ? `char(${maxLen})` : 'char';
  if (dataType === 'varchar') return maxLen ? `varchar(${maxLen})` : 'varchar';
  if (['text', 'mediumtext', 'longtext', 'tinytext'].includes(dataType)) return 'text';
  if (dataType === 'json') return 'jsonb';
  if (['datetime', 'timestamp'].includes(dataType)) return 'timestamp';
  if (dataType === 'date') return 'date';
  if (dataType === 'time') return 'time';
  if (dataType === 'year') return 'integer';
  if (['blob', 'mediumblob', 'longblob', 'tinyblob', 'binary', 'varbinary'].includes(dataType)) return 'bytea';
  if (dataType === 'enum' || dataType === 'set') return 'text';
  return 'text';
}

function normalizeValue(value, col) {
  if (value === null || typeof value === 'undefined') return null;
  const colType = String(pick(col, 'COLUMN_TYPE', 'column_type') || '').toLowerCase();
  const dataType = String(pick(col, 'DATA_TYPE', 'data_type') || '').toLowerCase();
  if (colType.startsWith('tinyint(1)')) {
    return value === 1 || value === '1' || value === true;
  }
  if (dataType === 'json') {
    if (typeof value === 'object') return JSON.stringify(value);
    const raw = String(value).trim();
    try {
      return JSON.stringify(JSON.parse(raw));
    } catch {
      // Fix legacy malformed wrapper like: {"{\"value\":\"67\"}"}
      const wrapped = raw.match(/^\{"([\s\S]*)"\}$/);
      if (wrapped) {
        const unwrapped = wrapped[1]
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        try {
          return JSON.stringify(JSON.parse(unwrapped));
        } catch {
          return JSON.stringify({ raw: unwrapped });
        }
      }
      return JSON.stringify({ raw });
    }
  }
  return value;
}

async function main() {
  const env = parseEnvFile(path.join(__dirname, '..', '.env.local'));

  const mysqlConfig = {
    host: process.env.MYSQL_HOST || env.MYSQL_HOST || process.env.DB_HOST || env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || env.MYSQL_PORT || process.env.DB_PORT || env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || env.MYSQL_USER || process.env.DB_USER || env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || env.MYSQL_PASSWORD || process.env.DB_PASSWORD || env.DB_PASSWORD || '',
    database: process.env.MYSQL_DB || env.MYSQL_DB || process.env.DB_NAME || env.DB_NAME || 'medconsult_liberia',
  };

  const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  console.log('[Migrate] Connecting MySQL:', {
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    database: mysqlConfig.database,
  });

  const mysqlConn = await mysql.createConnection(mysqlConfig);
  const pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  try {
    const [tables] = await mysqlConn.execute(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = ?
       ORDER BY table_name`,
      [mysqlConfig.database]
    );

    const report = [];

    for (const row of tables) {
      const table = pick(row, 'table_name', 'TABLE_NAME');
      console.log(`[Migrate] Table: ${table}`);

      const [columns] = await mysqlConn.execute(
        `SELECT
           COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE,
           CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, COLUMN_KEY
         FROM information_schema.columns
         WHERE table_schema = ? AND table_name = ?
         ORDER BY ORDINAL_POSITION`,
        [mysqlConfig.database, table]
      );

      if (!columns.length) {
        console.log(`[Migrate] Skip empty metadata: ${table}`);
        continue;
      }

      const colDefs = columns.map((col) => {
        const name = qi(pick(col, 'COLUMN_NAME', 'column_name'));
        const type = mapMySqlTypeToPg(col);
        const nullable = String(pick(col, 'IS_NULLABLE', 'is_nullable')) === 'YES' ? '' : ' NOT NULL';
        return `${name} ${type}${nullable}`;
      });

      const createSql = `CREATE TABLE IF NOT EXISTS ${qi(table)} (${colDefs.join(', ')})`;
      await pgPool.query(createSql);

      const pkCols = columns
        .filter((c) => String(pick(c, 'COLUMN_KEY', 'column_key')) === 'PRI')
        .map((c) => pick(c, 'COLUMN_NAME', 'column_name'));
      if (pkCols.length > 0) {
        const pkName = `${table}_pkey`;
        const exists = await pgPool.query(
          `SELECT 1 FROM pg_constraint WHERE conname = $1 LIMIT 1`,
          [pkName]
        );
        if (exists.rowCount === 0) {
          const pkSql = `ALTER TABLE ${qi(table)} ADD CONSTRAINT ${qi(pkName)} PRIMARY KEY (${pkCols.map(qi).join(', ')})`;
          try {
            await pgPool.query(pkSql);
          } catch (e) {
            console.log(`[Migrate] PK skipped for ${table}: ${e.message}`);
          }
        }
      }

      await pgPool.query(`TRUNCATE TABLE ${qi(table)} RESTART IDENTITY CASCADE`);

      const [rows] = await mysqlConn.query(`SELECT * FROM ${table}`);
      if (rows.length === 0) {
        report.push({ table, mysqlRows: 0, pgRows: 0 });
        continue;
      }

      const colNames = columns.map((c) => pick(c, 'COLUMN_NAME', 'column_name'));
      const colList = colNames.map(qi).join(', ');
      const placeholders = colNames.map((_, i) => `$${i + 1}`).join(', ');
      const insertSql = `INSERT INTO ${qi(table)} (${colList}) VALUES (${placeholders})`;

      for (const rawRow of rows) {
        const values = colNames.map((name, idx) => normalizeValue(rawRow[name], columns[idx]));
        await pgPool.query(insertSql, values);
      }

      const pgCountRes = await pgPool.query(`SELECT COUNT(*)::int as count FROM ${qi(table)}`);
      const pgRows = Number(pgCountRes.rows[0]?.count || 0);
      report.push({ table, mysqlRows: rows.length, pgRows });
      console.log(`[Migrate] Done ${table}: ${rows.length} -> ${pgRows}`);
    }

    const reportPath = path.join(__dirname, '..', 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`[Migrate] Completed. Report: ${reportPath}`);
  } finally {
    await mysqlConn.end();
    await pgPool.end();
  }
}

main().catch((error) => {
  console.error('[Migrate] Failed:', error);
  process.exit(1);
});
