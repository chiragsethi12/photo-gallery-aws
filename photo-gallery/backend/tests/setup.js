// tests/setup.js - Jest environment configuration and in-memory MongoDB hook
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testjwtsecret987654321';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Mock connectDB so server.js does not attempt real DB calls
jest.mock('../config/db', () => jest.fn());

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Close any existing mongoose connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  // Clear mock states
  jest.clearAllMocks();

  // Clear MongoDB collections between test runs
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  }
});
