require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.WALLET_PORT || 8081;
const WEB_WALLET_PATH = process.env.WEB_WALLET_PATH || '/home/janos/web-wallet';

// Trust proxy - fixes rate limiter when behind nginx
app.set('trust proxy', true);

// Security Middleware - Helmet (configured for Flutter web app)
// Note: Flutter WASM requires 'unsafe-eval', this is unavoidable
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.gstatic.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://sha256coin.eu", "https://explorer.sha256coin.eu", "https://www.gstatic.com", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
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

// Additional security headers
app.use((req, res, next) => {
  // Permissions Policy
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
  );
  next();
});

// Rate Limiting - General (for web wallet access)
const walletLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// Apply rate limiting to all routes
app.use(walletLimiter);

// Block access to sensitive files
app.use((req, res, next) => {
  const blockedPatterns = [
    '.env', '.git', 'node_modules', 'package.json', 'package-lock.json',
    'server.js', '.log', '.bak', '.sql', '.db', '.key', '.pem'
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

// Serve static files from web-wallet directory
app.use(express.static(WEB_WALLET_PATH, {
  dotfiles: 'deny',
  index: 'index.html',
  maxAge: '1d', // Cache static assets for 1 day
  etag: true,
  setHeaders: (res, filePath) => {
    // WASM files need specific content type
    if (filePath.endsWith('.wasm')) {
      res.set('Content-Type', 'application/wasm');
    }
    // Don't cache HTML (SPA routing)
    if (filePath.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// SPA fallback - always serve index.html for HTML5 routing
app.get('*', (req, res) => {
  res.sendFile(path.join(WEB_WALLET_PATH, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Web Wallet Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`S256 Web Wallet server running on http://127.0.0.1:${PORT}`);
  console.log(`Security enabled: Helmet + HSTS + Rate Limiting`);
  console.log(`Serving from: ${WEB_WALLET_PATH}`);
});
