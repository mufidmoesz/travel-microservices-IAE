import { v4 as uuidv4 } from 'uuid';
import dbs from './db.js'; // Changed to import dbs

const resolvers = {
  Query: {
    getAllSchedules: () => {
      return dbs.travelScheduleDB.prepare('SELECT * FROM TravelSchedule').all();
    },

    getUserBookings: (_, { userId }) => {
      return dbs.bookingDB.prepare('SELECT * FROM Booking WHERE userId = ?').all(userId);
    },

    getUserHistory: (_, { userId }) => {
      return dbs.travelHistoryDB.prepare('SELECT * FROM TravelHistory WHERE userId = ?').all(userId);
    },

    getRecommendations: (_, { userId }) => {
      // This query generates a new recommendation on the fly
      const schedules = dbs.travelScheduleDB.prepare('SELECT * FROM TravelSchedule ORDER BY RANDOM() LIMIT 3').all(); // Get some random schedules
      return {
        id: uuidv4(),
        userId: userId, // Pass userId directly for the Recommendation.user resolver
        recommendedSchedules: schedules, // Schedules are already resolved here
        generatedAt: new Date().toISOString(),
      };
    },

    getUsers: () => {
      return dbs.mainDB.prepare('SELECT * FROM User').all();
    },

    getAllBookings: () => {
      return dbs.bookingDB.prepare('SELECT * FROM Booking').all();
    },

    getAllRefundRequests: () => {
      return dbs.refundRequestDB.prepare('SELECT * FROM RefundRequest').all();
    },

    getAllTravelHistories: () => {
      return dbs.travelHistoryDB.prepare('SELECT * FROM TravelHistory').all();
    },

    getAllRecommendations: () => {
      // This fetches stored recommendations. The Recommendation type resolver will handle fetching user and schedules.
      return dbs.recommendationDB.prepare('SELECT * FROM Recommendation').all();
    },
  },

  Mutation: {
    createBooking: (_, { userId, scheduleId }) => {
      const id = uuidv4();
      const bookingTime = new Date().toISOString();
      const status = 'CONFIRMED';

      dbs.bookingDB.prepare(
        'INSERT INTO Booking (id, userId, scheduleId, bookingTime, status) VALUES (?, ?, ?, ?, ?)'
      ).run(id, userId, scheduleId, bookingTime, status);
      
      // Return structure that Booking type resolvers can use
      return { id, userId, scheduleId, bookingTime, status };
    },

    cancelBooking: (_, { bookingId }) => {
      dbs.bookingDB.prepare('UPDATE Booking SET status = ? WHERE id = ?').run('CANCELLED', bookingId);
      const booking = dbs.bookingDB.prepare('SELECT * FROM Booking WHERE id = ?').get(bookingId);
      return booking;
    },

    requestRefund: (_, { bookingId, reason }) => {
      const id = uuidv4();
      const requestedAt = new Date().toISOString();
      const status = 'PENDING';

      dbs.refundRequestDB.prepare(
        'INSERT INTO RefundRequest (id, bookingId, reason, status, requestedAt) VALUES (?, ?, ?, ?, ?)'
      ).run(id, bookingId, reason, status, requestedAt);

      // Return structure that RefundRequest type resolvers can use
      return { id, bookingId, reason, status, requestedAt };
    },

    rateTravel: (_, { historyId, rating, review }) => {
      dbs.travelHistoryDB.prepare(
        'UPDATE TravelHistory SET rating = ?, review = ? WHERE id = ?'
      ).run(rating, review, historyId);

      return dbs.travelHistoryDB.prepare('SELECT * FROM TravelHistory WHERE id = ?').get(historyId);
    },
  },

  Booking: {
    user: (booking) => dbs.mainDB.prepare('SELECT * FROM User WHERE id = ?').get(booking.userId),
    schedule: (booking) => dbs.travelScheduleDB.prepare('SELECT * FROM TravelSchedule WHERE id = ?').get(booking.scheduleId),
  },

  TravelHistory: {
    user: (history) => dbs.mainDB.prepare('SELECT * FROM User WHERE id = ?').get(history.userId),
    schedule: (history) => dbs.travelScheduleDB.prepare('SELECT * FROM TravelSchedule WHERE id = ?').get(history.scheduleId),
  },

  RefundRequest: {
    booking: (refund) => dbs.bookingDB.prepare('SELECT * FROM Booking WHERE id = ?').get(refund.bookingId),
  },

  Recommendation: {
    // Resolver for the 'user' field of a Recommendation object
    user: (rec) => {
      // rec.userId comes from the Recommendation table or from the getRecommendations query result
      return dbs.mainDB.prepare('SELECT * FROM User WHERE id = ?').get(rec.userId);
    },
    // Resolver for the 'recommendedSchedules' field of a Recommendation object
    recommendedSchedules: (rec) => {
      // If rec.recommendedSchedules is already an array of objects (e.g., from getRecommendations query),
      // GraphQL will use it directly. This resolver is for when it's a string from the DB (e.g. from getAllRecommendations).
      if (Array.isArray(rec.recommendedSchedules) && rec.recommendedSchedules.length > 0 && typeof rec.recommendedSchedules[0] === 'object') {
        return rec.recommendedSchedules;
      }

      if (typeof rec.recommendedSchedules !== 'string') {
        console.warn('Recommendation.recommendedSchedules expected a string of schedule IDs but received:', rec.recommendedSchedules);
        return [];
      }

      try {
        const scheduleIds = JSON.parse(rec.recommendedSchedules);
        if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
          return [];
        }
        // Ensure IDs are strings, as they are TEXT in the DB
        const stringScheduleIds = scheduleIds.map(id => String(id));
        const placeholders = stringScheduleIds.map(() => '?').join(',');
        const stmt = dbs.travelScheduleDB.prepare(`SELECT * FROM TravelSchedule WHERE id IN (${placeholders})`);
        return stmt.all(...stringScheduleIds);
      } catch (e) {
        console.error(`Error parsing or fetching recommendedSchedules for Recommendation.id ${rec.id}: ${rec.recommendedSchedules}`, e);
        return []; 
      }
    },
  },
};

export default resolvers;

