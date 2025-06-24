import { processCsvData } from '@kepler.gl/processors';
import { addDataToMap, resetMapConfig } from '@kepler.gl/actions';
import keplerConfig from '../config/keplerConfig.json';
import { setDateFilter } from '../store';
import { processingStarted, processingComplete, processingError } from '../store';
import { DATE_FIELD_NAME } from '../components/DateRangeSelector';

const apiMiddleware = store => next => action => {
  // Handle initial data loading (full dataset, no date filtering)
  if (action.type === 'FETCH_CSV_DATA_INITIAL') {
    store.dispatch({ type: '@@kepler.gl/REGISTER', payload: { id: 'map' } });
    store.dispatch(processingStarted());

    console.log('Fetching full CSV dataset (initial load)...');

    // First trigger processing without date filter, then get the CSV
    fetch('http://localhost:5000/api/process-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // No date filter for initial load
    })
      .then(response => response.json())
      .then(result => {
        if (!result.success) {
          throw new Error(result.error || 'CSV processing failed');
        }
        console.log('CSV processing completed:', result.message);
        
        // Now fetch the processed CSV
        return fetch('http://localhost:5000/ps_removed_dt.csv');
      })
      .then(async response => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to get full CSV: ${text}`);
        }
        return response.text();
      })
      .then(csvText => {
        const parsedData = processCsvData(csvText);
        console.log(`Loading ${parsedData.rows.length} data points (full dataset)`);

        loadDataToKepler(store, parsedData, 'Crime Data (Full Dataset)');
      })
      .catch(err => store.dispatch(processingError(err.message)));
  }

  // Handle filtered data loading (with date range)  
  if (action.type === 'FETCH_CSV_DATA_FILTERED') {
    store.dispatch({ type: '@@kepler.gl/REGISTER', payload: { id: 'map' } });
    store.dispatch(processingStarted());

    const { startDate, endDate } = action.payload;
    console.log(`Fetching filtered CSV dataset (${startDate} to ${endDate})...`);

    // Call backend to process CSV with date filter
    fetch('http://localhost:5000/api/process-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: startDate,
        endDate: endDate
      })
    })
      .then(response => response.json())
      .then(result => {
        if (!result.success) {
          throw new Error(result.error || 'CSV processing failed');
        }
        console.log('Filtered CSV processing completed:', result.message);
        
        // Now fetch the processed CSV
        return fetch('http://localhost:5000/ps_removed_dt.csv');
      })
      .then(async response => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to get filtered CSV: ${text}`);
        }
        return response.text();
      })
      .then(csvText => {
        const parsedData = processCsvData(csvText);
        console.log(`Loading ${parsedData.rows.length} data points (filtered: ${startDate} to ${endDate})`);

        loadDataToKepler(store, parsedData, `Crime Data (${startDate} to ${endDate})`);
      })
      .catch(err => store.dispatch(processingError(err.message)));
  }

  // Keep the old FETCH_CSV_DATA for backward compatibility
  if (action.type === 'FETCH_CSV_DATA') {
    console.warn('FETCH_CSV_DATA is deprecated. Use FETCH_CSV_DATA_INITIAL or FETCH_CSV_DATA_FILTERED.');
    // Redirect to initial load
    store.dispatch({ type: 'FETCH_CSV_DATA_INITIAL' });
  }

  // Handle hotspot data loading
  if (action.type === 'LOAD_HOTSPOT_DATA') {
    console.log('Loading hotspot analysis data...');

    fetch(`http://localhost:5000/hotspot_analysis_results.csv?_=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    })
      .then(response => {
        console.log('Hotspot CSV fetch response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch hotspot data: ${response.status}`);
        }
        return response.text();
      })
      .then(csvText => {
        console.log('Raw hotspot CSV received, length:', csvText.length);

        const parsedData = processCsvData(csvText);

        console.log('Parsed hotspot data:', {
          rowCount: parsedData.rows.length,
          fields: parsedData.fields.map(f => f.name),
          firstRow: parsedData.rows[0]
        });

        if (parsedData.rows.length === 0) {
          alert('No hotspot data found. Please run the analysis first.');
          return;
        }

        const hotspotDatasetId = `hotspot-data-${Date.now()}`;
        const hotspotLayerId = `hotspot-layer-${Date.now()}`;

        store.dispatch(
          addDataToMap({
            datasets: [{
              info: {
                id: hotspotDatasetId,
                label: 'Hotspot Analysis'
              },
              data: parsedData
            }],
            options: {
              centerMap: false,
              keepExistingConfig: true,
              readOnly: false
            },
            config: {
              visState: {
                layers: [
                  {
                    id: hotspotLayerId,
                    type: 'heatmap',
                    config: {
                      dataId: hotspotDatasetId,
                      label: 'Hotspot Heatmap',
                      color: [255, 107, 53],
                      columns: {
                        lat: 'latitude',
                        lng: 'longitude'
                      },
                      isVisible: true,
                      visConfig: {
                        opacity: 0.8,
                        colorRange: {
                          name: 'Global Warming',
                          type: 'sequential',
                          category: 'Uber',
                          colors: [
                            '#5A1846',
                            '#900C3F',
                            '#C70039',
                            '#E3611C',
                            '#F1920E',
                            '#FFC300'
                          ]
                        },
                        radius: 60,
                        intensity: 1,
                        threshold: 0.05
                      },
                      weightField: {
                        name: 'gi_star',
                        type: 'real'
                      }
                    }
                  }
                ]
              }
            }
          })
        );

        console.log('Hotspot heatmap layer added successfully');
      })
      .catch(error => {
        console.error('Error loading hotspot data:', error);
        alert(`Failed to load hotspot data: ${error.message}`);
      });
  }

  // Handle KDE data loading
  if (action.type === 'LOAD_KDE_DATA') {
    console.log('Loading KDE analysis data...');

    fetch(`http://localhost:5000/kde_analysis_results.csv?_=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    })
      .then(response => {
        console.log('KDE CSV fetch response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch KDE data: ${response.status}`);
        }
        return response.text();
      })
      .then(csvText => {
        console.log('Raw KDE CSV received, length:', csvText.length);

        const parsedData = processCsvData(csvText);

        console.log('Parsed KDE data:', {
          rowCount: parsedData.rows.length,
          fields: parsedData.fields.map(f => f.name),
          firstRow: parsedData.rows[0]
        });

        if (parsedData.rows.length === 0) {
          alert('No KDE data found. Please run the analysis first.');
          return;
        }

        const kdeDatasetId = `kde-data-${Date.now()}`;
        const kdeLayerId = `kde-layer-${Date.now()}`;

        store.dispatch(
          addDataToMap({
            datasets: [{
              info: {
                id: kdeDatasetId,
                label: 'KDE Analysis'
              },
              data: parsedData
            }],
            options: {
              centerMap: false,
              keepExistingConfig: true,
              readOnly: false
            },
            config: {
              visState: {
                layers: [
                  {
                    id: kdeLayerId,
                    type: 'heatmap',
                    config: {
                      dataId: kdeDatasetId,
                      label: 'KDE Heatmap',
                      color: [46, 134, 171],
                      columns: {
                        lat: 'latitude',
                        lng: 'longitude'
                      },
                      isVisible: true,
                      visConfig: {
                        opacity: 0.8,
                        colorRange: {
                          name: 'Blues',
                          type: 'sequential',
                          category: 'ColorBrewer',
                          colors: [
                            '#f7fbff',
                            '#deebf7',
                            '#c6dbef',
                            '#9ecae1',
                            '#6baed6',
                            '#4292c6',
                            '#2171b5',
                            '#08519c',
                            '#08306b'
                          ]
                        },
                        radius: 60,
                        intensity: 2,
                        threshold: 0.01
                      },
                      weightField: {
                        name: 'kde_weight',
                        type: 'real'
                      }
                    }
                  }
                ]
              }
            }
          })
        );

        console.log('KDE heatmap layer added successfully');
      })
      .catch(error => {
        console.error('Error loading KDE data:', error);
        alert(`Failed to load KDE data: ${error.message}`);
      });
  }

  return next(action);
};

function loadDataToKepler(store, parsedData, label) {
  console.log('CSV Data Preview:', {
    firstRow: parsedData.rows[0] || 'No data',
    fields: parsedData.fields,
    rowCount: parsedData.rows.length
  });

  if (parsedData.rows.length === 0) {
    console.error('No data points in the CSV file!');
    store.dispatch(processingError('No data points found in the CSV file.'));
    return;
  }

  // Create unique dataset ID
  const datasetId = `csv-data-${Date.now()}`;
  
  // Use the original keplerConfig but update dataId references
  const config = JSON.parse(JSON.stringify(keplerConfig)); // Deep clone
  
  // Update all dataId references to match the new dataset
  config.config.visState.filters.forEach(filter => {
    if (filter.dataId && Array.isArray(filter.dataId)) {
      filter.dataId = [datasetId];
    }
  });
  
  config.config.visState.layers.forEach(layer => {
    if (layer.config && layer.config.dataId) {
      layer.config.dataId = datasetId;
    }
    // Update layer ID to be unique
    layer.id = `points-layer-${Date.now()}`;
  });
  
  // Update tooltip references
  if (config.config.visState.interactionConfig.tooltip.fieldsToShow) {
    const oldDataId = Object.keys(config.config.visState.interactionConfig.tooltip.fieldsToShow)[0];
    if (oldDataId) {
      config.config.visState.interactionConfig.tooltip.fieldsToShow[datasetId] = 
        config.config.visState.interactionConfig.tooltip.fieldsToShow[oldDataId];
      delete config.config.visState.interactionConfig.tooltip.fieldsToShow[oldDataId];
    }
  }

  store.dispatch(resetMapConfig('map'));
  store.dispatch(processingComplete());

  setTimeout(() => {
    store.dispatch(
      addDataToMap({
        datasets: [{ info: { id: datasetId, label }, data: parsedData }],
        options: {
          centerMap: true,
          keepExistingConfig: false,
          readOnly: false
        },
        config: config.config
      })
    );
  }, 100);

  console.log(`${label} loaded successfully`);
}

export default apiMiddleware;