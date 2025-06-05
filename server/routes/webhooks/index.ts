import express from 'express';
import clerkRoutes from './clerk';
import coinbaseRoutes from './coinbase';  // Import from dedicated coinbase file

const router = express.Router();

// Register the clerk webhook route at /api/webhooks/clerk
router.use('/clerk', clerkRoutes);

// Register the Coinbase webhook route at /api/webhooks/coinbase
router.use('/coinbase', coinbaseRoutes);

// Add a direct GET handler for the /api/webhooks route
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Webhook endpoint is active',
    endpoints: {
      clerk: '/api/webhooks/clerk',
      coinbase: '/api/webhooks/coinbase'
    },
    timestamp: new Date().toISOString()
  });
});

export default router; 