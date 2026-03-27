#!/usr/bin/env node
/**
 * resource: scripts/ci-start.js
 * goal: Start a minimal static server for Shady Animator CI tests
 * channel: node-cli
 * handoff: epoch.mm.shady-animator.v1.1.ci.start
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.CI_STATIC_PORT || 4173;
const ROOT = path.resolve(__dirname, '..', 'dist'); // or 'public' depending on build

function send404(res) {
  res.statusCode = 404;
  res.end('Not found');
}

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(ROOT, urlPath.split('?')[0]);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return send404(res);
    }
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[CI] Static server running on http://localhost:${PORT}`);
});