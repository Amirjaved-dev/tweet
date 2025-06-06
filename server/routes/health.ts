import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    serverType: process.env.VERCEL === '1' ? 'vercel-serverless' : 'node-express'
  });
});

export default router; 