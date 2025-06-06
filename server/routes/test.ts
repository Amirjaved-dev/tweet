import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'API test endpoint is working correctly',
    timestamp: new Date().toISOString(),
    query: req.query
  });
});

export default router; 