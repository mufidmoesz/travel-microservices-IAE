import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDirectory = path.join(__dirname, '../db');

// Helper to run SQL file on a PostgreSQL database
async function runSqlFileOnPg({ dbName, sqlFileName }) {
  const sqlFilePath = path.join(dbDirectory, sqlFileName);
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`Error: SQL file not found at ${sqlFilePath}`);
    return false;
  }
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  const pool = new Pool({
    host: process.env.PG_HOST || dbName.replace('_db', '') + '-db',
    user: process.env.PG_USER || 'admin',
    password: process.env.PG_PASSWORD || 'admin',
    database: dbName,
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  });
  try {
    console.log(`Initializing ${dbName}...`);
    for (const statement of sql.split(';')) {
  if (statement.trim()) {
    await pool.query(statement);
  }
}
    console.log(`${dbName} initialized successfully!`);
    return true;
  } catch (error) {
    console.error(`Error initializing ${dbName}:`, error);
    return false;
  } finally {
    await pool.end();
  }
}

// Databases to initialize
const databasesToInitialize = [
  { dbName: 'main_db', sqlFileName: 'init.sql' },
  { dbName: 'travelschedule_db', sqlFileName: 'init_travelschedule_db.sql' },
  { dbName: 'booking_db', sqlFileName: 'init_booking_db.sql' },
  { dbName: 'travelhistory_db', sqlFileName: 'init_travelhistory_db.sql' },
  { dbName: 'refundrequest_db', sqlFileName: 'init_refundrequest_db.sql' },
  { dbName: 'recommendation_db', sqlFileName: 'init_recommendation_db.sql' },
];

(async () => {
  let allInitialized = true;
  console.log('Starting PostgreSQL database initialization process...');
  for (const dbConfig of databasesToInitialize) {
    const ok = await runSqlFileOnPg(dbConfig);
    if (!ok) {
      allInitialized = false;
      console.error(`Failed to initialize ${dbConfig.dbName}.`);
    }
  }
  if (allInitialized) {
    console.log('All PostgreSQL databases initialized successfully and are ready for seeding.');
  } else {
    console.log('One or more database initializations failed. Check logs for details.');
    process.exit(1);
  }
})();
