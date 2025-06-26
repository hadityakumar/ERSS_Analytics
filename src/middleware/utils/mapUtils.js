import { updateMap } from '@kepler.gl/actions';
import { DEFAULT_COORDINATES } from './constants';

export const centerMapToTrivandrum = (store) => {
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

export const formatDateTimeRange = (startDate, endDate) => {
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  return `${formatDateTime(startDate)} to ${formatDateTime(endDate)}`;
};

export const generateDatasetId = (type) => `${type}-data-${Date.now()}`;
export const generateLayerId = (type) => `${type}-layer-${Date.now()}`;