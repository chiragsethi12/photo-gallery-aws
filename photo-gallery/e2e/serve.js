// e2e/serve.js - Lightweight static file server for React production build assets
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
};

const server = http.createServer((req, res) => {
  // Handle SPA routing: serve index.html for routes that do not point directly to files
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(BUILD_DIR, urlPath === '/' ? 'index.html' : urlPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(BUILD_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error(`Static server error reading ${filePath}:`, err);
      res.writeHead(500);
      res.end(`Server Error: ${err.code}`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 3000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`📡 Static E2E Server listening on http://127.0.0.1:${PORT}`);
});
