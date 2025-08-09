// Minimal Indian Kanoon proxy (public-private key auth)
// Usage: IK_EMAIL=you@example.com IK_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----...\n-----END PRIVATE KEY-----' node ik-proxy.js
// Or create a .env.local file with IK_EMAIL and IK_PRIVATE_KEY.

import http from 'http';
import https from 'https';
import { readFileSync, existsSync } from 'fs';
import { createSign } from 'crypto';

// Load .env.local if present
try {
  const dotenvPath = '.env.local';
  if (existsSync(dotenvPath)) {
    const envText = readFileSync(dotenvPath, 'utf8');
    envText.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) {
        const key = m[1];
        let val = m[2];
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
} catch {}

const IK_EMAIL = process.env.IK_EMAIL || process.env.INDIAN_KANOON_EMAIL || '';
const IK_PRIVATE_KEY = process.env.IK_PRIVATE_KEY || process.env.INDIAN_KANOON_PRIVATE_KEY || '';

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type'
  });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function buildQuery(filters) {
  let q = filters.keyword || filters.citation || filters.provision || filters.act || '';
  if (filters.yearFrom && filters.yearTo) q += ` year:${filters.yearFrom}-${filters.yearTo}`;
  else if (filters.yearFrom) q += ` year:${filters.yearFrom}`;
  if (filters.jurisdiction && filters.jurisdiction !== 'All High Courts') q += ` court:${filters.jurisdiction}`;
  if (filters.caseType) q += ` type:${filters.caseType}`;
  if (filters.judge) q += ` judge:${filters.judge}`;
  return q.trim();
}

function base64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function signMessage(privatePem, message) {
  const signer = createSign('RSA-SHA256');
  signer.update(message);
  signer.end();
  return signer.sign(privatePem);
}

function doIkRequest(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST', headers: { ...headers, Accept: 'application/json' } }, resp => {
      let data = '';
      resp.on('data', chunk => (data += chunk));
      resp.on('end', () => {
        if (resp.statusCode && resp.statusCode >= 200 && resp.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        } else {
          reject(new Error(`IK ${resp.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/ik/search') {
    try {
      if (!IK_EMAIL || !IK_PRIVATE_KEY) {
        return sendJson(res, 400, { error: 'IK_EMAIL and IK_PRIVATE_KEY must be set in environment or .env.local' });
      }
      const { filters, pagenum = 0 } = await parseBody(req);
      const query = buildQuery(filters || {});
      if (!query) return sendJson(res, 400, { error: 'Missing query' });

      const apiUrl = `https://api.indiankanoon.org/search/?formInput=${encodeURIComponent(query)}&pagenum=${pagenum}`;
      const unique = `${apiUrl}|${Date.now()}|${Math.random().toString(36).slice(2)}`;
      const messageBytes = Buffer.from(unique, 'utf8');
      const encodedMessage = base64(messageBytes);
      const signature = signMessage(IK_PRIVATE_KEY, messageBytes);
      const encodedSignature = base64(signature);

      const headers = {
        'X-Customer': IK_EMAIL,
        'X-Message': encodedMessage,
        'Authorization': `HMAC ${encodedSignature}`
      };

      const ikJson = await doIkRequest(apiUrl, headers);
      const docs = Array.isArray(ikJson?.docs) ? ikJson.docs : [];
      const results = docs.map(doc => ({
        tid: String(doc.tid),
        title: String(doc.title || ''),
        headline: String(doc.headline || ''),
        docsource: String(doc.docsource || ''),
        docsize: Number(doc.docsize || 0),
        year: doc.year ? String(doc.year) : undefined,
        citation: doc.citation ? String(doc.citation) : undefined,
        url: `https://indiankanoon.org/doc/${doc.tid}/`
      }));

      return sendJson(res, 200, { success: true, count: results.length, results });
    } catch (e) {
      return sendJson(res, 500, { error: 'Proxy error', message: String(e?.message || e) });
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end('Not found');
});

const PORT = process.env.PORT || 8787;
server.listen(PORT, () => {
  console.log(`IK proxy listening on http://localhost:${PORT}`);
});
