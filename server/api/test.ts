import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(request: VercelRequest, response: VercelResponse) {
  response.status(200).json({
    message: 'API test endpoint is working correctly',
    timestamp: new Date().toISOString(),
    query: request.query,
    method: request.method
  });
} 