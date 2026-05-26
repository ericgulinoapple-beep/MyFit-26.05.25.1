const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'myfit-data.json');

// Load or init data
let userData = { history: [], exData: {} };
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    userData = JSON.parse(raw);
  }
} catch (e) {
  console.error('Failed to load data file, starting fresh');
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

const server = http.createServer((req, res) => {
  const url = req.url;

  // CORS for dev if needed, but same origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (url === '/' || url === '/index.html') {
    // Serve the modified HTML
    fs.readFile(path.join(__dirname, 'myfit.html'), (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading app');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
    return;
  }

  if (url === '/api/load') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(userData));
    return;
  }

  if (url === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        if (incoming.history) userData.history = incoming.history;
        if (incoming.exData) userData.exData = incoming.exData;
        saveData();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Static assets if any, but for now 404 for others
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`🚀 MyFit server running at http://localhost:${PORT}`);
  console.log(`   Open in browser to use the app with cloud sync!`);
  console.log(`   Data saved to: ${DATA_FILE}`);
});