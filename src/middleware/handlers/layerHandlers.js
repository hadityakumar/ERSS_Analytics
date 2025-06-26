import { processGeojson } from '@kepler.gl/processors';
import { addDataToMap, layerConfigChange } from '@kepler.gl/actions';
import { fetchGeojsonData } from '../services/apiService';
import { API_ENDPOINTS } from '../utils/constants';
import { generateDatasetId, generateLayerId } from '../utils/mapUtils';
import { 
  getLayerState, 
  setGeojsonLayer, 
  setDistrictLayer, 
  setCityBoundariesVisible, 
  setDistrictVisible 
} from '../utils/layerState';

export const handlePreloadGeojsonLayer = async (store) => {
  setGeojsonLayer(null, null);
  
  try {
    const geojsonData = await fetchGeojsonData(API_ENDPOINTS.CITY_GEOJSON);
    const datasetId = generateDatasetId('geojson');
    const layerId = generateLayerId('geojson');
    
    setGeojsonLayer(datasetId, layerId);
    
    const processedData = processGeojson(geojsonData);
    const { cityBoundariesVisible } = getLayerState();
    
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
  } catch (error) {
    alert(`Failed to load city boundaries: ${error.message}`);
  }
};

export const handlePreloadDistrictLayer = async (store) => {
  setDistrictLayer(null, null);
  
  try {
    const districtData = await fetchGeojsonData(API_ENDPOINTS.DISTRICT_GEOJSON);
    const datasetId = generateDatasetId('district');
    const layerId = generateLayerId('district');
    
    setDistrictLayer(datasetId, layerId);
    
    const processedData = processGeojson(districtData);
    const { districtVisible } = getLayerState();
    
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
  } catch (error) {
    alert(`Failed to load districts: ${error.message}`);
  }
};

export const handleToggleGeojsonVisibility = (store, { isVisible }) => {
  setCityBoundariesVisible(isVisible);
  
  const state = store.getState();
  const keplerState = state.keplerGl?.map;
  const { geojsonLayerConfig } = getLayerState();
  
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
};

export const handleToggleDistrictVisibility = (store, { isVisible }) => {
  setDistrictVisible(isVisible);
  
  const state = store.getState();
  const keplerState = state.keplerGl?.map;
  const { districtLayerConfig } = getLayerState();
  
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
};

export const handleToggleCrimePointsVisibility = (store, { isVisible }) => {
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
      store.dispatch(layerConfigChange(crimePointsLayer, { isVisible }, 'map'));
    }
  }
};