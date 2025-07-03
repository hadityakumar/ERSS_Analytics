import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config.js';
import { CommandBuilder } from '../utils/commandBuilder.js';
import { FileValidator } from '../utils/fileValidator.js';

export class CSVProcessor {
  constructor() {
    this.commandBuilder = new CommandBuilder();
    this.fileValidator = new FileValidator();
  }

  async processCSV(requestData) {
    const {
      startDate, endDate, mainTypes, subtypes,
      severities, partOfDay, cityLocation,
      isFiltered = false, combinedFiltering = false,
      useDateFilteredBase = false
    } = requestData;

    // Build Python command
    const pythonArgs = this.commandBuilder.buildCommand({
      startDate, endDate, mainTypes, subtypes,
      severities, partOfDay, cityLocation,
      isFiltered, combinedFiltering, useDateFilteredBase
    });

    // Execute Python script
    const result = await this.executePythonScript(pythonArgs);
    
    // Validate output file
    const outputFile = this.determineOutputFile(requestData);
    const fileValidation = this.fileValidator.validateOutputFile(outputFile);
    
    if (!fileValidation.exists) {
      throw new Error(`Output file was not created: ${path.basename(outputFile)}`);
    }

    return {
      success: true,
      message: this.buildSuccessMessage(requestData),
      outputFile: path.basename(outputFile),
      fileSize: fileValidation.size,
      appliedFilters: this.getAppliedFilters(requestData)
    };
  }

  async executePythonScript(pythonArgs) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', pythonArgs, {
        cwd: config.BACKEND_DIR,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderr = '';

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          reject(new Error(`Processing failed (exit code: ${code}): ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  determineOutputFile(requestData) {
    const hasFilters = this.hasAnyFilters(requestData);
    const filename = (requestData.isFiltered && hasFilters)
      ? config.FILTERED_OUTPUT_FILE
      : config.PROCESSED_OUTPUT_FILE;
    
    return path.join(config.BACKEND_DIR, filename);
  }

  hasAnyFilters(requestData) {
    const { mainTypes, subtypes, severities, partOfDay, cityLocation } = requestData;
    return (mainTypes && mainTypes.length > 0) ||
           (subtypes && subtypes.length > 0) ||
           (severities && severities.length > 0) ||
           (partOfDay && partOfDay.length > 0) ||
           (cityLocation && cityLocation !== 'all');
  }

  getAppliedFilters(requestData) {
    const { startDate, endDate, mainTypes, subtypes, severities, partOfDay, cityLocation } = requestData;
    const filters = [];

    if (startDate && endDate) filters.push('date range');
    if (mainTypes && mainTypes.length > 0) filters.push('main types');
    if (subtypes && subtypes.length > 0) filters.push('subtypes');
    if (severities && severities.length > 0) filters.push('severities');
    if (partOfDay && partOfDay.length > 0) filters.push('time of day');
    if (cityLocation && cityLocation !== 'all') filters.push('city location');

    return filters;
  }

  buildSuccessMessage(requestData) {
    const appliedFilters = this.getAppliedFilters(requestData);
    return appliedFilters.length > 0
      ? `Filters applied successfully: ${appliedFilters.join(', ')}`
      : 'CSV processed successfully';
  }
}