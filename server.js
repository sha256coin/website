require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 8080;

// RPC Configuration from environment variables
const RPC_CONFIG = {
  user: process.env.RPC_USER,
  password: process.env.RPC_PASSWORD,
  host: process.env.RPC_HOST || '127.0.0.1',
  port: parseInt(process.env.RPC_PORT) || 25332
};

// Validate RPC config on startup
if (!RPC_CONFIG.user || !RPC_CONFIG.password) {
  console.warn('⚠️  Warning: RPC credentials not set in environment variables');
  console.warn('   RPC proxy endpoint will not function properly');
  console.warn('   Create a .env file with RPC_USER and RPC_PASSWORD');
}

// Trust proxy - fixes rate limiter when behind nginx/cloudflare
app.set('trust proxy', true);

// JSON body parser for RPC requests with size limit
app.use(express.json({ limit: '100kb' }));

// Security Middleware - Helmet with enhanced configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for static HTML with inline scripts
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Inline styles needed for dynamic theming
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
}));

// Additional security headers not covered by Helmet
app.use((req, res, next) => {
  // Permissions Policy (formerly Feature-Policy)
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
  );

  // Prevent caching of sensitive pages
  if (req.path.includes('/api/') || req.path.includes('/rpc')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
});

// Rate Limiting - General
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// Rate Limiting - API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many API requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// Rate Limiting - Downloads (more restrictive)
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit downloads to 20 per 15 minutes
  message: 'Too many download requests, please try again later.',
  validate: { trustProxy: false },
});

// Rate Limiting - RPC (restrictive for security)
const rpcLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 RPC requests per minute per IP
  message: { error: 'Too many RPC requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Block access to sensitive files
app.use((req, res, next) => {
  const blockedPatterns = [
    '.env', '.git', 'node_modules', 'package.json', 'package-lock.json',
    'server.js', 'web-wallet-server.js', 'deploy.sh', '.md', '.log', '.bak', '.sql', '.db'
  ];

  const requestedPath = req.path.toLowerCase();
  const isBlocked = blockedPatterns.some(pattern =>
    requestedPath.includes(pattern.toLowerCase())
  );

  if (isBlocked) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
});

// ============================================
// EXCHANGE API PROXY ENDPOINTS (with rate limiting)
// ============================================

// Input sanitization helper
function sanitizeTickerData(data) {
  if (!data || typeof data !== 'object') return null;

  // Only allow expected fields with proper types
  const sanitized = {};
  const allowedFields = ['ticker_id', 'last_price', 'high', 'low', 'base_volume',
                         'target_volume', 'quote_volume', 'bid', 'ask'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      // Ensure numeric fields are actually numbers
      if (['last_price', 'high', 'low', 'base_volume', 'target_volume',
           'quote_volume', 'bid', 'ask'].includes(field)) {
        const num = parseFloat(data[field]);
        sanitized[field] = isNaN(num) ? 0 : num;
      } else {
        // String fields - escape HTML entities
        sanitized[field] = String(data[field]).replace(/[<>&"']/g, '');
      }
    }
  }

  return sanitized;
}

// KlingEx API Proxy
app.get('/api/price-klingex', apiLimiter, async (req, res) => {
  try {
    const https = require('https');

    const apiReq = https.get('https://api.klingex.io/api/tickers', {
      timeout: 10000 // 10 second timeout
    }, (apiRes) => {
      let data = '';

      // Limit response size
      apiRes.on('data', (chunk) => {
        data += chunk;
        if (data.length > 1000000) { // 1MB limit
          apiReq.destroy();
          return res.status(500).json({ error: 'Response too large' });
        }
      });

      apiRes.on('end', () => {
        try {
          const tickers = JSON.parse(data);
          if (!Array.isArray(tickers)) {
            return res.status(500).json({ error: 'Invalid response format' });
          }
          const s256Ticker = tickers.find(t => t.ticker_id === 'S256_USDT');
          res.json(sanitizeTickerData(s256Ticker) || { error: 'S256_USDT not found' });
        } catch (e) {
          res.status(500).json({ error: 'Failed to process response' });
        }
      });
    });

    apiReq.on('error', () => {
      res.status(500).json({ error: 'Failed to fetch price data' });
    });

    apiReq.on('timeout', () => {
      apiReq.destroy();
      res.status(504).json({ error: 'Request timeout' });
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// Rabid Rabbit API Proxy
app.get('/api/price-rabidrabbit', apiLimiter, async (req, res) => {
  try {
    const https = require('https');

    const apiReq = https.get('https://rabid-rabbit.org/api/public/v1/ticker?format=json', {
      timeout: 10000
    }, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
        if (data.length > 1000000) {
          apiReq.destroy();
          return res.status(500).json({ error: 'Response too large' });
        }
      });

      apiRes.on('end', () => {
        try {
          const tickers = JSON.parse(data);
          if (typeof tickers !== 'object') {
            return res.status(500).json({ error: 'Invalid response format' });
          }
          res.json(sanitizeTickerData(tickers['S256_USDT']) || { error: 'S256_USDT not found' });
        } catch (e) {
          res.status(500).json({ error: 'Failed to process response' });
        }
      });
    });

    apiReq.on('error', () => {
      res.status(500).json({ error: 'Failed to fetch price data' });
    });

    apiReq.on('timeout', () => {
      apiReq.destroy();
      res.status(504).json({ error: 'Request timeout' });
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ============================================
// RPC PROXY ENDPOINT (Secure)
// ============================================

// RPC parameter validation
function validateRpcParams(method, params) {
  if (!Array.isArray(params)) return false;

  // Method-specific validation
  switch (method) {
    case 'getblock':
      // Block hash should be 64 hex chars
      if (params[0] && !/^[a-fA-F0-9]{64}$/.test(params[0])) return false;
      break;
    case 'getrawtransaction':
      // Txid should be 64 hex chars
      if (params[0] && !/^[a-fA-F0-9]{64}$/.test(params[0])) return false;
      break;
    case 'validateaddress':
    case 'getaddressinfo':
      // Address validation (S256 addresses start with S, 8, or s2)
      if (params[0] && !/^(S|8|s2)[a-zA-Z0-9]{25,90}$/.test(params[0])) return false;
      break;
    case 'sendrawtransaction':
      // Raw tx should be hex
      if (params[0] && !/^[a-fA-F0-9]+$/.test(params[0])) return false;
      break;
  }

  return true;
}

app.post('/rpc', rpcLimiter, async (req, res) => {
  // CORS headers for web wallet (restricted to sha256coin.eu)
  const allowedOrigins = ['https://sha256coin.eu', 'https://www.sha256coin.eu'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Check RPC config
  if (!RPC_CONFIG.user || !RPC_CONFIG.password) {
    return res.status(503).json({ error: 'RPC service not configured' });
  }

  // Validate request has required fields
  if (!req.body || typeof req.body.method !== 'string') {
    return res.status(400).json({ error: 'Invalid request format' });
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

  const method = req.body.method.toLowerCase();
  if (!allowedMethods.includes(method)) {
    return res.status(403).json({ error: 'Method not allowed' });
  }

  // Validate parameters
  const params = req.body.params || [];
  if (!validateRpcParams(method, params)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  // Build RPC request
  const rpcRequest = JSON.stringify({
    jsonrpc: '1.0',
    id: 'web-wallet',
    method: method,
    params: params
  });

  // Basic auth for RPC
  const auth = Buffer.from(`${RPC_CONFIG.user}:${RPC_CONFIG.password}`).toString('base64');

  // HTTP request options
  const options = {
    hostname: RPC_CONFIG.host,
    port: RPC_CONFIG.port,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(rpcRequest),
      'Authorization': `Basic ${auth}`
    },
    timeout: 30000
  };

  // Forward request to S256 RPC
  const rpcReq = http.request(options, (rpcRes) => {
    let data = '';

    rpcRes.on('data', (chunk) => {
      data += chunk;
      // Limit response size to 10MB
      if (data.length > 10000000) {
        rpcReq.destroy();
        return res.status(500).json({ error: 'Response too large' });
      }
    });

    rpcRes.on('end', () => {
      try {
        const response = JSON.parse(data);
        res.json(response);
      } catch (e) {
        res.status(500).json({ error: 'Invalid RPC response' });
      }
    });
  });

  rpcReq.on('error', () => {
    res.status(500).json({ error: 'RPC connection failed' });
  });

  rpcReq.on('timeout', () => {
    rpcReq.destroy();
    res.status(504).json({ error: 'RPC timeout' });
  });

  rpcReq.write(rpcRequest);
  rpcReq.end();
});

// Handle OPTIONS preflight for CORS
app.options('/rpc', (req, res) => {
  const allowedOrigins = ['https://sha256coin.eu', 'https://www.sha256coin.eu'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).send();
});

// Serve static files
app.use(express.static(path.join(__dirname), {
  dotfiles: 'deny',
  index: ['index.html'],
  maxAge: '1d', // Cache static assets
  etag: true
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

// Serve resources page
app.get('/resources.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'resources.html'));
});

// Handle 404 - return proper 404, not index
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`S256 Website running on http://localhost:${PORT}`);
  console.log('Security enabled: Helmet + Rate Limiting + Input Validation');
  console.log('RPC Proxy available at /rpc (30 req/min per IP)');
  if (!RPC_CONFIG.user) {
    console.log('Note: Set RPC_USER and RPC_PASSWORD in .env for RPC proxy');
  }
});
