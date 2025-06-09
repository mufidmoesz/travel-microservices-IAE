DROP TABLE IF EXISTS "RefundRequest";

CREATE TABLE "RefundRequest" (
  id TEXT PRIMARY KEY,
  bookingId TEXT NOT NULL, -- Was: FOREIGN KEY(bookingId) REFERENCES Booking(id)
  reason TEXT NOT NULL,
  status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')) NOT NULL,
  requestedAt TEXT NOT NULL,
  processedAt TEXT
);
