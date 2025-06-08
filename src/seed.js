import { randomUUID } from 'crypto';
import dbs from './db.js'; // Changed to import dbs
import { formatISO } from 'date-fns';

// Clear existing data
function clearTables() {
  console.log('Clearing tables...');
  try {
    dbs.refundRequestDB.prepare(`DELETE FROM RefundRequest`).run();
    console.log('RefundRequest table cleared');
    dbs.travelHistoryDB.prepare(`DELETE FROM TravelHistory`).run();
    console.log('TravelHistory table cleared');
    dbs.bookingDB.prepare(`DELETE FROM Booking`).run();
    console.log('Booking table cleared');
    dbs.travelScheduleDB.prepare(`DELETE FROM TravelSchedule`).run();
    console.log('TravelSchedule table cleared');
    dbs.recommendationDB.prepare(`DELETE FROM Recommendation`).run();
    console.log('Recommendation table cleared');
    dbs.mainDB.prepare(`DELETE FROM User`).run();
    console.log('User table cleared');
    console.log('All tables cleared successfully.');
  } catch (error) {
    console.error('Error clearing tables:', error);
    throw error; // Re-throw to stop seeding if clearing fails
  }
}

// Generate random dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Format date to ISO string
function formatDate(date) {
  return formatISO(date);
}

// Create users
function seedUsers() {
  const users = [
    { id: randomUUID(), name: 'John Doe', email: 'john@example.com' },
    { id: randomUUID(), name: 'Jane Smith', email: 'jane@example.com' },
    { id: randomUUID(), name: 'Bob Johnson', email: 'bob@example.com' },
    { id: randomUUID(), name: 'Alice Brown', email: 'alice@example.com' },
    { id: randomUUID(), name: 'Charlie Wilson', email: 'charlie@example.com' }
  ];
  
  const insert = dbs.mainDB.prepare('INSERT INTO User (id, name, email) VALUES (?, ?, ?)');
  dbs.mainDB.transaction(() => {
    users.forEach(user => {
      insert.run(user.id, user.name, user.email);
    });
  })();
  
  console.log(`${users.length} users created in mainDB`);
  return users;
}

// Create travel schedules
function seedTravelSchedules() {
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
  
  routes.forEach(route => {
    for (let i = 0; i < 3; i++) {
      const departureTime = randomDate(now, nextMonth);
      const arrivalTime = new Date(departureTime);
      arrivalTime.setHours(arrivalTime.getHours() + 2 + Math.floor(Math.random() * 4));
      
      const schedule = {
        id: randomUUID(),
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
  
  const insert = dbs.travelScheduleDB.prepare(
    'INSERT INTO TravelSchedule (id, origin, destination, departureTime, arrivalTime, price, seatsAvailable, vehicleType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  dbs.travelScheduleDB.transaction(() => {
    schedules.forEach(schedule => {
      insert.run(
        schedule.id, schedule.origin, schedule.destination, schedule.departureTime,
        schedule.arrivalTime, schedule.price, schedule.seatsAvailable, schedule.vehicleType
      );
    });
  })();
  
  console.log(`${schedules.length} travel schedules created in travelScheduleDB`);
  return schedules;
}

// Create bookings
function seedBookings(users, schedules) {
  const bookings = [];
  const statuses = ['CONFIRMED', 'CANCELLED', 'REFUNDED'];
  
  users.forEach(user => {
    const bookingCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bookingCount; i++) {
      const schedule = schedules[Math.floor(Math.random() * schedules.length)];
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      bookings.push({
        id: randomUUID(),
        userId: user.id,
        scheduleId: schedule.id,
        bookingTime: formatDate(randomDate(oneMonthAgo, now)),
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }
  });
  
  const insert = dbs.bookingDB.prepare(
    'INSERT INTO Booking (id, userId, scheduleId, bookingTime, status) VALUES (?, ?, ?, ?, ?)'
  );
  dbs.bookingDB.transaction(() => {
    bookings.forEach(booking => {
      insert.run(booking.id, booking.userId, booking.scheduleId, booking.bookingTime, booking.status);
    });
  })();
  
  console.log(`${bookings.length} bookings created in bookingDB`);
  return bookings;
}

// Create travel history
function seedTravelHistory(users, schedules) {
  const histories = [];
  const ratings = [4.0, 4.5, 5.0, 3.5, 4.2, 3.0, 5.0];
  const reviews = [
    "Great service, very punctual!", "The driver was very professional.",
    "Comfortable ride, will use again.", "A bit delayed but overall good service.",
    "Very clean vehicle and friendly driver.", null
  ];
  
  users.forEach(user => {
    const historyCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < historyCount; i++) {
      const schedule = schedules[Math.floor(Math.random() * schedules.length)];
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      const hasRating = Math.random() > 0.3;
      histories.push({
        id: randomUUID(),
        userId: user.id,
        scheduleId: schedule.id,
        completedAt: formatDate(randomDate(threeMonthsAgo, now)),
        rating: hasRating ? ratings[Math.floor(Math.random() * ratings.length)] : null,
        review: hasRating ? reviews[Math.floor(Math.random() * reviews.length)] : null
      });
    }
  });
  
  const insert = dbs.travelHistoryDB.prepare(
    'INSERT INTO TravelHistory (id, userId, scheduleId, completedAt, rating, review) VALUES (?, ?, ?, ?, ?, ?)'
  );
  dbs.travelHistoryDB.transaction(() => {
    histories.forEach(history => {
      insert.run(history.id, history.userId, history.scheduleId, history.completedAt, history.rating, history.review);
    });
  })();
  
  console.log(`${histories.length} travel history entries created in travelHistoryDB`);
  return histories;
}

// Create refund requests
function seedRefundRequests(bookings) {
  const refundRequests = [];
  const reasons = [
    "Change of plans", "Found a better option", "Emergency situation",
    "Schedule conflict", "Weather concerns"
  ];
  const eligibleBookings = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REFUNDED');
  
  eligibleBookings.forEach(booking => {
    if (Math.random() > 0.3) {
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const requestedAt = randomDate(oneMonthAgo, now);
      const processedAt = Math.random() > 0.5 ? randomDate(requestedAt, now) : null;
      refundRequests.push({
        id: randomUUID(),
        bookingId: booking.id,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        status: processedAt ? (Math.random() > 0.7 ? 'APPROVED' : 'REJECTED') : 'PENDING',
        requestedAt: formatDate(requestedAt),
        processedAt: processedAt ? formatDate(processedAt) : null
      });
    }
  });
  
  const insert = dbs.refundRequestDB.prepare(
    'INSERT INTO RefundRequest (id, bookingId, reason, status, requestedAt, processedAt) VALUES (?, ?, ?, ?, ?, ?)'
  );
  dbs.refundRequestDB.transaction(() => {
    refundRequests.forEach(request => {
      insert.run(request.id, request.bookingId, request.reason, request.status, request.requestedAt, request.processedAt);
    });
  })();
  
  console.log(`${refundRequests.length} refund requests created in refundRequestDB`);
  return refundRequests;
}

// Create recommendations
function seedRecommendations(users, schedules) { // Added schedules parameter
  const recommendationsData = [];
  
  users.forEach(user => {
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
        id: randomUUID(),
        userId: user.id,
        recommendedSchedules: JSON.stringify(recommendedScheduleIds), // Store as JSON string
        generatedAt: formatDate(randomDate(oneWeekAgo, now))
      });
    }
  });
  
  const insert = dbs.recommendationDB.prepare(
    'INSERT INTO Recommendation (id, userId, recommendedSchedules, generatedAt) VALUES (?, ?, ?, ?)' // Added recommendedSchedules
  );
  dbs.recommendationDB.transaction(() => {
    recommendationsData.forEach(rec => {
      insert.run(rec.id, rec.userId, rec.recommendedSchedules, rec.generatedAt);
    });
  })();
  
  console.log(`${recommendationsData.length} recommendations created in recommendationDB`);
  return recommendationsData;
}

// Run the seeder
function seedDatabase() {
  console.log('Starting database seeding process...');
  try {
    clearTables();
    
    const users = seedUsers();
    const schedules = seedTravelSchedules(); // This now returns schedules
    const bookings = seedBookings(users, schedules);
    seedTravelHistory(users, schedules);
    seedRefundRequests(bookings);
    seedRecommendations(users, schedules); // Pass schedules to seedRecommendations
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    // Consider how to handle partial seeding if an error occurs mid-process
  }
}

// Execute the seeder
seedDatabase();

