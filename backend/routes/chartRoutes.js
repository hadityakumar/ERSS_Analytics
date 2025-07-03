import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper function to execute Python script
const executePythonScript = (action, filters, res) => {
    // Process filters to convert comma-separated strings to arrays
    const processedFilters = { ...filters };
    
    // Handle array filters
    if (filters.part_of_day) processedFilters.part_of_day = filters.part_of_day.split(',');
    if (filters.main_event_type) processedFilters.main_event_type = filters.main_event_type.split(',');
    if (filters.sub_event_type) processedFilters.sub_event_type = filters.sub_event_type.split(',');
    if (filters.severity_label) processedFilters.severity_label = filters.severity_label.split(',');

    // Handle baseline options for trends
    if (action === 'get_trends' && filters.baseline_options) {
        processedFilters.baseline_options = filters.baseline_options.split(',');
    }

    // Handle datetime filters - ensure proper format
    if (filters.start_date) {
        processedFilters.start_date = filters.start_date;
    }
    if (filters.end_date) {
        processedFilters.end_date = filters.end_date;
    }
    if (filters.start_datetime) {
        processedFilters.start_datetime = filters.start_datetime;
    }
    if (filters.end_datetime) {
        processedFilters.end_datetime = filters.end_datetime;
    }

    // Handle trend type
    if (filters.trend_type) {
        processedFilters.trend_type = filters.trend_type;
    }

    // Get the correct path to the Python script
    const backendDir = path.dirname(__dirname); // Go up from routes to backend
    const pythonScriptPath = path.join(backendDir, 'process_data_python_charts.py');
    
    // Check if files exist
    const primaryFile = path.join(backendDir, 'filtered_data.csv');
    const fallbackFile = path.join(backendDir, 'ps_removed_dt.csv');
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
        res.status(500).json({ error: `Python script not found at: ${pythonScriptPath}` });
        return;
    }

    const pythonProcess = spawn('python', [
        pythonScriptPath,
        JSON.stringify({ action: action, filters: processedFilters })
    ], {
        cwd: backendDir
    });

    let data = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (chunk) => {
        data += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
        errorOutput += chunk.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            try {
                const parsedData = JSON.parse(data);
                if (parsedData.error) {
                    res.status(500).json({ error: parsedData.error, details: errorOutput });
                } else {
                    res.json(parsedData);
                }
            } catch (e) {
                res.status(500).json({ error: 'Failed to parse data from Python script.', details: errorOutput, rawOutput: data });
            }
        } else {
            res.status(500).json({ error: `Python script error for action "${action}": ${errorOutput}` });
        }
    });
};

// Chart API Endpoints
router.get('/trends', (req, res) => {
    executePythonScript('get_trends', req.query, res);
});

router.get('/main-event-distribution', (req, res) => {
    executePythonScript('get_main_event_distribution', req.query, res);
});

router.get('/severity-distribution', (req, res) => {
    executePythonScript('get_severity_distribution', req.query, res);
});

router.get('/event-by-part-of-day', (req, res) => {
    executePythonScript('get_event_by_part_of_day', req.query, res);
});

router.get('/metadata', (req, res) => {
    executePythonScript('get_metadata', {}, res);
});

router.get('/kpis', (req, res) => {
    executePythonScript('get_kpi_data', req.query, res);
});

router.get('/top-main-events', (req, res) => {
    executePythonScript('get_top_main_event_types', req.query, res);
});

router.get('/filtered-sub-event-types', (req, res) => {
    executePythonScript('get_filtered_sub_event_types', req.query, res);
});

router.get('/filtered-raw-data', (req, res) => {
    executePythonScript('get_filtered_raw_data', req.query, res);
});

export { router as chartRoutes };
