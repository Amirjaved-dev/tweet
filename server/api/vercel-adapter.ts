import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Request, Response } from 'express';

/**
 * Helper function to adapt Express-style handlers to Vercel serverless functions
 * 
 * @param handler The Express-style request handler
 * @returns A Vercel serverless function handler
 */
export function createVercelHandler(
  handler: (req: Request, res: Response) => Promise<any> | void
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      // Add any common middleware or processing here
      await handler(req as unknown as Request, res as unknown as Response);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : 'An unexpected error occurred'
      });
    }
  };
}

/**
 * Simple helper to create a JSON response
 */
export function jsonResponse(res: VercelResponse | Response, statusCode: number, data: any) {
  return res.status(statusCode).json(data);
} 