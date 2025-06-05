#!/usr/bin/env node

/**
 * Test server startup script with enhanced debugging
 * Run with: npm run test-server
 */

// Import environment config first, before any other imports
import '../lib/env';
// Import Clerk to ensure it's initialized
import '../lib/clerk';
// Then import the rest
import express from 'express';
import chalk from 'chalk';
import { log } from '../vite';
import { registerRoutes } from '../routes';
import config from '../config';

// Set debug flags
process.env.DEBUG_AUTH = 'true';
process.env.DEBUG_PAYMENT = 'true';
process.env.DEBUG_TOKENS = 'true';

// Log environment status
console.log(chalk.cyan('🔑 Environment Status:'));
console.log(chalk.cyan(`- CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? '✓ Found' : '✗ Missing'}`));
console.log(chalk.cyan(`- VITE_CLERK_PUBLISHABLE_KEY: ${process.env.VITE_CLERK_PUBLISHABLE_KEY ? '✓ Found' : '✗ Missing'}`));
console.log(chalk.cyan(`- COINBASE_API_KEY: ${process.env.COINBASE_API_KEY ? '✓ Found' : '✗ Missing'}`));

// Create Express app
const app = express();

// Configure middleware for JSON parsing and CORS
app.use(express.json());
app.use((req, res, next) => {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Add request logging
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url } = req;
  
  // Log the request
  console.log(chalk.blue(`➤ ${method} ${url}`));
  
  // Log auth headers if debug is enabled
  if (process.env.DEBUG_AUTH === 'true' && req.headers.authorization) {
    console.log(chalk.gray('  Auth header present'));
  }
  
  // Capture response for logging
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 
      ? chalk.red 
      : (res.statusCode >= 300 ? chalk.yellow : chalk.green);
    
    console.log(`${statusColor(`✓ ${res.statusCode}`)} ${chalk.blue(`${method} ${url}`)} ${chalk.gray(`(${duration}ms)`)}`);
    
    return originalSend.call(this, body);
  };
  
  next();
});

// Add a test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Test server is running',
    timestamp: new Date().toISOString(),
    env: {
      clerk_initialized: !!process.env.CLERK_SECRET_KEY,
      coinbase_initialized: !!process.env.COINBASE_API_KEY
    }
  });
});

// Register API routes
(async () => {
  const server = await registerRoutes(app);
  
  // Start the server
  const PORT = process.env.TEST_PORT || 3001;
  server.listen(PORT, () => {
    console.log(chalk.green('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨'));
    console.log(chalk.green(`✨ Test server running at http://localhost:${PORT}`));
    console.log(chalk.green('✨ Debug flags enabled:'));
    console.log(chalk.green(`✨   - Auth debugging: ${process.env.DEBUG_AUTH === 'true' ? 'ON' : 'OFF'}`));
    console.log(chalk.green(`✨   - Payment debugging: ${process.env.DEBUG_PAYMENT === 'true' ? 'ON' : 'OFF'}`));
    console.log(chalk.green(`✨   - Token debugging: ${process.env.DEBUG_TOKENS === 'true' ? 'ON' : 'OFF'}`));
    console.log(chalk.green('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨'));
    console.log(chalk.cyan('Available test endpoints:'));
    console.log(chalk.cyan('  GET  /test                - Basic server health check'));
    console.log(chalk.cyan('  GET  /api/auth-debug      - Test authentication (requires auth token)'));
    console.log(chalk.cyan('  GET  /debug/token         - Frontend token debugger'));
    console.log(chalk.cyan('  POST /api/payment/create  - Test payment creation (requires auth token)'));
  });
})(); 