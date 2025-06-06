import { Request, Response } from 'express';

export default function handler(request: Request, response: Response) {
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