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
    
    // Extract IK_EMAIL
    const emailMatch = envText.match(/IK_EMAIL=([^\n]+)/);
    if (emailMatch && !process.env.IK_EMAIL) {
      process.env.IK_EMAIL = emailMatch[1].trim();
    }
    
    // Extract IK_PRIVATE_KEY (multiline) - capture everything from IK_PRIVATE_KEY= to the end of file or next variable
    // First, get the position of IK_PRIVATE_KEY=
    const privateKeyPos = envText.indexOf('IK_PRIVATE_KEY=');
    if (privateKeyPos !== -1 && !process.env.IK_PRIVATE_KEY) {
      // Get everything after IK_PRIVATE_KEY=
      const privateKeySection = envText.substring(privateKeyPos + 'IK_PRIVATE_KEY='.length);
      // Find the next variable declaration or use the end of the file
      const nextVarPos = privateKeySection.search(/\n[A-Z_]+=/);
      const privateKey = nextVarPos !== -1 ? 
        privateKeySection.substring(0, nextVarPos).trim() : 
        privateKeySection.trim();
      
      process.env.IK_PRIVATE_KEY = privateKey;
      console.log('Loaded private key from .env.local, length:', privateKey.length);
      console.log('Private key starts with:', privateKey.substring(0, 30));
      console.log('Private key ends with:', privateKey.substring(privateKey.length - 30));
    }
  }
} catch (err) {
  console.error('Error loading .env.local:', err);
}

const IK_EMAIL = process.env.IK_EMAIL || process.env.INDIAN_KANOON_EMAIL || '';
const IK_PRIVATE_KEY = process.env.IK_PRIVATE_KEY || process.env.INDIAN_KANOON_PRIVATE_KEY || '';

console.log('IK_EMAIL:', IK_EMAIL);
console.log('IK_PRIVATE_KEY length:', IK_PRIVATE_KEY.length);
console.log('IK_PRIVATE_KEY starts with:', IK_PRIVATE_KEY.substring(0, 30));
console.log('IK_PRIVATE_KEY ends with:', IK_PRIVATE_KEY.substring(IK_PRIVATE_KEY.length - 30));

function sendJson(res, status, body) {
  console.log(`Sending response with status ${status}:`, body);
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

async function signMessage(privatePem, message) {
  try {
    console.log('Signing message with private key');
    console.log('Private key type:', typeof privatePem);
    console.log('Private key length:', privatePem.length);
    
    // Try to parse the key with crypto's built-in functions
    try {
      const { createPrivateKey } = await import('node:crypto');
      const key = createPrivateKey(privatePem);
      console.log('Successfully created private key object');
      
      const signer = createSign('RSA-SHA256');
      signer.update(message);
      signer.end();
      return signer.sign(key);
    } catch (keyError) {
      console.error('Error creating private key object:', keyError);
      throw keyError;
    }
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
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
      console.log('Received search request');
      if (!IK_EMAIL || !IK_PRIVATE_KEY) {
        console.log('Missing IK_EMAIL or IK_PRIVATE_KEY');
        return sendJson(res, 400, { error: 'IK_EMAIL and IK_PRIVATE_KEY must be set in environment or .env.local' });
      }
      const { filters, pagenum = 0 } = await parseBody(req);
      const query = buildQuery(filters || {});
      if (!query) return sendJson(res, 400, { error: 'Missing query' });

      const apiUrl = `https://api.indiankanoon.org/search/?formInput=${encodeURIComponent(query)}&pagenum=${pagenum}`;
      const unique = `${apiUrl}|${Date.now()}|${Math.random().toString(36).slice(2)}`;
      const messageBytes = Buffer.from(unique, 'utf8');
      const encodedMessage = base64(messageBytes);
      const signature = await signMessage(IK_PRIVATE_KEY, messageBytes);
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
      console.error('Proxy error:', e);
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
