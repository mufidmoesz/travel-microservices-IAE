import { randomUUID } from 'crypto';
import dbs from './db.js'; // Changed to import dbs
import { formatISO } from 'date-fns';

// Clear existing data
async function clearTables() {
  console.log('Clearing tables...');
  try {
    await dbs.refundRequestDB.query('DELETE FROM "RefundRequest"');
    await dbs.travelHistoryDB.query('DELETE FROM "TravelHistory"');
    await dbs.bookingDB.query('DELETE FROM "Booking"');
    await dbs.travelScheduleDB.query('DELETE FROM "TravelSchedule"');
    await dbs.recommendationDB.query('DELETE FROM "Recommendation"');
    await dbs.mainDB.query('DELETE FROM "Passenger"');
    console.log('All tables cleared successfully.');
  } catch (error) {
    console.error('Error clearing tables:', error);
    throw error; // Re-throw to stop seeding if clearing fails
  }
}

// Generate random dates
function randomDate(start, end) {
  if (!(start instanceof Date) || !(end instanceof Date) || isNaN(start) || isNaN(end) || end <= start) {
    console.warn('Invalid date range for randomDate:', start, end);
    // fallback: return current date
    return new Date();
  }
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Format date to ISO string
function formatDate(date) {
  return formatISO(date);
}

// Create passengers
async function seedPassengers() {
  const passengers = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com' }
  ];

  const insertPassengerQuery = 'INSERT INTO "Passenger" (id, name, email) VALUES ($1, $2, $3)';
  for (const passenger of passengers) {
    await dbs.mainDB.query(insertPassengerQuery, [passenger.id, passenger.name, passenger.email]);
  }

  console.log(`${passengers.length} passengers created in mainDB`);
  return passengers;
}

// Create travel schedules
async function seedTravelSchedules() {
  const routes = [
    { origin: 'Jakarta', destination: 'Bandung' },
    { origin: 'Jakarta', destination: 'Bogor' },
    { origin: 'Bandung', destination: 'Jakarta' },
    { origin: 'Surabaya', destination: 'Malang' },
    { origin: 'Yogyakarta', destination: 'Solo' },
    { origin: 'Semarang', destination: 'Yogyakarta' },
    { origin: 'Jakarta', destination: 'Semarang' }
  ];
  
  const vehicleTypes = ['SUV', 'Van', 'Minibus', 'Sedan'];
  
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);
  
  const schedules = [];
  
  let scheduleId = 1;
  
  routes.forEach(route => {
    for (let i = 0; i < 3; i++) {
      const departureTime = randomDate(now, nextMonth);
      if (!(departureTime instanceof Date) || isNaN(departureTime)) {
        console.warn('Invalid departureTime generated:', departureTime);
      }
      const arrivalTime = new Date(departureTime);
      arrivalTime.setHours(arrivalTime.getHours() + 2 + Math.floor(Math.random() * 4));
      if (!(arrivalTime instanceof Date) || isNaN(arrivalTime)) {
        console.warn('Invalid arrivalTime generated:', arrivalTime);
      }
      
      const schedule = {
        id: scheduleId++,
        origin: route.origin,
        destination: route.destination,
        departureTime: formatDate(departureTime),
        arrivalTime: formatDate(arrivalTime),
        price: 50000 + Math.floor(Math.random() * 200000),
        seatsAvailable: 5 + Math.floor(Math.random() * 10),
        vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)]
      };
      schedules.push(schedule);
    }
  });
  
  const insertScheduleQuery = 'INSERT INTO "TravelSchedule" (id, origin, destination, departureTime, arrivalTime, price, seatsAvailable, vehicleType) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
  for (const schedule of schedules) {
    await dbs.travelScheduleDB.query(insertScheduleQuery, [schedule.id, schedule.origin, schedule.destination, schedule.departureTime, schedule.arrivalTime, schedule.price, schedule.seatsAvailable, schedule.vehicleType]);
  }
  
  console.log(`${schedules.length} travel schedules created in travelScheduleDB`);
  return schedules;
}

// Create bookings
async function seedBookings(passengers, schedules) {
  const bookings = [];
  const statuses = ['CONFIRMED', 'CANCELLED', 'REFUNDED'];
  
  let bookingId = 1;
  
  passengers.forEach(passenger => {
    const bookingCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bookingCount; i++) {
      const schedule = schedules[Math.floor(Math.random() * schedules.length)];
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      bookings.push({
        id: bookingId++,
        passengerId: passenger.id,
        scheduleId: schedule.id,
        bookingTime: formatDate(randomDate(oneMonthAgo, now)),
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }
  });
  
  const insertBookingQuery = 'INSERT INTO "Booking" (id, passengerId, scheduleId, bookingTime, status) VALUES ($1, $2, $3, $4, $5)';
  for (const booking of bookings) {
    await dbs.bookingDB.query(insertBookingQuery, [booking.id, booking.passengerId, booking.scheduleId, booking.bookingTime, booking.status]);
  }
  
  console.log(`${bookings.length} bookings created in bookingDB`);
  return bookings;
}

// Create travel history
async function seedTravelHistory(passengers, schedules) {
  const histories = [];
  const ratings = [4.0, 4.5, 5.0, 3.5, 4.2, 3.0, 5.0];
  const reviews = [
    "Great service, very punctual!", "The driver was very professional.",
    "Comfortable ride, will use again.", "A bit delayed but overall good service.",
    "Very clean vehicle and friendly driver.", null
  ];
  
  let historyId = 1;
  
  passengers.forEach(passenger => {
    const historyCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < historyCount; i++) {
      const schedule = schedules[Math.floor(Math.random() * schedules.length)];
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      const completedAt = formatDate(randomDate(threeMonthsAgo, now));
      const hasRating = Math.random() > 0.3;
      histories.push({
        id: historyId++,
        passengerId: passenger.id,
        scheduleId: schedule.id,
        completedAt,
        rating: hasRating ? ratings[Math.floor(Math.random() * ratings.length)] : null,
        review: hasRating ? reviews[Math.floor(Math.random() * reviews.length)] : null
      });
    }
  });
  
  const insertHistoryQuery = 'INSERT INTO "TravelHistory" (id, passengerId, scheduleId, completedAt, rating, review) VALUES ($1, $2, $3, $4, $5, $6)';
  for (const history of histories) {
    await dbs.travelHistoryDB.query(insertHistoryQuery, [history.id, history.passengerId, history.scheduleId, history.completedAt, history.rating, history.review]);
  }
  
  console.log(`${histories.length} travel history entries created in travelHistoryDB`);
  return histories;
}

// Create refund requests
async function seedRefundRequests(bookings) {
  const refundRequests = [];
  const reasons = [
    "Change of plans", "Found a better option", "Emergency situation",
    "Schedule conflict", "Weather concerns"
  ];
  const eligibleBookings = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REFUNDED');
  
  let refundRequestId = 1;
  
  eligibleBookings.forEach(booking => {
    if (Math.random() > 0.3) {
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const requestedAt = randomDate(oneMonthAgo, now);
      const processedAt = Math.random() > 0.5 ? randomDate(requestedAt, now) : null;
      refundRequests.push({
        id: refundRequestId++,
        bookingId: booking.id,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        status: processedAt ? (Math.random() > 0.7 ? 'APPROVED' : 'REJECTED') : 'PENDING',
        requestedAt: formatDate(requestedAt),
        processedAt: processedAt ? formatDate(processedAt) : null
      });
    }
  });
  
  const insertRefundQuery = 'INSERT INTO "RefundRequest" (id, bookingId, reason, status, requestedAt, processedAt) VALUES ($1, $2, $3, $4, $5, $6)';
  for (const refund of refundRequests) {
    await dbs.refundRequestDB.query(insertRefundQuery, [refund.id, refund.bookingId, refund.reason, refund.status, refund.requestedAt, refund.processedAt]);
  }
  
  console.log(`${refundRequests.length} refund requests created in refundRequestDB`);
  return refundRequests;
}

// Create recommendations
async function seedRecommendations(passengers, schedules) {
  const recommendationsData = [];
  
  let recommendationId = 1;
  
  passengers.forEach(passenger => {
    if (Math.random() > 0.5) {
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);

      // Select 1 to 3 random schedule IDs for recommendation
      const numRecs = 1 + Math.floor(Math.random() * 3);
      const recommendedScheduleIds = [];
      if (schedules.length > 0) {
        for (let i = 0; i < numRecs; i++) {
          recommendedScheduleIds.push(schedules[Math.floor(Math.random() * schedules.length)].id);
        }
      }
      
      recommendationsData.push({
        id: recommendationId++,
        passengerId: passenger.id,
        recommendedSchedules: JSON.stringify(recommendedScheduleIds), // Store as JSON string
        generatedAt: formatDate(randomDate(oneWeekAgo, now))
      });
    }
  });
  
  const insertRecommendationQuery = 'INSERT INTO "Recommendation" (id, passengerId, recommendedSchedules, generatedAt) VALUES ($1, $2, $3, $4)';
  for (const rec of recommendationsData) {
    await dbs.recommendationDB.query(insertRecommendationQuery, [rec.id, rec.passengerId, rec.recommendedSchedules, rec.generatedAt]);
  }
  
  console.log(`${recommendationsData.length} recommendations created in recommendationDB`);
  return recommendationsData;
}

// Run the seeder
async function seedDatabase() {
  console.log('Starting database seeding process...');
  try {
    await clearTables();
    const passengers = await seedPassengers();
    const schedules = await seedTravelSchedules();
    const bookings = await seedBookings(passengers, schedules);
    await seedTravelHistory(passengers, schedules);
    await seedRefundRequests(bookings);
    await seedRecommendations(passengers, schedules);
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    // Consider how to handle partial seeding if an error occurs mid-process
  }
}

// Execute the seeder
seedDatabase();
