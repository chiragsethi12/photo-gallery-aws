// e2e/start-servers.js - Combined backend + frontend static server for E2E testing
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../frontend/build');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

(async () => {
  try {
    // 1. Start in-memory MongoDB
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // 2. Set env vars BEFORE requiring the backend
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'testjwtsecret987654321';
    process.env.PORT = '5000';
    process.env.NODE_ENV = 'test-server';
    process.env.CORS_ORIGIN = 'http://127.0.0.1:3000';

    console.log(`📡 E2E: In-Memory MongoDB started at ${uri}`);

    // 3. Boot the backend (it will listen on port 5000)
    require('../backend/server');

    // 4. Start a lightweight static file server for the React build on port 3000
    const staticServer = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      let filePath = path.join(BUILD_DIR, urlPath === '/' ? 'index.html' : urlPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(BUILD_DIR, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    staticServer.listen(3000, '127.0.0.1', () => {
      console.log(`📡 E2E: Static frontend server listening on http://127.0.0.1:3000`);
    });

  } catch (err) {
    console.error('E2E server startup failed:', err);
    process.exit(1);
  }
})();
