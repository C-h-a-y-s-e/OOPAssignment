import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

function requireEnv(name: string, allowEmpty = false): string {
  const value = process.env[name];
  if (value === undefined || (!allowEmpty && value === '')) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const host = requireEnv('DB_HOST');
  const port = Number(requireEnv('DB_PORT'));
  const user = requireEnv('DB_USERNAME');
  const password = requireEnv('DB_PASSWORD', true);
  const database = requireEnv('DB_DATABASE');

  if (Number.isNaN(port)) {
    throw new Error('DB_PORT must be a number');
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    console.log(`Database ready: ${database}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Failed to setup database:', error);
  process.exit(1);
});
