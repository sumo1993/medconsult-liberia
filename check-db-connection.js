const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

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

async function run() {
  const localEnv = parseEnvFile(path.join(__dirname, '.env.local'));
  const dbClient = (process.env.DB_CLIENT || localEnv.DB_CLIENT || 'mysql').toLowerCase();
  const usePostgres = dbClient === 'postgres' || dbClient === 'postgresql' || !!(process.env.DATABASE_URL || localEnv.DATABASE_URL);

  if (usePostgres) {
    const connectionString = process.env.DATABASE_URL || localEnv.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL is required for PostgreSQL mode.');
      process.exitCode = 1;
      return;
    }

    console.log('Checking PostgreSQL connection with:');
    console.log({
      client: 'postgres',
      databaseUrlSet: true,
      ssl: (process.env.PGSSLMODE || localEnv.PGSSLMODE || 'require') !== 'disable',
    });

    let Pool;
    try {
      ({ Pool } = require('pg'));
    } catch {
      console.error('PostgreSQL mode requires `pg`. Run: npm install');
      process.exitCode = 1;
      return;
    }

    const pgPool = new Pool({
      connectionString,
      ssl: (process.env.PGSSLMODE || localEnv.PGSSLMODE || 'require') === 'disable' ? false : { rejectUnauthorized: false },
      max: Number(process.env.DB_POOL_MAX || localEnv.DB_POOL_MAX || 10),
    });

    try {
      const result = await pgPool.query('SELECT 1 + 1 AS result');
      console.log('PostgreSQL connection OK. Test query result:', result.rows[0]?.result);
      process.exitCode = 0;
    } catch (error) {
      console.error('PostgreSQL connection failed.');
      console.error({
        message: error.message || null,
        code: error.code || null,
      });
      process.exitCode = 1;
    } finally {
      await pgPool.end();
    }
    return;
  }

  const config = {
    host: process.env.DB_HOST || localEnv.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || localEnv.DB_PORT || 3306),
    user: process.env.DB_USER || localEnv.DB_USER || 'root',
    password: process.env.DB_PASSWORD || localEnv.DB_PASSWORD || '',
    database: process.env.DB_NAME || localEnv.DB_NAME || 'medconsult_liberia',
    connectTimeout: 10000,
  };

  console.log('Checking database connection with:');
  console.log({
    client: 'mysql',
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
  });

  let connection;
  try {
    connection = await mysql.createConnection(config);
    const [result] = await connection.query('SELECT 1 + 1 AS result');
    console.log('Database connection OK. Test query result:', result[0]?.result);
    process.exitCode = 0;
  } catch (error) {
    console.error('Database connection failed.');
    console.error({
      message: error.message || null,
      code: error.code || null,
      errno: error.errno || null,
      sqlState: error.sqlState || null,
      sqlMessage: error.sqlMessage || null,
    });
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
