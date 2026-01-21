const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy - fixes rate limiter when behind nginx/cloudflare
app.set('trust proxy', true);

// JSON body parser for RPC requests
app.use(express.json({ limit: '1mb' }));

// Security Middleware - Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate Limiting - General
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: {trustProxy: false}, // Disable proxy validation warning
});

// Rate Limiting - Downloads (more restrictive)
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit downloads to 20 per 15 minutes
  message: 'Too many download requests, please try again later.',
  validate: {trustProxy: false}, // Disable proxy validation warning
});

// Rate Limiting - RPC (restrictive for security)
const rpcLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 RPC requests per minute per IP
  message: { error: 'Too many RPC requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {trustProxy: false},
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Block access to sensitive files
app.use((req, res, next) => {
  const blockedFiles = ['.env', 'package.json', 'package-lock.json', '.git',
                        'node_modules', 'server.js', 'deploy.sh',
                        'DEPLOYMENT.md', '.md'];

  const requestedPath = req.path.toLowerCase();
  const isBlocked = blockedFiles.some(file =>
    requestedPath.includes(file.toLowerCase())
  );

  if (isBlocked) {
    return res.status(403).send('Access denied');
  }
  next();
});

// ============================================
// EXCHANGE API PROXY ENDPOINTS
// ============================================
// KlingEx API Proxy
app.get('/api/price-klingex', async (req, res) => {
  try {
    const https = require('https');

    https.get('https://api.klingex.io/api/tickers', (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          const tickers = JSON.parse(data);
          const s256Ticker = tickers.find(t => t.ticker_id === 'S256_USDT');
          res.json(s256Ticker || { error: 'S256_USDT not found' });
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse KlingEx response' });
        }
      });
    }).on('error', (error) => {
      res.status(500).json({ error: 'Failed to fetch from KlingEx' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rabid Rabbit API Proxy
app.get('/api/price-rabidrabbit', async (req, res) => {
  try {
    const https = require('https');

    https.get('https://rabid-rabbit.org/api/public/v1/ticker?format=json', (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        try {
          const tickers = JSON.parse(data);
          res.json(tickers['S256_USDT'] || { error: 'S256_USDT not found' });
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse Rabid Rabbit response' });
        }
      });
    }).on('error', (error) => {
      res.status(500).json({ error: 'Failed to fetch from Rabid Rabbit' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RPC PROXY ENDPOINT (Secure)
// ============================================
app.post('/rpc', rpcLimiter, async (req, res) => {
  // CORS headers for web wallet (restricted to sha256coin.eu)
  res.setHeader('Access-Control-Allow-Origin', 'https://sha256coin.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // S256 RPC credentials (kept server-side, never exposed to client)
  const RPC_USER = 's256rpc_da75a7ea4d93fe08';
  const RPC_PASSWORD = '72291025a3e77b39fbdd992956520216c6055315003c7cbf52c0e5bac25e2f09';
  const RPC_HOST = '127.0.0.1';
  const RPC_PORT = 25332;

  // Validate request has required fields
  if (!req.body || !req.body.method) {
    return res.status(400).json({
      error: 'Invalid RPC request: method is required'
    });
  }

  // Whitelist allowed RPC methods (security)
  const allowedMethods = [
    'getblockchaininfo',
    'getblockcount',
    'getbestblockhash',
    'getblock',
    'getrawtransaction',
    'sendrawtransaction',
    'estimatesmartfee',
    'scantxoutset',
    'createrawtransaction',
    'signrawtransactionwithkey',
    'decoderawtransaction',
    'validateaddress',
    'getaddressinfo'
  ];

  if (!allowedMethods.includes(req.body.method)) {
    return res.status(403).json({
      error: `RPC method '${req.body.method}' is not allowed`
    });
  }

  // Build RPC request
  const rpcRequest = JSON.stringify({
    jsonrpc: '1.0',
    id: req.body.id || 'web-wallet',
    method: req.body.method,
    params: req.body.params || []
  });

  // Basic auth for RPC
  const auth = Buffer.from(`${RPC_USER}:${RPC_PASSWORD}`).toString('base64');

  // HTTP request options
  const options = {
    hostname: RPC_HOST,
    port: RPC_PORT,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(rpcRequest),
      'Authorization': `Basic ${auth}`
    },
    timeout: 30000 // 30 second timeout
  };

  // Forward request to S256 RPC
  const rpcReq = http.request(options, (rpcRes) => {
    let data = '';

    rpcRes.on('data', (chunk) => {
      data += chunk;
    });

    rpcRes.on('end', () => {
      try {
        const response = JSON.parse(data);
        res.json(response);
      } catch (e) {
        res.status(500).json({
          error: 'Failed to parse RPC response'
        });
      }
    });
  });

  rpcReq.on('error', (error) => {
    console.error('RPC Error:', error.message);
    res.status(500).json({
      error: 'RPC connection failed'
    });
  });

  rpcReq.on('timeout', () => {
    rpcReq.destroy();
    res.status(504).json({
      error: 'RPC request timeout'
    });
  });

  rpcReq.write(rpcRequest);
  rpcReq.end();
});

// Handle OPTIONS preflight for CORS
app.options('/rpc', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://sha256coin.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).send();
});

// Serve static files
app.use(express.static(path.join(__dirname), {
  dotfiles: 'deny',
  index: ['index.html']
}));

// Apply stricter rate limiting to downloads
app.use('/downloads', downloadLimiter);

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve whitepaper page
app.get('/whitepaper.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'whitepaper.html'));
});

// Handle 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 S256 Website running on http://localhost:${PORT}`);
  console.log(`🛡️  Security enabled: Helmet + Rate Limiting`);
  console.log(`🔒 RPC Proxy available at /rpc (30 req/min per IP)`);
});
