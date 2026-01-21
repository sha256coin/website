const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 8081;
const WEB_WALLET_PATH = '/home/janos/web-wallet';

// Trust proxy - fixes rate limiter when behind nginx
app.set('trust proxy', true);

// Security Middleware - Helmet (configured for Flutter web app)
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
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate Limiting - General (for web wallet access)
const walletLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: {trustProxy: false}, // Disable proxy validation warning
});

// Apply rate limiting to all routes
app.use(walletLimiter);

// Block access to sensitive files
app.use((req, res, next) => {
  const blockedFiles = ['.env', 'package.json', 'node_modules', 'server.js'];
  const requestedPath = req.path.toLowerCase();
  const isBlocked = blockedFiles.some(file =>
    requestedPath.includes(file.toLowerCase())
  );

  if (isBlocked) {
    return res.status(403).send('Access denied');
  }
  next();
});

// Serve static files from web-wallet directory
app.use(express.static(WEB_WALLET_PATH, {
  dotfiles: 'deny',
  index: 'index.html',
  setHeaders: (res, path) => {
    // Additional security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'SAMEORIGIN');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
}));

// SPA fallback - always serve index.html for HTML5 routing
app.get('*', (req, res) => {
  res.sendFile(path.join(WEB_WALLET_PATH, 'index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🔒 S256 Web Wallet server running on http://127.0.0.1:${PORT}`);
  console.log(`🛡️  Security enabled: Helmet + Rate Limiting (200 req/15min)`);
});
