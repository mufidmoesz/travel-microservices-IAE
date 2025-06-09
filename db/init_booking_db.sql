DROP TABLE IF EXISTS "Booking";

CREATE TABLE "Booking" (
  id TEXT PRIMARY KEY,
  passengerId TEXT NOT NULL, -- Was: FOREIGN KEY(passengerId) REFERENCES Passenger(id)
  scheduleId TEXT NOT NULL, -- Was: FOREIGN KEY(scheduleId) REFERENCES TravelSchedule(id)
  bookingTime TEXT NOT NULL,
  status TEXT CHECK(status IN ('CONFIRMED', 'CANCELLED', 'REFUNDED')) NOT NULL
);
