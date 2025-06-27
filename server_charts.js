const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const dotenv = require('dotenv'); 


dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());


const { formatPrompt } = require('./utils/promptFormatter');
const { generateLlmInsight } = require('./utils/llmInference');

// Helper function to execute Python script
const executePythonScript = (action, filters, res) => {

    const processedFilters = { ...filters };
    if (filters.part_of_day) processedFilters.part_of_day = filters.part_of_day.split(',');
    if (filters.main_event_type) processedFilters.main_event_type = filters.main_event_type.split(',');
    if (filters.sub_event_type) processedFilters.sub_event_type = filters.sub_event_type.split(',');
    if (filters.severity_label) processedFilters.severity_label = filters.severity_label.split(',');


    if (action === 'get_trends' && filters.baseline_options) {
        processedFilters.baseline_options = filters.baseline_options.split(',');
    }

    const pythonProcess = spawn('python', [
        './scripts/process_data_python.py',
        JSON.stringify({ action: action, filters: processedFilters })
    ]);

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
                    console.error(`Python script reported an error for action "${action}":`, parsedData.error);
                    console.error('Python Error Output:', errorOutput);
                    res.status(500).json({ error: parsedData.error, details: errorOutput });
                } else {
                    res.json(parsedData);
                }
            } catch (e) {
                console.error(`Failed to parse Python script output for action "${action}":`, e);
                console.error('Python Output:', data);
                console.error('Python Error Output:', errorOutput);
                res.status(500).json({ error: 'Failed to parse data from Python script.', details: errorOutput });
            }
        } else {
            console.error(`Python script for action "${action}" exited with code ${code}`);
            console.error('Python Error Output:', errorOutput);
            res.status(500).json({ error: `Python script error for action "${action}": ${errorOutput}` });
        }
    });
};

// --- API Endpoints ---

app.get('/api/trends', (req, res) => {
    executePythonScript('get_trends', req.query, res);
});

app.get('/api/main-event-distribution', (req, res) => {
    executePythonScript('get_main_event_distribution', req.query, res);
});

app.get('/api/severity-distribution', (req, res) => {
    executePythonScript('get_severity_distribution', req.query, res);
});

app.get('/api/event-by-part-of-day', (req, res) => {
    executePythonScript('get_event_by_part_of_day', req.query, res);
});

app.get('/api/metadata', (req, res) => {
    executePythonScript('get_metadata', {}, res); 
});


app.get('/api/kpis', (req, res) => {
    executePythonScript('get_kpi_data', req.query, res); 
});

app.get('/api/top-main-events', (req, res) => {
    executePythonScript('get_top_main_event_types', req.query, res); 
});


app.get('/api/filtered-sub-event-types', (req, res) => {
    executePythonScript('get_filtered_sub_event_types', req.query, res); 
});


app.get('/api/filtered-raw-data', (req, res) => {
    executePythonScript('get_filtered_raw_data', req.query, res);
});


app.post('/api/generate-insight', async (req, res) => {
    console.log(`Received insight request. Payload keys: ${Object.keys(req.body)}`);

    const { chart_title, chart_type, data, filters } = req.body;

    if (!chart_title || !chart_type || !data) {
        console.error("Missing required fields for insight generation.");
        return res.status(400).json({ error: "Missing required fields: 'chart_title', 'chart_type', 'data'." });
    }

    if (!Array.isArray(data)) {
        console.error("'data' field must be an array.");
        return res.status(400).json({ error: "'data' field must be a list of data points." });
    }

    if (typeof filters !== 'object' || filters === null) {
        console.error("'filters' field must be an object.");
        return res.status(400).json({ error: "'filters' field must be a dictionary." });
    }

    try {
        console.log(`Formatting prompt for chart: '${chart_title}' (Type: ${chart_type})`);
        const prompt = formatPrompt(chart_title, chart_type, data, filters);
        console.log(`Generated prompt (snippet): ${prompt.substring(0, 500)}...`);

        console.log("Sending prompt to Ollama LLM for insight generation...");
        const insight = await generateLlmInsight(prompt);
        console.log(`Received insight from LLM: ${insight}`);

        return res.json({ insight });
    } catch (error) {
        console.error("Error generating insight:", error.message);
        if (error.response) { // Axios error with a response from the server
            console.error("Ollama API Error Status:", error.response.status);
            console.error("Ollama API Error Data:", error.response.data);
        }
        return res.status(500).json({ error: `Failed to generate insight: ${error.message}` });
    }
});


app.listen(port, () => {
    console.log(`Express backend listening at http://localhost:${port}`);
    console.log("Ensure 'csv_use_new.csv' is in the './' directory relative to 'process_data_python.py'");
});