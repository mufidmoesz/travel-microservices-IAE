import { buildSchema } from 'graphql';

const gql = String.raw;
const typeDefs = gql`
# Jadwal Perjalanan Travel
type TravelSchedule {
  id: ID!
  origin: String!
  destination: String!
  departureTime: String!
  arrivalTime: String!
  price: Float!
  seatsAvailable: Int!
  vehicleType: String
}

# Pengguna
type User {
  id: ID!
  name: String!
  email: String!
  bookings: [Booking]
  history: [TravelHistory]
}

# Pemesanan Travel
type Booking {
  id: ID!
  user: User!
  schedule: TravelSchedule!
  bookingTime: String!
  status: BookingStatus!
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  REFUNDED
}

# Riwayat Perjalanan (sumber dari booking yang sudah selesai)
type TravelHistory {
  id: ID!
  user: User!
  schedule: TravelSchedule!
  completedAt: String!
  rating: Float
  review: String
}

# Permintaan Refund
type RefundRequest {
  id: ID!
  booking: Booking!
  reason: String!
  status: RefundStatus!
  requestedAt: String!
  processedAt: String
}

enum RefundStatus {
  PENDING
  APPROVED
  REJECTED
}

# Rekomendasi berdasarkan histori dan preferensi
type Recommendation {
  id: ID!
  user: User!
  recommendedSchedules: [TravelSchedule]!
  generatedAt: String!
}

# Query: Ambil data
type Query {
  getAllSchedules: [TravelSchedule]
  getUserBookings(userId: ID!): [Booking]
  getUserHistory(userId: ID!): [TravelHistory]
  getRecommendations(userId: ID!): Recommendation
}

# Mutation: Ubah data
type Mutation {
  createBooking(userId: ID!, scheduleId: ID!): Booking
  cancelBooking(bookingId: ID!): Booking
  requestRefund(bookingId: ID!, reason: String!): RefundRequest
  rateTravel(historyId: ID!, rating: Float!, review: String): TravelHistory
}`

export const schema = buildSchema(typeDefs)