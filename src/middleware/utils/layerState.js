// Layer state management
let geojsonLayerId = null;
let geojsonLayerConfig = null;
let crimePointsLayerId = null;
let districtLayerId = null;
let districtLayerConfig = null;

// Keep track of layer visibility states
let cityBoundariesVisible = false;
let districtVisible = false;

export const getLayerState = () => ({
  geojsonLayerId,
  geojsonLayerConfig,
  crimePointsLayerId,
  districtLayerId,
  districtLayerConfig,
  cityBoundariesVisible,
  districtVisible
});

export const setGeojsonLayer = (layerId, layerConfig) => {
  geojsonLayerId = layerId;
  geojsonLayerConfig = layerConfig;
};

export const setDistrictLayer = (layerId, layerConfig) => {
  districtLayerId = layerId;
  districtLayerConfig = layerConfig;
};

export const setCrimePointsLayer = (layerId) => {
  crimePointsLayerId = layerId;
};

export const setCityBoundariesVisible = (visible) => {
  cityBoundariesVisible = visible;
};

export const setDistrictVisible = (visible) => {
  districtVisible = visible;
};