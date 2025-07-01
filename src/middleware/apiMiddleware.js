import { ACTION_TYPES } from './utils/constants';
import { 
  handleFetchInitialData, 
  handleFetchFilteredByDate, 
  handleFetchFilteredData 
} from './handlers/csvHandlers';
import { 
  handleLoadHotspotData, 
  handleLoadEmergingHotspotsData
} from './handlers/analysisHandlers';
import { 
  handlePreloadGeojsonLayer, 
  handlePreloadDistrictLayer, 
  handleToggleGeojsonVisibility, 
  handleToggleDistrictVisibility, 
  handleToggleCrimePointsVisibility,
  handleToggleHotspotVisibility,
  handleToggleEmergingHotspotsVisibility,
  handleToggleLayerVisibility
} from './handlers/layerHandlers';

const apiMiddleware = store => next => action => {
  switch (action.type) {
    case ACTION_TYPES.FETCH_CSV_DATA_INITIAL:
      handleFetchInitialData(store);
      break;

    case ACTION_TYPES.FETCH_CSV_DATA_FILTERED:
      handleFetchFilteredByDate(store, action.payload);
      break;

    case ACTION_TYPES.FETCH_FILTERED_CSV_DATA:
      handleFetchFilteredData(store, action.payload);
      break;

    case ACTION_TYPES.LOAD_HOTSPOT_DATA:
      handleLoadHotspotData(store);
      break;

    case ACTION_TYPES.LOAD_EMERGING_HOTSPOTS_DATA:
      handleLoadEmergingHotspotsData(store);
      break;

    case ACTION_TYPES.PRELOAD_GEOJSON_LAYER:
      handlePreloadGeojsonLayer(store);
      break;

    case ACTION_TYPES.PRELOAD_DISTRICT_LAYER:
      handlePreloadDistrictLayer(store);
      break;

    case ACTION_TYPES.TOGGLE_GEOJSON_VISIBILITY:
      handleToggleGeojsonVisibility(store, action.payload);
      break;

    case ACTION_TYPES.TOGGLE_DISTRICT_VISIBILITY:
      handleToggleDistrictVisibility(store, action.payload);
      break;

    case ACTION_TYPES.TOGGLE_CRIME_POINTS_VISIBILITY:
      handleToggleCrimePointsVisibility(store, action.payload);
      break;

    case ACTION_TYPES.TOGGLE_HOTSPOT_VISIBILITY:
      handleToggleHotspotVisibility(store, action.payload);
      break;

    case ACTION_TYPES.TOGGLE_EMERGING_HOTSPOTS_VISIBILITY:
      handleToggleEmergingHotspotsVisibility(store, action.payload);
      break;

    case ACTION_TYPES.TOGGLE_LAYER_VISIBILITY:
      handleToggleLayerVisibility(store, action.payload);
      break;

    default:
      break;
  }

  return next(action);
};

export default apiMiddleware;