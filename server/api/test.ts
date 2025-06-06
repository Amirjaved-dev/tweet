import { Request, Response } from 'express';

export default function handler(request: Request, response: Response) {
  response.status(200).json({
    message: 'API test endpoint is working correctly',
    timestamp: new Date().toISOString(),
    query: request.query,
    method: request.method
  });
} 