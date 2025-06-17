import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/process-csv', (req, res) => {
  console.log('Processing CSV data...');
  
  const { startDate, endDate } = req.body;
  const hasDateFilter = startDate && endDate;
  
  console.log(`Date filter: ${hasDateFilter ? `${startDate} to ${endDate}` : 'none (using all data)'}`);
  
  const scriptArgs = [path.join(__dirname, 'process_csv.py')];
  
  if (hasDateFilter) {
    scriptArgs.push('--start-date', startDate);
    scriptArgs.push('--end-date', endDate);
  }
  
  const pythonProcess = spawn('python', scriptArgs);
  
  let stdoutData = '';
  let stderrData = '';
  
  pythonProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
    console.log(`Python output: ${data}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
    console.error(`Python error: ${data}`);
  });
  
  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    
    if (code !== 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'CSV processing failed', 
        error: stderrData 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'CSV processed successfully', 
      details: stdoutData,
      dateFilter: hasDateFilter ? { startDate, endDate } : null
    });
  });
});

app.post('/api/hotspot-analysis', (req, res) => {
  console.log('Performing hotspot analysis...');
  
  const { startDate, endDate } = req.body;
  const hasDateFilter = startDate && endDate;
  
  console.log(`Hotspot analysis with date filter: ${hasDateFilter ? `${startDate} to ${endDate}` : 'none (using all data)'}`);
  
  const scriptArgs = [path.join(__dirname, 'hotspot_analysis.py')];
  
  if (hasDateFilter) {
    scriptArgs.push('--start-date', startDate);
    scriptArgs.push('--end-date', endDate);
  }
  
  console.log('Running Python script with args:', scriptArgs);
  
  const pythonProcess = spawn('python', scriptArgs);
  
  let stdoutData = '';
  let stderrData = '';
  
  pythonProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
    console.log(`Hotspot analysis output: ${data}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
    console.error(`Hotspot analysis error: ${data}`);
  });
  
  pythonProcess.on('close', (code) => {
    console.log(`Hotspot analysis process exited with code ${code}`);
    console.log('Stdout:', stdoutData);
    console.log('Stderr:', stderrData);
    
    if (code !== 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'Hotspot analysis failed', 
        error: stderrData 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Hotspot analysis completed successfully', 
      details: stdoutData,
      dateFilter: hasDateFilter ? { startDate, endDate } : null
    });
  });
});

// KDE analysis endpoint - ADD THIS
app.post('/api/kde-analysis', (req, res) => {
  console.log('Performing KDE analysis...');
  
  const { startDate, endDate } = req.body;
  const hasDateFilter = startDate && endDate;
  
  console.log(`KDE analysis with date filter: ${hasDateFilter ? `${startDate} to ${endDate}` : 'none (using all data)'}`);
  
  const scriptArgs = [path.join(__dirname, 'kde_analysis.py')];
  
  if (hasDateFilter) {
    scriptArgs.push('--start-date', startDate);
    scriptArgs.push('--end-date', endDate);
  }
  
  console.log('Running KDE Python script with args:', scriptArgs);
  
  const pythonProcess = spawn('python', scriptArgs);
  
  let stdoutData = '';
  let stderrData = '';
  
  pythonProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
    console.log(`KDE analysis output: ${data}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
    console.error(`KDE analysis error: ${data}`);
  });
  
  pythonProcess.on('close', (code) => {
    console.log(`KDE analysis process exited with code ${code}`);
    console.log('KDE Stdout:', stdoutData);
    console.log('KDE Stderr:', stderrData);
    
    if (code !== 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'KDE analysis failed', 
        error: stderrData 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'KDE analysis completed successfully', 
      details: stdoutData,
      dateFilter: hasDateFilter ? { startDate, endDate } : null
    });
  });
});

// Serve hotspot results CSV
app.get('/hotspot_analysis_results.csv', (req, res) => {
  const csvPath = path.join(__dirname, 'hotspot_analysis_results.csv');
  
  console.log('Requested hotspot CSV path:', csvPath);
  
  if (!fs.existsSync(csvPath)) {
    console.error('Hotspot CSV file not found:', csvPath);
    return res.status(404).json({ 
      error: 'Hotspot analysis results not found. Please run the analysis first.' 
    });
  }
  
  const stats = fs.statSync(csvPath);
  console.log('Hotspot CSV file size:', stats.size, 'bytes');
  
  if (stats.size === 0) {
    console.error('Hotspot CSV file is empty');
    return res.status(404).json({ 
      error: 'Hotspot analysis results file is empty. Please run the analysis again.' 
    });
  }
  
  res.set({
    'Content-Type': 'text/csv',
    'Cache-Control': 'no-cache',
    'ETag': Date.now().toString(),
    'Access-Control-Allow-Origin': '*'
  });
  
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    console.log('Sending hotspot CSV, first 200 chars:', csvContent.substring(0, 200));
    res.send(csvContent);
  } catch (error) {
    console.error('Error reading hotspot CSV file:', error);
    res.status(500).json({ 
      error: 'Error reading hotspot analysis results file.' 
    });
  }
});

// Serve KDE results CSV - ADD THIS
app.get('/kde_analysis_results.csv', (req, res) => {
  const csvPath = path.join(__dirname, 'kde_analysis_results.csv');
  
  console.log('Requested KDE CSV path:', csvPath);
  
  if (!fs.existsSync(csvPath)) {
    console.error('KDE CSV file not found:', csvPath);
    return res.status(404).json({ 
      error: 'KDE analysis results not found. Please run the analysis first.' 
    });
  }
  
  const stats = fs.statSync(csvPath);
  console.log('KDE CSV file size:', stats.size, 'bytes');
  
  if (stats.size === 0) {
    console.error('KDE CSV file is empty');
    return res.status(404).json({ 
      error: 'KDE analysis results file is empty. Please run the analysis again.' 
    });
  }
  
  res.set({
    'Content-Type': 'text/csv',
    'Cache-Control': 'no-cache',
    'ETag': Date.now().toString(),
    'Access-Control-Allow-Origin': '*'
  });
  
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    console.log('Sending KDE CSV, first 200 chars:', csvContent.substring(0, 200));
    res.send(csvContent);
  } catch (error) {
    console.error('Error reading KDE CSV file:', error);
    res.status(500).json({ 
      error: 'Error reading KDE analysis results file.' 
    });
  }
});

app.get('/ps_removed_dt.csv', (req, res) => {
  const csvPath = path.join(__dirname, 'ps_removed_dt.csv');
  
  console.log('Requested CSV path:', csvPath);
  
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    return res.status(404).json({ 
      error: 'CSV file not found. Please process the data first.' 
    });
  }
  
  res.set({
    'Content-Type': 'text/csv',
    'Cache-Control': 'no-cache',
    'ETag': Date.now().toString(),
    'Access-Control-Allow-Origin': '*'
  });
  
  res.sendFile(csvPath);
});

// Serve static files (this should be last)
app.use(express.static(path.join(__dirname, '..')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Backend directory: ${__dirname}`);
  console.log(`Expected hotspot CSV location: ${path.join(__dirname, 'hotspot_analysis_results.csv')}`);
  console.log(`Expected KDE CSV location: ${path.join(__dirname, 'kde_analysis_results.csv')}`);
});