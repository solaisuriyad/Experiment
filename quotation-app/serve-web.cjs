// Minimal static server for the exported web build with SPA fallback.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist');
const PORT = 8081;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    let filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    fs.stat(filePath, (err, stat) => {
      const fallback = () => {
        // SPA fallback: any unknown route serves the app shell.
        filePath = path.join(ROOT, 'index.html');
        serve(filePath);
      };
      const serve = (fp) => {
        fs.readFile(fp, (e, data) => {
          if (e) {
            res.writeHead(404);
            return res.end('Not found');
          }
          const ext = path.extname(fp);
          res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': fp.includes('_expo') ? 'public, max-age=31536000, immutable' : 'no-cache',
          });
          res.end(data);
        });
      };
      if (err || !stat.isFile()) return fallback();
      serve(filePath);
    });
  })
  .listen(PORT, '0.0.0.0', () => {
    console.log(`Serving ${ROOT} on http://0.0.0.0:${PORT}`);
  });
