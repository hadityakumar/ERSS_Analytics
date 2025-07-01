import { API_ENDPOINTS } from '../utils/constants';

export const processCsvData = async (payload) => {
  const response = await fetch(API_ENDPOINTS.PROCESS_CSV, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error('Failed to process CSV');
  }
  
  return response.json();
};

export const fetchCsvData = async (filename = 'ps_removed_dt.csv') => {
  const response = await fetch(`http://localhost:5000/${filename}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch CSV data');
  }
  
  return response.text();
};

export const fetchFilteredData = async () => {
  const response = await fetch(`${API_ENDPOINTS.FILTERED_DATA}?_=${Date.now()}`, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch filtered data');
  }
  
  return response.text();
};

export const fetchHotspotData = async () => {
  const response = await fetch(`${API_ENDPOINTS.HOTSPOT_DATA}?_=${Date.now()}`, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch hotspot data');
  }
  
  return response.text();
};

export const fetchEmergingHotspotsData = async () => {
  const response = await fetch(`${API_ENDPOINTS.EMERGING_HOTSPOTS_DATA}?_=${Date.now()}`, {
    cache: 'no-cache'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch emerging hotspots data');
  }
  
  return response.json();
};

export const fetchGeojsonData = async (url) => {
  const response = await fetch(`${url}?_=${Date.now()}`, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch GeoJSON data');
  }
  
  return response.json();
};