import { Server } from 'http';
import express from 'express';
import threadRoutes from './thread';
import tweetRoutes from './tweet';
import newThreadRoutes from './newThread';
import web3ThreadRoutes from './web3Thread';
import tokenAnalyzerRoutes from './tokenAnalyzer';
import threadsRoutes from './threads';
import paymentRoutes from './payment';
import webhookRoutes from './webhooks/index';
import clerkWebhookRoutes from './webhooks/clerk';
import realtimeRoutes from './realtime';
import userRoutes from './user';
import tokenRoutes from './token';
import tokensRoutes from './tokens';
import analyticsRoutes from './analytics';
import { handleClerkWebhook, handleClerkWebhookGet } from './clerk-webhook';
import { requirePremium } from '../middleware/requirePremium';
import { requireAuth } from '../middleware/auth';

export const registerRoutes = async (app: express.Express): Promise<Server> => {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Auth debug endpoint - useful for testing auth tokens
  app.get('/api/auth-debug', requireAuth, (req, res) => {
    res.json({ 
      auth: (req as any).auth,
      user: {
        id: (req as any).user?.id,
        email: (req as any).user?.emailAddresses?.[0]?.emailAddress || 'No email found',
        firstName: (req as any).user?.firstName,
        lastName: (req as any).user?.lastName,
      },
      message: 'If you can see this, your authentication is working correctly!'
    });
  });
  
  // Clerk webhook endpoints - ensure these are not behind authentication
  app.get('/api/clerk-webhook', handleClerkWebhookGet);
  app.post('/api/clerk-webhook', express.json({ limit: '5mb' }), handleClerkWebhook);
  
  // Webhook routes - these should not be behind authentication
  app.use('/api/webhooks/clerk', clerkWebhookRoutes);
  app.use('/api/webhooks', webhookRoutes);
  
  // Payment routes - some endpoints need authentication, handled internally
  app.use('/api/payment', paymentRoutes);
  
  // User routes - authentication handled internally
  app.use('/api/user', userRoutes);
  
  // Standard API routes with authentication 
  app.use('/api/threads', requireAuth, threadsRoutes);
  app.use('/api/thread', requireAuth, threadRoutes);
  app.use('/api/tweet', requireAuth, tweetRoutes);
  app.use('/api/analytics', requireAuth, analyticsRoutes);

  // Protected premium routes
  app.use('/api/web3-thread', requirePremium, web3ThreadRoutes);
  app.use('/api/realtime', requirePremium, realtimeRoutes);
  
  // Mixed protection routes - specific endpoints need premium
  app.use('/api/new-thread', requireAuth, newThreadRoutes);
  app.use('/api/token-analyzer', requireAuth, tokenAnalyzerRoutes);

  // Token data routes (basic token info, some endpoints public)
  app.use('/api/token', tokenRoutes);
  
  // Token management routes (requires authentication for contract validation and enhanced features)
  app.use('/api/tokens', requireAuth, tokensRoutes);

  // Create HTTP server
  const server = new Server(app);
  
  return server;
}; 