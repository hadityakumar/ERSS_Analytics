import { processCsvData } from '@kepler.gl/processors';
import { addDataToMap, resetMapConfig } from '@kepler.gl/actions';
import { processingStarted, processingComplete, processingError } from '../store';

const apiMiddleware = store => next => action => {
  if (action.type === 'FETCH_CSV_DATA') {
    store.dispatch({
      type: '@@kepler.gl/REGISTER',
      payload: {
        id: 'map'
      }
    });
    
    store.dispatch(processingStarted());
    
    const { startDate, endDate } = action.payload || {};
    const hasDateFilter = startDate && endDate;
    
    console.log(`Fetching CSV data${hasDateFilter ? ` with filter ${startDate} to ${endDate}` : ''}`);
    
    fetch('/api/process-csv', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hasDateFilter ? { startDate, endDate } : {})
    })
    .then(async response => {
      if (!response.ok) {
        const text = await response.text();
          throw new Error(`Failed to process CSV: ${text}`);
      }
      return response.json();
    })
    .then(result => {
      console.log('CSV processing result:', result);
      
      // Now fetch the processed CSV file
      return fetch(`/ps_removed_dt.csv?_=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch processed CSV: ${response.status}`);
      }
      return response.text();
    })
    .then(csvText => {
      const parsedData = processCsvData(csvText);
      console.log(`Loading ${parsedData.rows.length} data points`);
      
      console.log('CSV Data Preview:', {
        firstRow: parsedData.rows[0] || 'No data',
        fields: parsedData.fields,
        rowCount: parsedData.rows.length
      });

      if (parsedData.rows.length === 0) {
        console.error('No data points to display after filtering!');
        store.dispatch(processingError('No data points found for the selected date range.'));
        return;
      }
      
      // Create unique dataset ID to force refresh
      const datasetId = `csv-data-${Date.now()}`;
      const layerId = `points-layer-${Date.now()}`;
      
      console.log('About to load data with:', {
        rowCount: parsedData.rows.length,
        columns: parsedData.fields.map(f => f.name),
        datasetId,
        layerId
      });
      
      store.dispatch(processingComplete());
      
      store.dispatch(resetMapConfig('map'));
    
      setTimeout(() => {
        store.dispatch(
          addDataToMap({
            datasets: [{
              info: {
                id: datasetId, // Use unique ID
                label: hasDateFilter ? 
                  `Crime Data (${startDate} to ${endDate})` : 
                  'Crime Data'
              },
              data: parsedData
            }],
            options: {
              centerMap: true,
              keepExistingConfig: false,
              readOnly: false
            },
            config: {
              mapStyle: {
                styleType: 'customTileserver',
                mapStyles: {
                  customTileserver: {
                    id: 'customTileserver',
                    label: 'Local Tileserver',
                    url: 'http://localhost:8080/styles/basic-preview/style.json',
                    icon: 'map',
                    layerGroups: [] // Keep this empty for custom tileserver
                  }
                },
                // Configure topLayerGroups for light base map blending
                topLayerGroups: {
                  // These are typical settings for a "light" map overlay
                  // You might need to adjust these based on your tileserver's layers
                  label: true,        // Show labels
                  road: true,         // Show roads
                  border: false,      // Hide borders (optional)
                  building: false,    // Hide 3D buildings
                  water: true,        // Show water
                  land: true,         // Show land
                  '3d building': false // Explicitly hide 3D buildings
                }
              },
              mapState: {
                bearing: 0,
                dragRotate: false,
                latitude: 8.5241, // Trivandrum latitude
                longitude: 76.9366, // Trivandrum longitude
                pitch: 0,
                zoom: 10, 
                isSplit: false
              },
              visState: {
                layers: [
                  {
                    id: layerId,
                    type: 'point',
                    config: {
                      dataId: datasetId,
                      label: 'Crime Points',
                      color: [255, 165, 0], 
                      columns: {
                        lat: 'latitude',
                        lng: 'longitude'
                      },
                      isVisible: true,
                      visConfig: {
                        radius: 3, 
                        opacity: 0.5, 
                        outline: false,
                        thickness: 2,
                        radiusRange: [1, 20],
                        
                      }
                    }
                  }
                ]
              }
            }
          })
        );
      }, 100); // Small delay to ensure reset completes
      
      console.log('Updating map with filtered data:', {
        hasDateFilter,
        startDate,
        endDate,
        dataLength: parsedData.rows.length,
        datasetId,
        layerId
      });
    })
    .catch(error => {
      console.error('Error in CSV data flow:', error);
      store.dispatch(processingError(error.message));
    });
  }

  // Handle hotspot data loading - SIMPLIFIED
  if (action.type === 'LOAD_HOTSPOT_DATA') {
    console.log('Loading hotspot analysis data...');
    
    // Fetch the hotspot analysis results using full URL
    fetch(`http://localhost:5000/hotspot_analysis_results.csv?_=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    })
    .then(response => {
      console.log('Hotspot CSV fetch response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch hotspot data: ${response.status}`);
      }
      return response.text();
    })
    .then(csvText => {
      console.log('Raw hotspot CSV received, length:', csvText.length);
      console.log('First 200 chars:', csvText.substring(0, 200));
      
      // Simply parse the CSV as-is
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

      // Create unique dataset ID for hotspots
      const hotspotDatasetId = `hotspot-data-${Date.now()}`;
      const hotspotLayerId = `hotspot-layer-${Date.now()}`;

      // Add hotspot data as heatmap layer
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
    
    // Fetch the KDE analysis results using full URL
    fetch(`http://localhost:5000/kde_analysis_results.csv?_=${Date.now()}`, {
      cache: 'no-store',
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
      console.log('First 200 chars:', csvText.substring(0, 200));
      
      // Simply parse the CSV as-is
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

      // Create unique dataset ID for KDE
      const kdeDatasetId = `kde-data-${Date.now()}`;
      const kdeLayerId = `kde-layer-${Date.now()}`;

      // Add KDE data as heatmap layer
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
                    color: [46, 134, 171], // Blue color for KDE
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
                      radius: 60,  // Reduced radius for better distinction
                      intensity: 2,  // Increased intensity
                      threshold: 0.01  // Lower threshold to show more variation
                    },
                    weightField: {
                      name: 'kde_weight',  // Changed from kde_normalized to kde_weight
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

export default apiMiddleware;