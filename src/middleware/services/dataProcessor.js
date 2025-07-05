import { processCsvData } from '@kepler.gl/processors';
import { addDataToMap, resetMapConfig } from '@kepler.gl/actions';
import { processingComplete, processingError } from '../../store';
import keplerConfig from '../../config/keplerConfig.json';
import { DEFAULT_COORDINATES } from '../utils/constants';
import { setCrimePointsLayer } from '../utils/layerState';

export const loadDataToKepler = (store, parsedData, label) => {
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
      setCrimePointsLayer(layerId);
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
          keepExistingConfig: true,
          readOnly: false,   //keep this false if u want the panel ****
        },
        config: config.config
      })
    );
  }, 100);
};

export const processAndLoadCsvData = async (store, csvText, label) => {
  const parsedData = processCsvData(csvText);
  loadDataToKepler(store, parsedData, label);
};