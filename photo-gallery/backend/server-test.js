// server-test.js - Runs the backend server using an in-memory MongoDB instance for E2E/browser testing
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Inject testing environment variables
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'testjwtsecret987654321';
    process.env.PORT = '5000';
    process.env.NODE_ENV = 'test-server';
    
    console.log(`📡 E2E Testing Server: In-Memory MongoDB started at ${uri}`);
    
    // Require the standard server startup file
    require('./server');
  } catch (err) {
    console.error('Failed to boot in-memory database server:', err);
    process.exit(1);
  }
})();
