import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(request: VercelRequest, response: VercelResponse) {
  response.status(200).json({
    message: 'ThreadFlowPro API is running',
    endpoints: [
      {
        path: '/api/health',
        description: 'Health check endpoint'
      },
      {
        path: '/api/test',
        description: 'Test endpoint'
      }
    ],
    timestamp: new Date().toISOString()
  });
} 