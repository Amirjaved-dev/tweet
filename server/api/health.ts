import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createVercelHandler, jsonResponse } from './vercel-adapter';

export default createVercelHandler((req, res) => {
  jsonResponse(res, 200, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}); 