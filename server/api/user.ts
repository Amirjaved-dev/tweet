import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(request: VercelRequest, response: VercelResponse) {
  // For demo purposes, return a dummy user object
  response.status(200).json({
    user: {
      id: 'demo-user',
      email: 'demo@example.com',
      username: 'demouser',
      plan: 'free',
      isPremium: false
    },
    timestamp: new Date().toISOString()
  });
} 