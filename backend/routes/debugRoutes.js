import express from 'express';
import { DebugService } from '../services/debugService.js';

const router = express.Router();
const debugService = new DebugService();

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

router.get('/debug/columns', async (req, res) => {
  try {
    const result = await debugService.getCSVColumns();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as debugRoutes };