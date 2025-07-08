import { updateMap } from '@kepler.gl/actions';

// Updated centerMapToCoordinates to accept custom coordinates and zoom
export const centerMapToCoordinates = (store, latitude = 8.5782259865, longitude = 76.95390701, zoom = 9) => {
  try {
    console.log(`Centering map to coordinates: lat=${latitude}, lng=${longitude}, zoom=${zoom}`);
    
    setTimeout(() => {
      store.dispatch(updateMap({
        latitude: latitude,
        longitude: longitude,
        zoom: zoom,
        bearing: 0,
        pitch: 0,
        dragRotate: false,
        isSplit: false,
        isViewportSynced: true,
        isZoomLocked: false,
        splitMapViewports: []
      }, 'map'));
    }, 500);
    
    console.log('Map centered successfully');
  } catch (error) {
    console.error('Failed to center map:', error);
  }
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

// Helper function to get map bounds from data
export const getDataBounds = (parsedData) => {
  if (!parsedData || !parsedData.rows || parsedData.rows.length === 0) {
    return null;
  }

  // Find latitude and longitude field indices
  const latIndex = parsedData.fields.findIndex(field => 
    field.name.toLowerCase().includes('lat') || field.name.toLowerCase() === 'latitude'
  );
  const lngIndex = parsedData.fields.findIndex(field => 
    field.name.toLowerCase().includes('lng') || 
    field.name.toLowerCase().includes('lon') || 
    field.name.toLowerCase() === 'longitude'
  );

  if (latIndex === -1 || lngIndex === -1) {
    console.warn('Could not find latitude/longitude fields in data');
    return null;
  }

  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  parsedData.rows.forEach(row => {
    const lat = parseFloat(row[latIndex]);
    const lng = parseFloat(row[lngIndex]);

    if (!isNaN(lat) && !isNaN(lng)) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
  });

  if (minLat === Infinity) {
    return null;
  }

  // Calculate center and appropriate zoom level
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  
  // Calculate zoom based on bounds (simplified approach)
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);
  
  let zoom = 10; // default
  if (maxDiff < 0.01) zoom = 14;
  else if (maxDiff < 0.05) zoom = 12;
  else if (maxDiff < 0.1) zoom = 11;
  else if (maxDiff < 0.5) zoom = 9;
  else zoom = 8;

  return {
    latitude: centerLat,
    longitude: centerLng,
    zoom: zoom
  };
};

// Function to center map based on data bounds
export const centerMapToData = (store, parsedData) => {
  const bounds = getDataBounds(parsedData);
  if (bounds) {
    centerMapToCoordinates(store, bounds.latitude, bounds.longitude, bounds.zoom);
  } else {
    // Fallback to default coordinates
    centerMapToCoordinates(store);
  }
};

export const generateDatasetId = (type) => `${type}-data-${Date.now()}`;
export const generateLayerId = (type) => `${type}-layer-${Date.now()}`;