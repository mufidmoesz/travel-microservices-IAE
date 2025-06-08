DROP TABLE IF EXISTS Recommendation;

CREATE TABLE Recommendation (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL, -- Was: FOREIGN KEY(userId) REFERENCES User(id)
  recommendedSchedules TEXT NOT NULL, -- This likely stores IDs of schedules from TravelSchedule DB
  generatedAt TEXT NOT NULL
);
