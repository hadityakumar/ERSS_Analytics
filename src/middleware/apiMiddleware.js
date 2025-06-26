import { processCsvData, processGeojson } from '@kepler.gl/processors';
import { addDataToMap, resetMapConfig, layerConfigChange, updateMap } from '@kepler.gl/actions';
import keplerConfig from '../config/keplerConfig.json';
import { processingStarted, processingComplete, processingError } from '../store';

let geojsonLayerId = null;
let geojsonLayerConfig = null;
let crimePointsLayerId = null;
let districtLayerId = null;
let districtLayerConfig = null;

// Keep track of layer visibility states
let cityBoundariesVisible = false;
let districtVisible = false;

// Center map coordinates
const DEFAULT_COORDINATES = {
  latitude: 8.565,
  longitude: 76.958,
  zoom: 9
};

// Function to center the map
const centerMapToTrivandrum = (store) => {
  setTimeout(() => {
    store.dispatch(updateMap({
      latitude: DEFAULT_COORDINATES.latitude,
      longitude: DEFAULT_COORDINATES.longitude,
      zoom: DEFAULT_COORDINATES.zoom,
      bearing: 0,
      pitch: 0
    }, 'map'));
  }, 500);
};

const apiMiddleware = store => next => action => {
  if (action.type === 'FETCH_CSV_DATA_INITIAL') {
    store.dispatch({ type: '@@kepler.gl/REGISTER', payload: { id: 'map' } });
    store.dispatch(processingStarted());

    fetch('http://localhost:5000/api/process-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFiltered: false })
    })
      .then(response => response.json())
      .then(result => {
        if (!result.success) throw new Error(result.error || 'Processing failed');
        return fetch('http://localhost:5000/ps_removed_dt.csv');
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch CSV');
        return response.text();
      })
      .then(csvText => {
        const parsedData = processCsvData(csvText);
        loadDataToKepler(store, parsedData, 'Crime Data (Full Dataset)');
        
        // Auto-center map after initial load
        setTimeout(() => {
          centerMapToTrivandrum(store);
          store.dispatch({ type: 'PRELOAD_GEOJSON_LAYER' });
          store.dispatch({ type: 'PRELOAD_DISTRICT_LAYER' });
        }, 1500);
      })
      .catch(err => store.dispatch(processingError(err.message)));
  }

  if (action.type === 'FETCH_CSV_DATA_FILTERED') {
    store.dispatch({ type: '@@kepler.gl/REGISTER', payload: { id: 'map' } });
    store.dispatch(processingStarted());

    const { startDate, endDate } = action.payload;

    fetch('http://localhost:5000/api/process-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, isFiltered: false })
    })
      .then(response => response.json())
      .then(result => {
        if (!result.success) throw new Error(result.error || 'Processing failed');
        return fetch('http://localhost:5000/ps_removed_dt.csv');
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch filtered CSV');
        return response.text();
      })
      .then(csvText => {
        const parsedData = processCsvData(csvText);
        loadDataToKepler(store, parsedData, `Crime Data (${startDate} to ${endDate})`);
        
        // Auto-center map after date filtering
        setTimeout(() => {
          centerMapToTrivandrum(store);
          store.dispatch({ type: 'PRELOAD_GEOJSON_LAYER' });
          store.dispatch({ type: 'PRELOAD_DISTRICT_LAYER' });
        }, 1500);
      })
      .catch(err => store.dispatch(processingError(err.message)));
  }

  if (action.type === 'FETCH_FILTERED_CSV_DATA') {
    store.dispatch({ type: '@@kepler.gl/REGISTER', payload: { id: 'map' } });
    store.dispatch(processingStarted());

    const { severities, partOfDay, cityLocation, isFiltered } = action.payload;

    const hasFilters = (severities && severities.length > 0) || 
                      (partOfDay && partOfDay.length > 0) || 
                      (cityLocation && cityLocation !== 'all');

    fetch('http://localhost:5000/api/process-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        severities,
        partOfDay,
        cityLocation,
        isFiltered: isFiltered && hasFilters
      })
    })
      .then(response => response.json())
      .then(result => {
        if (!result.success) throw new Error(result.error || 'Processing failed');
        
        const csvFile = (isFiltered && hasFilters) ? 'filtered_data.csv' : 'ps_removed_dt.csv';
        
        return fetch(`http://localhost:5000/${csvFile}?_=${Date.now()}`, {
          cache: 'no-store'
        });
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch filtered data.');
        }
        return response.text();
      })
      .then(csvText => {
        const parsedData = processCsvData(csvText);
        if (parsedData.rows.length === 0) {
          throw new Error('No data points match the applied filters.');
        }
        
        const filterLabels = [];
        
        if (severities && severities.length > 0) {
          filterLabels.push(`Severity: ${severities.join(', ')}`);
        }
        if (partOfDay && partOfDay.length > 0) {
          filterLabels.push(`Time: ${partOfDay.join(', ')}`);
        }
        if (cityLocation && cityLocation !== 'all') {
          filterLabels.push(`Location: ${cityLocation === 'inside' ? 'Inside City' : 'Outside City'}`);
        }
        
        const label = filterLabels.length > 0 
          ? `Crime Data (Filtered: ${filterLabels.join(', ')})` 
          : 'Crime Data (All Data)';
          
        loadDataToKepler(store, parsedData, label);
        
        // Auto-center map after applying filters
        setTimeout(() => {
          centerMapToTrivandrum(store);
          store.dispatch({ type: 'PRELOAD_GEOJSON_LAYER' });
          store.dispatch({ type: 'PRELOAD_DISTRICT_LAYER' });
        }, 1500);
      })
      .catch(err => {
        store.dispatch(processingError(err.message));
      });
  }

  if (action.type === 'LOAD_HOTSPOT_DATA') {
    fetch(`http://localhost:5000/hotspot_analysis_results.csv?_=${Date.now()}`, {
      cache: 'no-store'
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch hotspot data');
        return response.text();
      })
      .then(csvText => {
        const parsedData = processCsvData(csvText);
        if (parsedData.rows.length === 0) {
          alert('No hotspot data found. Please run the analysis first.');
          return;
        }

        const datasetId = `hotspot-data-${Date.now()}`;
        store.dispatch(
          addDataToMap({
            datasets: [{
              info: { id: datasetId, label: 'Hotspot Analysis' },
              data: parsedData
            }],
            options: { centerMap: false, keepExistingConfig: true, readOnly: true },
            config: {
              visState: {
                layers: [{
                  id: `hotspot-layer-${Date.now()}`,
                  type: 'heatmap',
                  config: {
                    dataId: datasetId,
                    label: 'Hotspot Heatmap',
                    color: [255, 107, 53],
                    columns: { lat: 'latitude', lng: 'longitude' },
                    isVisible: true,
                    visConfig: {
                      opacity: 0.8,
                      colorRange: {
                        colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                      },
                      radius: 60,
                      intensity: 1,
                      threshold: 0.05
                    },
                    weightField: { name: 'gi_star', type: 'real' }
                  }
                }]
              }
            }
          })
        );

        // Auto-center map after hotspot analysis
        setTimeout(() => {
          centerMapToTrivandrum(store);
        }, 500);
      })
      .catch(error => alert(`Failed to load hotspot data: ${error.message}`));
  }

  if (action.type === 'LOAD_KDE_DATA') {
    fetch(`http://localhost:5000/kde_analysis_results.csv?_=${Date.now()}`, {
      cache: 'no-cache'
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch KDE data');
        return response.text();
      })
      .then(csvText => {
        const parsedData = processCsvData(csvText);
        if (parsedData.rows.length === 0) {
          alert('No KDE data found. Please run the analysis first.');
          return;
        }

        const datasetId = `kde-data-${Date.now()}`;
        store.dispatch(
          addDataToMap({
            datasets: [{
              info: { id: datasetId, label: 'KDE Analysis' },
              data: parsedData
            }],
            options: { centerMap: false, keepExistingConfig: true },
            config: {
              visState: {
                layers: [{
                  id: `kde-layer-${Date.now()}`,
                  type: 'heatmap',
                  config: {
                    dataId: datasetId,
                    label: 'KDE Heatmap',
                    color: [46, 134, 171],
                    columns: { lat: 'latitude', lng: 'longitude' },
                    isVisible: true,
                    visConfig: {
                      opacity: 0.8,
                      colorRange: {
                        colors: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b']
                      },
                      radius: 60,
                      intensity: 2,
                      threshold: 0.01
                    },
                    weightField: { name: 'kde_weight', type: 'real' }
                  }
                }]
              }
            }
          })
        );

        // Auto-center map after KDE analysis
        setTimeout(() => {
          centerMapToTrivandrum(store);
        }, 500);
      })
      .catch(error => alert(`Failed to load KDE data: ${error.message}`));
  }

  if (action.type === 'PRELOAD_GEOJSON_LAYER') {
    geojsonLayerId = null;
    geojsonLayerConfig = null;
    
    fetch(`/trv_city.geojson?_=${Date.now()}`, {
      cache: 'no-store'
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch GeoJSON data');
        return response.json();
      })
      .then(geojsonData => {
        const datasetId = `geojson-data-${Date.now()}`;
        const layerId = `geojson-layer-${Date.now()}`;
        geojsonLayerId = datasetId;
        geojsonLayerConfig = layerId;
        
        const processedData = processGeojson(geojsonData);
        
        store.dispatch(
          addDataToMap({
            datasets: [{
              info: { 
                id: datasetId, 
                label: 'City Boundaries'
              },
              data: processedData
            }],
            options: { centerMap: false, keepExistingConfig: true },
            config: {
              visState: {
                layers: [{
                  id: layerId,
                  type: 'geojson',
                  config: {
                    dataId: datasetId,
                    label: 'City Boundaries',
                    color: [255, 255, 255],
                    columns: { 
                      geojson: '_geojson' 
                    },
                    isVisible: cityBoundariesVisible,
                    visConfig: {
                      opacity: 1,
                      strokeWidth: 30,
                      strokeColor: [0, 0, 0],
                      filled: false,
                      enable3d: false,
                      stroked: true,
                      wireframe: false
                    }
                  }
                }]
              }
            }
          })
        );
      })
      .catch(error => {
        alert(`Failed to load city boundaries: ${error.message}`);
      });
  }

  if (action.type === 'PRELOAD_DISTRICT_LAYER') {
    districtLayerId = null;
    districtLayerConfig = null;
    
    fetch(`/trv_district.geojson?_=${Date.now()}`, {
      cache: 'no-store'
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch District data');
        return response.json();
      })
      .then(districtData => {
        const datasetId = `district-data-${Date.now()}`;
        const layerId = `district-layer-${Date.now()}`;
        districtLayerId = datasetId;
        districtLayerConfig = layerId;
        
        const processedData = processGeojson(districtData);
        
        store.dispatch(
          addDataToMap({
            datasets: [{
              info: { 
                id: datasetId, 
                label: 'Districts'
              },
              data: processedData
            }],
            options: { centerMap: false, keepExistingConfig: true },
            config: {
              visState: {
                layers: [{
                  id: layerId,
                  type: 'geojson',
                  config: {
                    dataId: datasetId,
                    label: 'Districts',
                    color: [255, 165, 0],
                    columns: { 
                      geojson: '_geojson' 
                    },
                    isVisible: districtVisible,
                    visConfig: {
                      opacity: 1,
                      strokeWidth: 50,
                      strokeColor: [0, 0, 0],
                      filled: false,
                      enable3d: false,
                      stroked: true,
                      wireframe: false
                    }
                  }
                }]
              }
            }
          })
        );
      })
      .catch(error => {
        alert(`Failed to load districts: ${error.message}`);
      });
  }

  if (action.type === 'TOGGLE_GEOJSON_VISIBILITY') {
    const { isVisible } = action.payload;
    cityBoundariesVisible = isVisible;
    
    const state = store.getState();
    const keplerState = state.keplerGl?.map;
    
    if (keplerState && keplerState.visState && keplerState.visState.layers) {
      const currentLayer = keplerState.visState.layers.find(layer => 
        layer.id === geojsonLayerConfig || 
        layer.config.label === 'City Boundaries' ||
        (layer.type === 'geojson' && layer.config.dataId.includes('geojson-data'))
      );
      
      if (currentLayer) {
        store.dispatch(layerConfigChange(currentLayer, { isVisible }, 'map'));
      } else {
        const anyGeoJsonLayer = keplerState.visState.layers.find(layer => 
          layer.type === 'geojson'
        );
        if (anyGeoJsonLayer) {
          store.dispatch(layerConfigChange(anyGeoJsonLayer, { isVisible }, 'map'));
        }
      }
    }
  }

  if (action.type === 'TOGGLE_DISTRICT_VISIBILITY') {
    const { isVisible } = action.payload;
    districtVisible = isVisible;
    
    const state = store.getState();
    const keplerState = state.keplerGl?.map;
    
    if (keplerState && keplerState.visState && keplerState.visState.layers) {
      const currentLayer = keplerState.visState.layers.find(layer => 
        layer.id === districtLayerConfig || 
        layer.config.label === 'Districts' ||
        (layer.type === 'geojson' && layer.config.dataId.includes('district-data'))
      );
      
      if (currentLayer) {
        store.dispatch(layerConfigChange(currentLayer, { isVisible }, 'map'));
      } else {
        const geoJsonLayers = keplerState.visState.layers.filter(layer => 
          layer.type === 'geojson'
        );
        if (geoJsonLayers.length >= 2) {
          store.dispatch(layerConfigChange(geoJsonLayers[1], { isVisible }, 'map'));
        }
      }
    }
  }

  if (action.type === 'TOGGLE_CRIME_POINTS_VISIBILITY') {
    const { isVisible } = action.payload;
    
    const state = store.getState();
    const keplerState = state.keplerGl?.map;
    
    if (keplerState && keplerState.visState && keplerState.visState.layers) {
      const crimePointsLayer = keplerState.visState.layers.find(layer => 
        layer.type === 'point' || 
        layer.config.label.includes('Crime') ||
        layer.config.dataId.includes('csv-data') ||
        layer.id.includes('points-layer')
      );
      
      if (crimePointsLayer) {
        crimePointsLayerId = crimePointsLayer.id;
        store.dispatch(layerConfigChange(crimePointsLayer, { isVisible }, 'map'));
      }
    }
  }

  return next(action);
};

function loadDataToKepler(store, parsedData, label) {
  if (parsedData.rows.length === 0) {
    store.dispatch(processingError('No data points found in the CSV file.'));
    return;
  }

  const datasetId = `csv-data-${Date.now()}`;
  const config = JSON.parse(JSON.stringify(keplerConfig));
  
  // Set the map to focus on Trivandrum
  config.config.mapState = {
    bearing: 0,
    dragRotate: false,
    latitude: DEFAULT_COORDINATES.latitude,
    longitude: DEFAULT_COORDINATES.longitude,
    pitch: 0,
    zoom: DEFAULT_COORDINATES.zoom,
    isSplit: false,
    isViewportSynced: true,
    isZoomLocked: false,
    splitMapViewports: []
  };
  
  config.config.visState.filters.forEach(filter => {
    if (filter.dataId && Array.isArray(filter.dataId)) {
      filter.dataId = [datasetId];
    }
  });
  
  config.config.visState.layers.forEach(layer => {
    if (layer.config && layer.config.dataId) {
      layer.config.dataId = datasetId;
    }
    const layerId = `points-layer-${Date.now()}`;
    layer.id = layerId;
    
    if (layer.type === 'point') {
      crimePointsLayerId = layerId;
    }
  });
  
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
          centerMap: false,
          keepExistingConfig: false 
        },
        config: config.config
      })
    );
  }, 100);
}

export default apiMiddleware;