import express from 'express';
import cors from 'cors';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Request Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    console.log(`\n--- Incoming Request ---`);
    console.log(`Method:  ${req.method}`);
    console.log(`URL:     ${req.url}`);
    console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`--- Response Sent ---`);
      console.log(`Status:   ${res.statusCode}`);
      console.log(`Duration: ${duration}ms`);
      console.log(`----------------------\n`);
    });
    next();
  });

  // 2. Rate Limiting Middleware
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit of 100 requests per 15 minutes.'
    }
  });

  // Apply the rate limiter to all requests
  app.use(limiter);

  // 3. Enable CORS for all origins (System A)
  app.use(cors());

  // 4. Proxy Configuration
  const target = process.env.TARGET_API_URL;
  const apiKey = process.env.MCP_API_KEY;

  if (!target) {
    console.error('CRITICAL ERROR: TARGET_API_URL environment variable is not set.');
    console.error('Please set TARGET_API_URL to the URL of your MCP API.');
  }

  if (!apiKey) {
    console.warn('WARNING: MCP_API_KEY environment variable is not set.');
    console.warn('The proxy will continue but requests may fail if the target API requires authentication.');
  }

  const finalTarget = target || 'https://api.example.com';
  console.log(`Proxying requests to: ${finalTarget}`);

  // 5. Proxy Middleware Configuration
  const apiProxy = createProxyMiddleware({
    target: finalTarget,
    changeOrigin: true,
    xfwd: true, // proxy-middleware handles X-Forwarded-For etc.
    on: {
      proxyReq: (proxyReq, req, res) => {
        // Inject the X-Api-Key header
        if (apiKey) {
          proxyReq.setHeader('X-Api-Key', apiKey);
        }
        
        // Disable buffering for SSE (Server-Sent Events)
        proxyReq.setHeader('X-Accel-Buffering', 'no');
        
        console.log(`[Proxy] Forwarding ${req.method} ${req.url} to ${target}`);
      },
      proxyRes: (proxyRes, req, res) => {
        // Ensure SSE headers are preserved and not buffered
        if (proxyRes.headers['content-type'] === 'text/event-stream') {
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('X-Accel-Buffering', 'no');
        }
      },
      error: (err, req, res) => {
        console.error('Proxy Error:', err);
        if ('writeHead' in res && 'end' in res) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Gateway',
            message: 'The target MCP API is unreachable.',
            details: err.message
          }));
        }
      },
    },
  });

  // 6. Health Check (Internal)
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      target: target,
      mode: 'mcp-compatible-proxy'
    });
  });

  // 7. Routing Logic: Strict API-First
  app.use((req, res, next) => {
    // 1. Internal API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }

    // 2. Dashboard UI - ONLY if it's a GET request to exactly '/' 
    // AND the client explicitly asks for HTML (like a browser)
    const isBrowser = req.method === 'GET' && req.path === '/' && req.accepts('html');
    
    if (isBrowser) {
      return next();
    }

    // 3. For EVERYTHING else (including GET / if not a browser), 
    // proxy it to the target MCP server.
    apiProxy(req, res, next);
  });

  // 8. Vite Middleware for Frontend (Dashboard)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy Server running at http://localhost:${PORT}`);
    console.log(`Requests to http://localhost:${PORT}/proxy/* will be forwarded to ${target} with X-Api-Key injected.`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
