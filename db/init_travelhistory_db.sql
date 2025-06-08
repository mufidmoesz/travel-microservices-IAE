DROP TABLE IF EXISTS TravelHistory;

CREATE TABLE TravelHistory (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL, -- Was: FOREIGN KEY(userId) REFERENCES User(id)
  scheduleId TEXT NOT NULL, -- Was: FOREIGN KEY(scheduleId) REFERENCES TravelSchedule(id)
  completedAt TEXT NOT NULL,
  rating REAL,
  review TEXT
);
