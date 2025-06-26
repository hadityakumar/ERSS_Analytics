import express from 'express';
import { CSVProcessor } from '../services/csvProcessor.js';

const router = express.Router();
const csvProcessor = new CSVProcessor();

router.post('/process-csv', async (req, res) => {
  try {
    const result = await csvProcessor.processCSV(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as processCSVRoute };