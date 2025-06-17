import { v4 as uuidv4 } from 'uuid';
import dbs from './db.js'; // Changed to import dbs

const resolvers = {
  Query: {
    getAllSchedules: async () => {
      const { rows } = await dbs.travelScheduleDB.query('SELECT * FROM "TravelSchedule"');
      // Map to camelCase fields as required by GraphQL schema
      return rows.map(row => ({
        id: row.id,
        origin: row.origin,
        destination: row.destination,
        departureTime: row.departuretime,
        arrivalTime: row.arrivaltime,
        price: row.price,
        seatsAvailable: row.seatsavailable,
        vehicleType: row.vehicletype
      }));
    },

    getPassengerBookings: async (_, { passengerId }) => {
      const { rows } = await dbs.bookingDB.query('SELECT * FROM "Booking" WHERE passengerId = $1', [passengerId]);
      return rows.map(row => ({
        id: row.id,
        passengerId: row.passengerid,
        scheduleId: row.scheduleid,
        bookingTime: row.bookingtime,
        status: row.status
      }));
    },

    getPassengerHistory: async (_, { passengerId }) => {
      const { rows } = await dbs.travelHistoryDB.query('SELECT * FROM "TravelHistory" WHERE passengerId = $1', [passengerId]);
      return rows.map(row => ({
        id: row.id,
        passengerId: row.passengerid,
        scheduleId: row.scheduleid,
        completedAt: row.completedat,
        rating: row.rating,
        review: row.review
      }));
    },

    getRecommendations: async (_, { passengerId }) => {
      const { rows: schedules } = await dbs.travelScheduleDB.query('SELECT * FROM "TravelSchedule" ORDER BY RANDOM() LIMIT 3');
      return {
        id: uuidv4(),
        passengerId: passengerId,
        recommendedSchedules: schedules,
        generatedAt: new Date().toISOString(),
      };
    },

    getPassengers: async () => {
      const { rows } = await dbs.mainDB.query('SELECT * FROM "Passenger"');
      return rows;
    },

    getAllBookings: async () => {
      const { rows } = await dbs.bookingDB.query('SELECT * FROM "Booking"');
      return rows.map(row => ({
        id: row.id,
        passengerId: row.passengerid,
        scheduleId: row.scheduleid,
        bookingTime: row.bookingtime,
        status: row.status
      }));
    },

    getAllRefundRequests: async () => {
      const { rows } = await dbs.refundRequestDB.query('SELECT * FROM "RefundRequest"');
      return rows;
    },

    getAllTravelHistories: async () => {
      const { rows } = await dbs.travelHistoryDB.query('SELECT * FROM "TravelHistory"');
      return rows.map(row => ({
        id: row.id,
        passengerId: row.passengerid,
        scheduleId: row.scheduleid,
        completedAt: row.completedat,
        rating: row.rating,
        review: row.review
      }));
    },

    getAllRecommendations: async () => {
      const { rows } = await dbs.recommendationDB.query('SELECT * FROM "Recommendation"');
      return rows;
    },
  },

  Mutation: {
    createBooking: async (_, { passengerId, scheduleId }) => {
      const id = uuidv4();
      const bookingTime = new Date().toISOString();
      const status = 'CONFIRMED';
      await dbs.bookingDB.query(
        'INSERT INTO "Booking" (id, passengerId, scheduleId, bookingTime, status) VALUES ($1, $2, $3, $4, $5)',
        [id, passengerId, scheduleId, bookingTime, status]
      );
      return { id, passengerId, scheduleId, bookingTime, status };
    },

    cancelBooking: async (_, { bookingId }) => {
      await dbs.bookingDB.query('UPDATE "Booking" SET status = $1 WHERE id = $2', ['CANCELLED', bookingId]);
      const { rows } = await dbs.bookingDB.query('SELECT * FROM "Booking" WHERE id = $1', [bookingId]);
      return rows[0];
    },

    requestRefund: async (_, { bookingId, reason }) => {
      const id = uuidv4();
      const requestedAt = new Date().toISOString();
      const status = 'PENDING';

      await dbs.refundRequestDB.query(
        'INSERT INTO "RefundRequest" (id, bookingId, reason, status, requestedAt) VALUES ($1, $2, $3, $4, $5)',
        [id, bookingId, reason, status, requestedAt]
      );

      // Return structure that RefundRequest type resolvers can use
      return { id, bookingId, reason, status, requestedAt };
    },

    rateTravel: async (_, { historyId, rating, review }) => {
      await dbs.travelHistoryDB.query(
        'UPDATE "TravelHistory" SET rating = $1, review = $2 WHERE id = $3',
        [rating, review, historyId]
      );
      const { rows } = await dbs.travelHistoryDB.query('SELECT * FROM "TravelHistory" WHERE id = $1', [historyId]);
      return rows[0];
    },
  },

  Booking: {
    passenger: async (booking) => {
      const { rows } = await dbs.mainDB.query('SELECT * FROM "Passenger" WHERE id = $1', [booking.passengerId]);
      return rows[0];
    },
    schedule: async (booking) => {
      const { rows } = await dbs.travelScheduleDB.query('SELECT * FROM "TravelSchedule" WHERE id = $1', [booking.scheduleId]);
      return rows[0];
    },
  },

  TravelHistory: {
    passenger: async (history) => {
      const { rows } = await dbs.mainDB.query('SELECT * FROM "Passenger" WHERE id = $1', [history.passengerId]);
      return rows[0];
    },
    schedule: async (history) => {
      const { rows } = await dbs.travelScheduleDB.query('SELECT * FROM "TravelSchedule" WHERE id = $1', [history.scheduleId]);
      return rows[0];
    },
  },

  RefundRequest: {
    booking: async (refund) => {
      const { rows } = await dbs.bookingDB.query('SELECT * FROM "Booking" WHERE id = $1', [refund.bookingId]);
      return rows[0];
    },
  },

  Recommendation: {
    // Resolver for the 'passenger' field of a Recommendation object
    passenger: async (rec) => {
      const { rows } = await dbs.mainDB.query('SELECT * FROM "Passenger" WHERE id = $1', [rec.passengerId]);
      return rows[0];
    },
    // Resolver for the 'recommendedSchedules' field of a Recommendation object
    recommendedSchedules: async (rec) => {
      if (Array.isArray(rec.recommendedSchedules) && rec.recommendedSchedules.length > 0 && typeof rec.recommendedSchedules[0] === 'object') {
        return rec.recommendedSchedules;
      }
      if (typeof rec.recommendedSchedules !== 'string') {
        return [];
      }
      try {
        const scheduleIds = JSON.parse(rec.recommendedSchedules);
        if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
          return [];
        }
        const stringScheduleIds = scheduleIds.map(id => String(id));
        const placeholders = stringScheduleIds.map((_, i) => `$${i + 1}`).join(',');
        const { rows } = await dbs.travelScheduleDB.query(`SELECT * FROM "TravelSchedule" WHERE id IN (${placeholders})`, stringScheduleIds);
        return rows;
      } catch (e) {
        console.error(`Error parsing or fetching recommendedSchedules for Recommendation.id ${rec.id}: ${rec.recommendedSchedules}`, e);
        return [];
      }
    },
  },
};

export default resolvers;
