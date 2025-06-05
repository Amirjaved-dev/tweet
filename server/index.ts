// Import environment variables first to ensure they're loaded before anything else
import './lib/env';
// Import Clerk to initialize it with environment variables
import './lib/clerk';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Extend the Express Request type to include our custom rawBody property
declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add raw body handling middleware for webhooks
app.use((req, res, next) => {
  const isWebhook = 
    (req.path === '/webhook' || req.path === '/api/coinbase-webhook' || req.path.includes('/coinbase/webhook')) 
    && req.method === 'POST';
  
  if (isWebhook) {
    log(`Detected webhook request at ${req.path}, using raw body parser`, "webhook-debug");
    log(`Webhook headers: ${JSON.stringify(req.headers)}`, "webhook-debug");
    
    // For webhooks, we need the raw body for signature verification
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk.toString();
      log(`Received webhook data chunk of size ${chunk.length}`, "webhook-debug");
    });
    
    req.on('end', () => {
      if (rawBody) {
        req.rawBody = rawBody;
        log(`Raw webhook body captured (${rawBody.length} bytes): ${rawBody.substring(0, 100)}...`, "webhook-debug");
        log(`Using webhook secret: ${process.env.COINBASE_COMMERCE_WEBHOOK_SECRET ? 'Secret exists (length: ' + process.env.COINBASE_COMMERCE_WEBHOOK_SECRET.length + ')' : 'MISSING!'}`, "webhook-debug");
      } else {
        log(`No raw webhook body was captured!`, "webhook-error");
      }
      next();
    });
  } else {
    // For non-webhook routes, continue normally
    next();
  }
});

// Standard JSON and URL-encoded body parsers for non-webhook routes
app.use((req, res, next) => {
  const isWebhook = 
    (req.path === '/webhook' || req.path === '/api/coinbase-webhook' || req.path.includes('/coinbase/webhook')) 
    && req.method === 'POST';
  
  if (!isWebhook) {
    express.json()(req, res, err => {
      if (err) {
        log(`JSON parsing error: ${err.message}`, "server-error");
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
      next();
    });
  } else {
    next();
  }
});

app.use((req, res, next) => {
  const isWebhook = 
    (req.path === '/webhook' || req.path === '/api/coinbase-webhook' || req.path.includes('/coinbase/webhook')) 
    && req.method === 'POST';
  
  if (!isWebhook) {
    express.urlencoded({ extended: false })(req, res, err => {
      if (err) {
        log(`URL-encoded parsing error: ${err.message}`, "server-error");
        return res.status(400).json({ error: 'Invalid URL-encoded data in request body' });
      }
      next();
    });
  } else {
    next();
  }
});

// Highest-priority middleware for webhook routes
// This ensures these routes are handled before any other middleware
app.use('/webhook', (req, res, next) => {
  log(`High-priority webhook handler intercepted: ${req.method} ${req.url}`, "webhook-handler");
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Webhook endpoint is working. Please use POST requests for actual webhooks.',
      timestamp: new Date().toISOString()
    });
  }
  
  // For other methods like POST, continue to regular handlers
  next();
});

// Add detailed request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  log(`Received request: ${req.method} ${req.url}`, "server-debug");
  
  // Check if this is a webhook request and skip middleware processing
  if (req.path === '/webhook' && req.method === 'POST') {
    log(`Detected webhook request, forwarding directly to route handler`, "server-debug");
    return next();
  }
  
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    
    if (path.startsWith("/api")) {
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
    }

    log(logLine);
  });

  next();
});

// Add middleware to ensure proper content type for all API responses
app.use('/api', (req, res, next) => {
  // Save the original send method
  const originalSend = res.send;
  
  // Override the send method
  res.send = function(body) {
    // Set proper content type for API responses
    res.setHeader('Content-Type', 'application/json');
    
    // Always ensure CORS headers are set
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Check if the body is HTML and convert it to a proper JSON error response
    if (typeof body === 'string' && 
        (body.trim().startsWith('<!DOCTYPE') || 
         body.trim().startsWith('<html') || 
         body.includes('<!DOCTYPE html>'))) {
      
      console.error('API middleware caught HTML response');
      
      // Try to extract title from HTML
      const titleMatch = body.match(/<title>(.*?)<\/title>/i);
      const errorMessage = titleMatch ? 
        `HTML Error: ${titleMatch[1]}` : 
        'Server returned HTML instead of JSON';
      
      // Replace HTML with proper JSON error
      body = JSON.stringify({
        error: 'Server returned HTML instead of JSON',
        message: errorMessage,
        isHtmlResponse: true
      });
      
      // Ensure error status is set
      if (res.statusCode === 200) {
        res.status(500);
      }
    }
    
    // If the body is not a string and not already JSON, stringify it
    if (typeof body !== 'string' || 
        !(body.trim().startsWith('{') || body.trim().startsWith('['))) {
      try {
        body = JSON.stringify(body);
      } catch (err) {
        console.error('Error stringifying response:', err);
        body = JSON.stringify({ 
          error: 'Error formatting response',
          message: 'The server encountered an error while formatting the response data'
        });
        if (res.statusCode === 200) {
          res.status(500);
        }
      }
    }
    
    // Call the original send method
    return originalSend.call(this, body);
  };
  
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Express error handler:", err);
    res.status(status).json({ message });
    throw err;
  });

  // Add a direct webhook handler as a last resort
  app.get('/webhook', (req, res) => {
    log('Direct webhook GET handler called');
    res.status(200).json({ 
      message: 'Webhook endpoint is working. Please use POST requests with proper signature for actual webhooks.',
      timestamp: new Date().toISOString()
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    log("Setting up Vite middleware for development", "server");
    await setupVite(app, server);
  } else {
    log("Setting up static file serving for production", "server");
    serveStatic(app);
  }

  // Add a direct webhook test endpoint
  app.get('/webhook-test', (req, res) => {
    log('Webhook test endpoint accessed');
    res.status(200).json({
      status: 'ok',
      message: 'Webhook test endpoint is working',
      timestamp: new Date().toISOString(),
      headers: req.headers
    });
  });

  // Add a catch-all route to handle 404s with helpful message
  app.use((req, res) => {
    log(`404 Not Found: ${req.method} ${req.url}`, "server-error");
    res.status(404).json({
      error: 'Not Found',
      message: `The requested endpoint (${req.method} ${req.url}) does not exist`,
      availableEndpoints: [
        '/health',
        '/api/webhooks/clerk',
        '/api/clerk-webhook',
        '/webhook-test'
      ]
    });
  });

  // Try to start the server on available ports
  const primaryPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const alternatePorts = [3001, 3002, 5000, 8080];
  
  const startServer = (port: number, retryIndex = 0) => {
    server.listen(port)
      .on('listening', () => {
        log(`Server started successfully on port ${port}`);
      })
      .on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          log(`Port ${port} is already in use, trying another port...`);
          
          if (retryIndex < alternatePorts.length) {
            // Try the next alternate port
            startServer(alternatePorts[retryIndex], retryIndex + 1);
          } else {
            log('All ports are in use. Please close other applications or specify a different port', 'server-error');
            process.exit(1);
          }
        } else {
          log(`Error starting server: ${err.message}`, 'server-error');
          process.exit(1);
        }
      });
  };
  
  startServer(primaryPort);
})();
