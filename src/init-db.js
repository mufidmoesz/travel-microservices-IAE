import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3'; // Import better-sqlite3 directly

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDirectory = path.join(__dirname, '../db');

// Ensure the db directory exists
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

// Helper function to initialize a single database
function initializeSingleDatabase(dbName, sqlFileName) {
  const dbPath = path.join(dbDirectory, dbName);
  const sqlFilePath = path.join(dbDirectory, sqlFileName);
  let db;

  try {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('foreign_keys = OFF'); // Explicitly turn OFF foreign keys for initialization
    console.log(`Initializing ${dbName}...`);

    if (!fs.existsSync(sqlFilePath)) {
      console.error(`Error: SQL file not found at ${sqlFilePath}`);
      // Optionally, create an empty table or handle as an error
      // For now, we'll assume the SQL file *must* exist if specified.
      // If the intention is to create an empty DB if no SQL, adjust logic here.
      if (db) db.close();
      return false;
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim());

    db.transaction(() => {
      statements.forEach(statement => {
        if (statement.trim()) {
          db.prepare(statement).run();
        }
      });
    })();
    
    console.log(`${dbName} initialized successfully at ${dbPath}!`);
    return true;
  } catch (error) {
    console.error(`Error initializing ${dbName}:`, error);
    return false;
  } finally {
    if (db) {
      db.close();
    }
  }
}

// Databases to initialize
const databasesToInitialize = [
  { dbName: 'main.db', sqlFileName: 'init.sql' },
  { dbName: 'travelschedule.db', sqlFileName: 'init_travelschedule_db.sql' },
  { dbName: 'booking.db', sqlFileName: 'init_booking_db.sql' },
  { dbName: 'travelhistory.db', sqlFileName: 'init_travelhistory_db.sql' },
  { dbName: 'refundrequest.db', sqlFileName: 'init_refundrequest_db.sql' },
  { dbName: 'recommendation.db', sqlFileName: 'init_recommendation_db.sql' },
];

let allInitialized = true;

console.log('Starting database initialization process...');

for (const dbConfig of databasesToInitialize) {
  if (!initializeSingleDatabase(dbConfig.dbName, dbConfig.sqlFileName)) {
    allInitialized = false;
    console.error(`Failed to initialize ${dbConfig.dbName}.`);
    // Decide if you want to stop on first failure or try to initialize all
    // process.exit(1); // Uncomment to exit on first failure
  }
}

if (allInitialized) {
  console.log('All databases initialized successfully and are ready for seeding.');
} else {
  console.log('One or more database initializations failed. Check logs for details.');
  process.exit(1); // Exit if any database failed to initialize
}

