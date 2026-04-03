const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const WORKSPACE_ROOT = path.resolve(__dirname, '..');

const ROUTES = {
  '/': 'index.html',
  '/courses': 'courses.html',
  '/live-classes': 'live-classes.html',
  '/free-tests': 'free-tests.html',
  '/mock-test': 'mock-test.html',
  '/admin-console': 'admin-console.html',
  '/teacher-tests': 'teacher-tests.html',
  '/login': 'login.html',
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function getLanUrls(port) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  for (const entries of Object.values(interfaces)) {
    if (!entries) continue;

    for (const entry of entries) {
      if (entry.internal) continue;
      if (entry.family !== 'IPv4') continue;

      urls.push(`http://${entry.address}:${port}`);
    }
  }

  return urls;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (pathname === '/shared/site-content.json') {
    sendFile(res, path.join(WORKSPACE_ROOT, 'shared', 'site-content.json'));
    return;
  }

  if (pathname === '/styles.css' || pathname === '/app.js') {
    sendFile(res, path.join(ROOT, pathname.slice(1)));
    return;
  }

  const fileName = ROUTES[pathname];
  if (fileName) {
    sendFile(res, path.join(ROOT, fileName));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Page not found');
});

server.listen(PORT, HOST, () => {
  console.log(`Veteran website running at http://localhost:${PORT}`);

  const lanUrls = getLanUrls(PORT);
  if (lanUrls.length) {
    console.log('Open from other devices on the same Wi-Fi:');
    for (const url of lanUrls) {
      console.log(`  ${url}`);
    }
  }
});
