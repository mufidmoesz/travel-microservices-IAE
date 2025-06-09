DROP TABLE IF EXISTS "Recommendation";

CREATE TABLE "Recommendation" (
  id TEXT PRIMARY KEY,
  passengerId TEXT NOT NULL, -- Was: FOREIGN KEY(passengerId) REFERENCES Passenger(id)
  recommendedSchedules TEXT NOT NULL, -- This likely stores IDs of schedules from TravelSchedule DB
  generatedAt TEXT NOT NULL
);
