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
      
      // Map each schedule to match the GraphQL schema (convert snake_case to camelCase)
      const mappedSchedules = schedules.map(schedule => ({
        id: schedule.id,
        origin: schedule.origin,
        destination: schedule.destination,
        departureTime: schedule.departuretime,
        arrivalTime: schedule.arrivaltime,
        price: schedule.price,
        seatsAvailable: schedule.seatsavailable,
        vehicleType: schedule.vehicletype
      }));
      
      // Fetch the passenger to include in the response
      const { rows: passengerRows } = await dbs.mainDB.query('SELECT * FROM "Passenger" WHERE id = $1', [passengerId]);
      const passenger = passengerRows[0];
      
      // Get next recommendation ID
      const { rows: maxIdRows } = await dbs.recommendationDB.query('SELECT MAX(id) as max_id FROM "Recommendation"');
      const nextId = (maxIdRows[0].max_id || 0) + 1;
      
      return {
        id: nextId,
        passengerId: passengerId,
        recommendedSchedules: mappedSchedules,
        generatedAt: new Date().toISOString(),
        // Include the passenger object for the resolver to use
        _passenger: passenger
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
      return rows.map(row => ({
        id: row.id,
        passengerId: row.passengerid,
        recommendedSchedules: row.recommendedschedules,
        generatedAt: row.generatedat
      }));
    },
  },

  Mutation: {
    createBooking: async (_, { passengerId, scheduleId }) => {
      // Get next booking ID
      const { rows: maxIdRows } = await dbs.bookingDB.query('SELECT MAX(id) as max_id FROM "Booking"');
      const nextId = (maxIdRows[0].max_id || 0) + 1;
      
      const { rows } = await dbs.bookingDB.query(
        'INSERT INTO "Booking" (id, passengerId, scheduleId, bookingTime, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [nextId, passengerId, scheduleId, new Date().toISOString(), 'CONFIRMED']
      );
      if (!rows || rows.length === 0) {
        throw new Error('Failed to create booking');
      }
      const row = rows[0];
      return {
        id: row.id,
        passengerId: row.passengerid,
        scheduleId: row.scheduleid,
        bookingTime: row.bookingtime,
        status: row.status
      };
    },

    cancelBooking: async (_, { bookingId }) => {
      await dbs.bookingDB.query('UPDATE "Booking" SET status = $1 WHERE id = $2', ['CANCELLED', bookingId]);
      const { rows } = await dbs.bookingDB.query('SELECT * FROM "Booking" WHERE id = $1', [bookingId]);
      return rows.map(row => ({
        id: row.id,
        passengerId: row.passengerid,
        scheduleId: row.scheduleid,
        bookingTime: row.bookingtime,
        status: row.status
      }));
    },

    requestRefund: async (_, { bookingId, reason }) => {
      // Get next refund request ID
      const { rows: maxIdRows } = await dbs.refundRequestDB.query('SELECT MAX(id) as max_id FROM "RefundRequest"');
      const nextId = (maxIdRows[0].max_id || 0) + 1;
      
      const { rows } = await dbs.refundRequestDB.query(
        'INSERT INTO "RefundRequest" (id, bookingId, reason, status, requestedAt) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [nextId, bookingId, reason, 'PENDING', new Date().toISOString()]
      );
      return rows.map(row => ({
        id: row.id,
        bookingId: row.bookingid,
        reason: row.reason,
        status: row.status,
        requestedAt: row.requestedat
      }));
    },

    rateTravel: async (_, { historyId, rating, review }) => {
      await dbs.travelHistoryDB.query(
        'UPDATE "TravelHistory" SET rating = $1, review = $2 WHERE id = $3',
        [rating, review, historyId]
      );
      const { rows } = await dbs.travelHistoryDB.query('SELECT * FROM "TravelHistory" WHERE id = $1', [historyId]);
      return rows.map(row => ({
        id: row.id,
        passengerId: row.passengerid,
        scheduleId: row.scheduleid,
        completedAt: row.completedat,
        rating: row.rating,
        review: row.review
      }));
    },
  },

  Booking: {
    passenger: async (booking) => {
      const { rows } = await dbs.mainDB.query('SELECT * FROM "Passenger" WHERE id = $1', [booking.passengerId]);
      if (!rows || rows.length === 0) {
        throw new Error(`Passenger with ID ${booking.passengerId} not found`);
      }
      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email
      };
    },
    schedule: async (booking) => {
      const { rows } = await dbs.travelScheduleDB.query('SELECT * FROM "TravelSchedule" WHERE id = $1', [booking.scheduleId]);
      if (!rows || rows.length === 0) {
        throw new Error(`Schedule with ID ${booking.scheduleId} not found`);
      }
      const row = rows[0];
      return {
        id: row.id,
        origin: row.origin,
        destination: row.destination,
        departureTime: row.departuretime,
        arrivalTime: row.arrivaltime,
        price: row.price,
        seatsAvailable: row.seatsavailable,
        vehicleType: row.vehicletype
      };
    },
  },

  TravelHistory: {
    passenger: async (history) => {
      const { rows } = await dbs.mainDB.query('SELECT * FROM "Passenger" WHERE id = $1', [history.passengerId]);
      if (!rows || rows.length === 0) {
        throw new Error(`Passenger with ID ${history.passengerId} not found`);
      }
      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email
      };
    },
    schedule: async (history) => {
      const { rows } = await dbs.travelScheduleDB.query('SELECT * FROM "TravelSchedule" WHERE id = $1', [history.scheduleId]);
      if (!rows || rows.length === 0) {
        throw new Error(`Schedule with ID ${history.scheduleId} not found`);
      }
      const row = rows[0];
      return {
        id: row.id,
        origin: row.origin,
        destination: row.destination,
        departureTime: row.departuretime,
        arrivalTime: row.arrivaltime,
        price: row.price,
        seatsAvailable: row.seatsavailable,
        vehicleType: row.vehicletype
      };
    },
  },

  RefundRequest: {
    booking: async (refund) => {
      const { rows } = await dbs.bookingDB.query('SELECT * FROM "Booking" WHERE id = $1', [refund.bookingId]);
      if (!rows || rows.length === 0) {
        throw new Error(`Booking with ID ${refund.bookingId} not found`);
      }
      const row = rows[0];
      return {
        id: row.id,
        passengerId: row.passengerid,
        scheduleId: row.scheduleid,
        bookingTime: row.bookingtime,
        status: row.status
      };
    },
  },

  Recommendation: {
    // Resolver for the 'passenger' field of a Recommendation
    passenger: (rec) => {
      // If _passenger is already loaded by the parent resolver, use it
      if (rec._passenger) {
        return {
          id: rec._passenger.id,
          name: rec._passenger.name,
          email: rec._passenger.email
        };
      }
      
      // Otherwise, fetch from database (fallback)
      return dbs.mainDB.query('SELECT * FROM "Passenger" WHERE id = $1', [rec.passengerId])
        .then(({ rows }) => {
          const passenger = rows.map(row => ({
            id: row.id,
            name: row.name,
            email: row.email
          }));
          if (!passenger) {
            console.error(`No passenger found for Recommendation.passenger with passengerId: ${rec.passengerId}`);
            throw new Error(`No passenger found with id ${rec.passengerId}`);
          }
          return passenger;
        });
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
      } catch (e) {
        console.error(`Error parsing or fetching recommendedSchedules for Recommendation.id ${rec.id}: ${rec.recommendedSchedules}`, e);
        return [];
      }
    },
  },
};

export default resolvers;
