// scripts/serve-static.js
// Lightweight Node.js static server with local /api function dispatch for Playwright testing

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(urlObj.pathname);

  // Handle local /api serverless functions
  if (pathname.startsWith('/api/')) {
    const apiFile = pathname.replace('/api/', '');
    const apiPath = path.join(ROOT, 'api', `${apiFile}.js`);
    if (fs.existsSync(apiPath)) {
      try {
        delete require.cache[require.resolve(apiPath)];
        const handler = require(apiPath);
        // Simple body parser for POST requests
        let bodyBuffer = '';
        req.on('data', chunk => { bodyBuffer += chunk; });
        req.on('end', async () => {
          try {
            req.body = bodyBuffer ? JSON.parse(bodyBuffer) : {};
          } catch (e) {
            req.body = bodyBuffer;
          }
          req.query = Object.fromEntries(urlObj.searchParams);
          // Polyfill res.status and res.json for Vercel functions
          res.status = function(code) { res.statusCode = code; return res; };
          res.json = function(data) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
          try {
            await handler(req, res);
          } catch (handlerErr) {
            res.status(500).json({ error: handlerErr.message });
          }
        });
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    }
  }

  // Handle static files
  if (pathname === '/') {
    pathname = '/index.html';
  }

  let filePath = path.join(ROOT, pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Access denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 handler
      const notFoundPath = path.join(ROOT, 'offline.html');
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return fs.createReadStream(notFoundPath).pipe(res);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Iqbal Tailoring static server running at http://localhost:${PORT}`);
});
