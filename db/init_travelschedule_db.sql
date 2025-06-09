DROP TABLE IF EXISTS "TravelSchedule";

CREATE TABLE "TravelSchedule" (
  id TEXT PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departureTime TEXT NOT NULL,
  arrivalTime TEXT NOT NULL,
  price REAL NOT NULL,
  seatsAvailable INTEGER NOT NULL,
  vehicleType TEXT
);
