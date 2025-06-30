import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post('/hotspot-analysis', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    console.log('Starting hotspot analysis...');
    console.log('Date range:', startDate, 'to', endDate);
    
    // Path to the Python script (one level up from routes directory)
    const pythonScriptPath = path.join(__dirname, '..', 'hotspot_analysis.py');
    const outputPath = path.join(__dirname, '..', 'hotspot_analysis_results.csv');
    
    console.log('Python script path:', pythonScriptPath);
    console.log('Output path:', outputPath);
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
      return res.status(500).json({
        success: false,
        error: 'Hotspot analysis script not found',
        details: `Script not found at: ${pythonScriptPath}`
      });
    }
    
    // Remove existing output file if it exists
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    
    // Prepare Python command arguments
    const pythonArgs = [pythonScriptPath];
    if (startDate) {
      pythonArgs.push('--start-date', startDate);
    }
    if (endDate) {
      pythonArgs.push('--end-date', endDate);
    }
    
    console.log('Executing Python command:', 'python', pythonArgs);
    
    // Execute Python script
    const pythonProcess = spawn('python', pythonArgs, {
      cwd: path.join(__dirname, '..')
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
      console.log(`Python process exited with code ${code}`);
      
      if (code === 0) {
        // Check if output file was created
        if (fs.existsSync(outputPath)) {
          try {
            const csvData = fs.readFileSync(outputPath, 'utf8');
            const lines = csvData.split('\n').filter(line => line.trim() !== '');
            const hotspotCount = lines.length - 1; // Subtract header
            
            // Parse CSV to get statistics
            const dataLines = lines.slice(1); // Skip header
            let hotSpots = 0;
            let coldSpots = 0;
            
            dataLines.forEach(line => {
              if (line.includes('Hot Spot')) hotSpots++;
              if (line.includes('Cold Spot')) coldSpots++;
            });
            
            res.json({
              success: true,
              message: 'Hotspot analysis completed successfully',
              details: {
                totalCells: hotspotCount,
                hotSpots: hotSpots,
                coldSpots: coldSpots,
                outputFile: 'hotspot_analysis_results.csv',
                dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All dates',
                executionSummary: stdout.trim()
              },
              data: {
                filePath: outputPath,
                csvContent: csvData
              }
            });
          } catch (readError) {
            console.error('Error reading output file:', readError);
            res.status(500).json({
              success: false,
              error: 'Failed to read hotspot analysis results',
              details: readError.message
            });
          }
        } else {
          res.status(500).json({
            success: false,
            error: 'Hotspot analysis completed but no output file was generated',
            details: {
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              expectedOutputPath: outputPath
            }
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: 'Hotspot analysis failed',
          details: {
            exitCode: code,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            pythonArgs: pythonArgs
          }
        });
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to execute hotspot analysis',
        details: {
          message: error.message,
          pythonCommand: `python ${pythonArgs.join(' ')}`
        }
      });
    });
    
    // Set timeout for long-running analysis
    setTimeout(() => {
      if (!pythonProcess.killed) {
        pythonProcess.kill();
        res.status(408).json({
          success: false,
          error: 'Hotspot analysis timed out',
          details: 'Analysis took longer than 5 minutes'
        });
      }
    }, 300000); // 5 minutes timeout
    
  } catch (error) {
    console.error('Error in hotspot analysis endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during hotspot analysis',
      details: error.message
    });
  }
});

// GET endpoint to retrieve hotspot results
router.get('/hotspot-results', (req, res) => {
  try {
    const outputPath = path.join(__dirname, '..', 'hotspot_analysis_results.csv');
    
    if (fs.existsSync(outputPath)) {
      const csvData = fs.readFileSync(outputPath, 'utf8');
      const stats = fs.statSync(outputPath);
      
      res.json({
        success: true,
        data: csvData,
        filePath: outputPath,
        timestamp: stats.mtime,
        fileSize: stats.size
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No hotspot analysis results found',
        message: 'Please run hotspot analysis first'
      });
    }
  } catch (error) {
    console.error('Error retrieving hotspot results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve hotspot results',
      details: error.message
    });
  }
});

// GET endpoint to check analysis status
router.get('/hotspot-status', (req, res) => {
  try {
    const outputPath = path.join(__dirname, '..', 'hotspot_analysis_results.csv');
    const inputPath = path.join(__dirname, '..', 'ps_removed_dt.csv');
    
    const status = {
      hasInputData: fs.existsSync(inputPath),
      hasResults: fs.existsSync(outputPath),
      lastAnalysis: null,
      inputFileSize: null,
      resultFileSize: null
    };
    
    if (status.hasInputData) {
      const inputStats = fs.statSync(inputPath);
      status.inputFileSize = inputStats.size;
    }
    
    if (status.hasResults) {
      const outputStats = fs.statSync(outputPath);
      status.lastAnalysis = outputStats.mtime;
      status.resultFileSize = outputStats.size;
    }
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error checking hotspot status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check hotspot status',
      details: error.message
    });
  }
});

export { router as hotspotRoutes };