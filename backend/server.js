import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Unified CSV processing endpoint that handles both initial processing and filtering
app.post('/api/process-csv', (req, res) => {
  console.log('=== CSV Processing Endpoint Called ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const { 
    startDate, 
    endDate, 
    severities, 
    partOfDay, 
    cityLocation,
    isFiltered = false 
  } = req.body;
  
  console.log('Processing parameters:', {
    startDate: startDate || 'None',
    endDate: endDate || 'None',
    severities: severities || 'All',
    partOfDay: partOfDay || 'All',
    cityLocation: cityLocation || 'all',
    isFiltered
  });

  // Build Python command arguments
  const pythonArgs = ['process_csv.py'];
  
  // Add date filtering if provided
  if (startDate && endDate) {
    pythonArgs.push('--start-date', startDate);
    pythonArgs.push('--end-date', endDate);
  }
  
  // Add filter parameters if this is a filtered request
  if (isFiltered) {
    console.log('This is a filtered request, adding filter parameters...');
    
    if (severities && severities.length > 0) {
      pythonArgs.push('--severities', severities.join(','));
      console.log('Added severities:', severities.join(','));
    }
    
    if (partOfDay && partOfDay.length > 0) {
      pythonArgs.push('--part-of-day', partOfDay.join(','));
      console.log('Added part-of-day:', partOfDay.join(','));
    }
    
    if (cityLocation && cityLocation !== 'all') {
      pythonArgs.push('--city-location', cityLocation);
      console.log('Added city-location:', cityLocation);
    }
  } else {
    console.log('This is NOT a filtered request, running base processing only...');
  }

  console.log('Final Python command:', `python ${pythonArgs.join(' ')}`);

  // Execute Python script
  const pythonProcess = spawn('python', pythonArgs, {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => {
    const output = data.toString();
    stdout += output;
    console.log('Python stdout:', output);
  });

  pythonProcess.stderr.on('data', (data) => {
    const error = data.toString();
    stderr += error;
    console.error('Python stderr:', error);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code: ${code}`);
    console.log('Full stdout:', stdout);
    console.log('Full stderr:', stderr);
    
    if (code === 0) {
      // Determine which output file to check based on whether it's filtered
      const outputFile = isFiltered 
        ? path.join(__dirname, 'filtered_data.csv')
        : path.join(__dirname, 'ps_removed_dt.csv');
      
      console.log('Checking for output file:', outputFile);
      
      if (fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        console.log(`Output file created successfully: ${path.basename(outputFile)} (${stats.size} bytes)`);
        res.json({ 
          success: true, 
          message: isFiltered ? 'Filters applied successfully' : 'CSV processed successfully',
          output: stdout,
          recordsProcessed: true,
          outputFile: path.basename(outputFile),
          fileSize: stats.size
        });
      } else {
        console.error(`Output file was not created: ${path.basename(outputFile)}`);
        console.log('Files in directory:', fs.readdirSync(__dirname));
        res.status(500).json({ 
          success: false, 
          error: `Output file was not created: ${path.basename(outputFile)}`,
          stderr: stderr,
          stdout: stdout,
          filesInDirectory: fs.readdirSync(__dirname)
        });
      }
    } else {
      console.error('Python script failed with code:', code);
      res.status(500).json({ 
        success: false, 
        error: `Processing failed (exit code: ${code})`,
        stderr: stderr,
        stdout: stdout
      });
    }
  });

  pythonProcess.on('error', (error) => {
    console.error('Failed to start Python process:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to start Python process: ${error.message}`,
      hint: 'Make sure Python is installed and accessible from command line'
    });
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working',
    cwd: __dirname,
    files: fs.readdirSync(__dirname)
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Working directory: ${__dirname}`);
  console.log('Available endpoints:');
  console.log('  POST /api/process-csv');
  console.log('  GET  /api/health');
  console.log('  GET  /api/test');
});