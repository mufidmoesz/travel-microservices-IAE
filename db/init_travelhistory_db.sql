DROP TABLE IF EXISTS "TravelHistory";

CREATE TABLE "TravelHistory" (
  id TEXT PRIMARY KEY,
  passengerId TEXT NOT NULL, -- Was: FOREIGN KEY(passengerId) REFERENCES Passenger(id)
  scheduleId TEXT NOT NULL, -- Was: FOREIGN KEY(scheduleId) REFERENCES TravelSchedule(id)
  completedAt TEXT NOT NULL,
  rating REAL,
  review TEXT
);
