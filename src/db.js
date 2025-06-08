import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDirectory = path.join(__dirname, '../db');

// Helper function to create and configure a DB connection
const createDbConnection = (dbFileName) => {
  const dbPath = path.join(dbDirectory, dbFileName);
  try {
    const dbInstance = new Database(dbPath, { verbose: console.log });
    dbInstance.pragma('foreign_keys = ON'); // Enable foreign keys for this connection
    console.log(`Successfully connected to ${dbPath}`);
    return dbInstance;
  } catch (error) {
    console.error(`Failed to connect to ${dbPath}:`, error);
    // Depending on desired behavior, you might want to throw the error,
    // or return null/undefined and handle it in the calling code.
    // For now, re-throwing to make failures explicit during setup.
    throw error;
  }
};

const dbs = {
  mainDB: createDbConnection('main.db'),
  travelScheduleDB: createDbConnection('travelschedule.db'),
  bookingDB: createDbConnection('booking.db'),
  travelHistoryDB: createDbConnection('travelhistory.db'),
  refundRequestDB: createDbConnection('refundrequest.db'),
  recommendationDB: createDbConnection('recommendation.db'),
};

// Optional: Add a graceful shutdown mechanism
process.on('exit', () => {
  console.log('Closing database connections...');
  Object.values(dbs).forEach(db => {
    if (db && db.open) {
      db.close();
    }
  });
  console.log('All database connections closed.');
});

export default dbs;