import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';

export class DebugService {
  async getCSVColumns() {
    const csvFile = path.join(config.BACKEND_DIR, config.CSV_INPUT_FILE);
    
    if (!fs.existsSync(csvFile)) {
      throw new Error('CSV file not found');
    }

    const csvContent = fs.readFileSync(csvFile, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    return {
      success: true,
      headers: headers,
      totalLines: lines.length,
      sampleData: lines.slice(1, 6)
    };
  }
}