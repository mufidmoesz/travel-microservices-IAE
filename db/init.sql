DROP TABLE IF EXISTS "Passenger";

CREATE TABLE "Passenger" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);