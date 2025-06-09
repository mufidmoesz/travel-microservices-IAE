import { Pool } from 'pg';

// Map logical DB names to Docker Compose service hostnames
const dbHostMap = {
  main_db: 'main-db',
  travelschedule_db: 'travelschedule-db',
  booking_db: 'booking-db',
  travelhistory_db: 'travelhistory-db',
  refundrequest_db: 'refundrequest-db',
  recommendation_db: 'recommendation-db',
};

// Helper function to create a PostgreSQL pool
function createPgPool({ database }) {
  return new Pool({
    host: process.env.PG_HOST || dbHostMap[database],
    user: process.env.PG_USER || 'admin',
    password: process.env.PG_PASSWORD || 'admin',
    database: process.env.PG_DATABASE || database,
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  });
}

const dbs = {
  mainDB: createPgPool({ database: 'main_db' }),
  travelScheduleDB: createPgPool({ database: 'travelschedule_db' }),
  bookingDB: createPgPool({ database: 'booking_db' }),
  travelHistoryDB: createPgPool({ database: 'travelhistory_db' }),
  refundRequestDB: createPgPool({ database: 'refundrequest_db' }),
  recommendationDB: createPgPool({ database: 'recommendation_db' }),
};

// Graceful shutdown for pools
process.on('exit', async () => {
  console.log('Closing PostgreSQL pools...');
  await Promise.all(Object.values(dbs).map(pool => pool.end()));
  console.log('All PostgreSQL pools closed.');
});

export default dbs;