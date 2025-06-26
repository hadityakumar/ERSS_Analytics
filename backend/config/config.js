import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  PORT: process.env.PORT || 5000,
  BACKEND_DIR: path.dirname(__dirname),
  CSV_INPUT_FILE: 'input_data.csv',
  PROCESSED_OUTPUT_FILE: 'ps_removed_dt.csv',
  FILTERED_OUTPUT_FILE: 'filtered_data.csv',
  PYTHON_SCRIPT: 'process_csv.py'
};