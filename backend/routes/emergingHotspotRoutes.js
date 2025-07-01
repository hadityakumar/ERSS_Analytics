import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post('/analysis', async (req, res) => {
  try {
    const { startDate, endDate, timeInterval = '2W', timeStep = 4, distance = 500 } = req.body;
    
    console.log('Starting emerging hotspots analysis...');
    console.log('Parameters:', { startDate, endDate, timeInterval, timeStep, distance });
    
    // Path to the Python script
    const pythonScriptPath = path.join(__dirname, '..', 'emerging_hotspot.py');
    const inputPath = path.join(__dirname, '..', 'ps_removed_dt.csv');
    const outputPath = path.join(__dirname, '..', 'emerging_hotspots.geojson');
    
    console.log('Python script path:', pythonScriptPath);
    console.log('Input path:', inputPath);
    console.log('Output path:', outputPath);
    
    // Check if Python script and input data exist
    if (!fs.existsSync(pythonScriptPath)) {
      return res.status(500).json({
        success: false,
        error: 'Emerging hotspots analysis script not found',
        details: `Script not found at: ${pythonScriptPath}`
      });
    }

    if (!fs.existsSync(inputPath)) {
      return res.status(500).json({
        success: false,
        error: 'Input data file not found',
        details: `Data file not found at: ${inputPath}`
      });
    }
    
    // Remove existing output file if it exists
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    
    // Format dates to YYYY-MM-DD format
    const formatDate = (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Extract YYYY-MM-DD part
      } catch (error) {
        console.error('Date formatting error:', error);
        return null;
      }
    };
    
    // Prepare Python command arguments - NO positional arguments
    const pythonArgs = [
      pythonScriptPath,
      '--input_file', inputPath,
      '--time_interval', timeInterval,
      '--time_step', timeStep.toString(),
      '--distance', distance.toString(),
      '--cell_size', '500'
    ];

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    if (formattedStartDate) {
      pythonArgs.push('--start_date', formattedStartDate);
    }
    if (formattedEndDate) {
      pythonArgs.push('--end_date', formattedEndDate);
    }
    
    console.log('Executing Python command:', 'python', pythonArgs);
    
    // Execute Python script
    const pythonProcess = spawn('python', pythonArgs, {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log('Python stdout:', output.trim());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const error = data.toString();
      stderr += error;
      console.error('Python stderr:', error.trim());
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      
      if (code === 0) {
        // Check if output file was created
        if (fs.existsSync(outputPath)) {
          try {
            const geojsonData = fs.readFileSync(outputPath, 'utf8');
            const parsedData = JSON.parse(geojsonData);
            
            // Calculate statistics
            const features = parsedData.features || [];
            const timePeriods = [...new Set(features.map(f => f.properties.time_bin))].length;
            const totalHotspots = features.filter(f => 
              f.properties.hotspot_type && 
              f.properties.hotspot_type.includes('Hot Spot')
            ).length;
            const emergingPatterns = features.filter(f => 
              f.properties.emerging_type === 'Intensifying'
            ).length;
            
            res.json({
              success: true,
              message: 'Emerging hotspots analysis completed successfully',
              details: {
                timePeriods: timePeriods,
                totalHotspots: totalHotspots,
                emergingPatterns: emergingPatterns,
                totalFeatures: features.length,
                outputFile: 'emerging_hotspots.geojson',
                dateRange: formattedStartDate && formattedEndDate ? `${formattedStartDate} to ${formattedEndDate}` : 'All dates',
                parameters: {
                  timeInterval,
                  timeStep,
                  distance,
                  cellSize: 500
                },
                executionSummary: stdout.trim()
              },
              data: {
                filePath: outputPath,
                geojsonContent: geojsonData
              }
            });
          } catch (readError) {
            console.error('Error reading output file:', readError);
            res.status(500).json({
              success: false,
              error: 'Failed to read emerging hotspots analysis results',
              details: readError.message
            });
          }
        } else {
          res.status(500).json({
            success: false,
            error: 'Emerging hotspots analysis completed but no output file was generated',
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
          error: 'Emerging hotspots analysis failed',
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
        error: 'Failed to execute emerging hotspots analysis',
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
          error: 'Emerging hotspots analysis timed out',
          details: 'Analysis took longer than 10 minutes'
        });
      }
    }, 600000); // 10 minutes timeout
    
  } catch (error) {
    console.error('Error in emerging hotspots analysis endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during emerging hotspots analysis',
      details: error.message
    });
  }
});

// GET endpoint to retrieve emerging hotspots results
router.get('/results', (req, res) => {
  try {
    const outputPath = path.join(__dirname, '..', 'emerging_hotspots.geojson');
    
    if (fs.existsSync(outputPath)) {
      const geojsonData = fs.readFileSync(outputPath, 'utf8');
      const stats = fs.statSync(outputPath);
      
      res.json({
        success: true,
        data: geojsonData,
        filePath: outputPath,
        timestamp: stats.mtime,
        fileSize: stats.size
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No emerging hotspots analysis results found',
        message: 'Please run emerging hotspots analysis first'
      });
    }
  } catch (error) {
    console.error('Error retrieving emerging hotspots results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve emerging hotspots results',
      details: error.message
    });
  }
});

// GET endpoint to check analysis status
router.get('/status', (req, res) => {
  try {
    const outputPath = path.join(__dirname, '..', 'emerging_hotspots.geojson');
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
    console.error('Error checking emerging hotspots status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check emerging hotspots status',
      details: error.message
    });
  }
});

export { router as emergingHotspotsRoutes };