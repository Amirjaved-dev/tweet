import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// Define log levels
enum LogLevel {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  VERBOSE = 5
}

const LOG_LEVEL_MAP: { [key: string]: LogLevel } = {
  'OFF': LogLevel.OFF,
  'ERROR': LogLevel.ERROR,
  'WARN': LogLevel.WARN,
  'INFO': LogLevel.INFO,
  'DEBUG': LogLevel.DEBUG,
  'VERBOSE': LogLevel.VERBOSE
};

// Get current log level from environment variable (default to DEBUG for more detailed logs)
const currentLogLevel = LOG_LEVEL_MAP[process.env.LOG_LEVEL?.toUpperCase() || 'DEBUG'] || LogLevel.DEBUG;

function getLogLevel(source: string): LogLevel {
  // Assign log levels to different sources
  switch (source) {
    case 'express':
    case 'server-debug':
      return LogLevel.INFO;
    case 'vite-setup':
    case 'vite-middleware':
      return LogLevel.DEBUG;
    case 'webhook-debug':
    case 'webhook-handler':
      return LogLevel.INFO;
    case 'server-error':
    case 'vite-error':
    case 'webhook-error':
      return LogLevel.ERROR;
    case 'static-serve':
    case 'static-serve-error':
      return LogLevel.WARN;
    default:
      return LogLevel.INFO;
  }
}

export function log(message: string, source = "express") {
  const messageLogLevel = getLogLevel(source);
  
  // Only log if the message level is at or below the current log level
  if (messageLogLevel <= currentLogLevel) {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    console.log(`${formattedTime} [${source}] ${message}`);
  }
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  log("Creating Vite server with config: " + JSON.stringify(serverOptions), "vite-setup");

  try {
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        info: (msg, options) => {
          viteLogger.info(msg, options);
        },
        warn: (msg, options) => {
          viteLogger.warn(msg, options);
        },
        error: (msg, options) => {
          viteLogger.error(msg, options);
          log(`Vite error: ${msg}`, "vite-error");
          // Don't exit process on error in development
          if (process.env.NODE_ENV !== "development") {
            process.exit(1);
          }
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    log("Vite server created successfully", "vite-setup");
    
    // Special middleware to exclude API routes and webhooks from Vite processing
    app.use((req, res, next) => {
      // Skip Vite processing for API routes and webhooks
      if (req.path.startsWith('/api') || req.path === '/webhook') {
        log(`Skipping Vite for API/webhook path: ${req.path}`, "vite-middleware");
        return next();
      }
      
      // Handle payment success route directly if there are issues with the React app
      if (req.path === '/payment-success' && req.query.success === 'true') {
        log(`Payment success route detected: ${req.path}`, "vite-middleware");
        try {
          // Try to use Vite middleware first
          return vite.middlewares(req, res, next);
        } catch (err) {
          log(`Error in Vite for payment success, falling back to static HTML: ${err}`, "vite-error");
          // If there's an error, serve the fallback HTML
          const fallbackPath = path.resolve(import.meta.dirname, '..', 'client', 'public', 'payment-success.html');
          return res.sendFile(fallbackPath);
        }
      }
      
      // For all other routes, use Vite middleware
      return vite.middlewares(req, res, next);
    });
    
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      
      // Skip Vite for API routes and webhooks
      if (url.startsWith('/api') || url === '/webhook') {
        return next();
      }
      
      log(`Vite handling: ${url}`, "vite-middleware");

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );

        log(`Reading template from: ${clientTemplate}`, "vite-middleware");
        
        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        
        log(`Transforming HTML for: ${url}`, "vite-middleware");
        const page = await vite.transformIndexHtml(url, template);
        log(`Sending transformed HTML response`, "vite-middleware");
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        log(`Error in Vite middleware: ${(e as Error).message}`, "vite-error");
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (err) {
    log(`Failed to create Vite server: ${(err as Error).message}`, "vite-error");
    throw err;
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  log(`Setting up static file serving from: ${distPath}`, "static-serve");

  if (!fs.existsSync(distPath)) {
    const errorMsg = `Could not find the build directory: ${distPath}, make sure to build the client first`;
    log(errorMsg, "static-serve-error");
    throw new Error(errorMsg);
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    log(`Serving index.html for path: ${_req.originalUrl}`, "static-serve");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
