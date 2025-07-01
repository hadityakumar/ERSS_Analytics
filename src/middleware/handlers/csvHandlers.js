import { processCsvData } from '@kepler.gl/processors';
import { processingStarted, processingError } from '../../store';
import { processCsvData as processData, fetchCsvData, fetchFilteredData } from '../services/apiService';
import { loadDataToKepler } from '../services/dataProcessor';
import { centerMapToTrivandrum, formatDateTimeRange } from '../utils/mapUtils';

// Prevent duplicate CSV loading
let isLoadingInitialData = false;
let isLoadingFilteredData = false;
let isLoadingDateFilteredData = false;

export const handleFetchInitialData = async (store) => {
  // Prevent duplicate loading
  if (isLoadingInitialData) {
    console.log('Initial data loading already in progress, skipping...');
    return;
  }

  isLoadingInitialData = true;

  // Check if initial data is already loaded
  const state = store.getState();
  const keplerState = state.keplerGl?.map;
  const existingDatasets = keplerState?.visState?.datasets || {};
  const existingLayers = keplerState?.visState?.layers || [];
  
  // Check if we already have crime data loaded (more comprehensive check)
  const hasCrimeData = Object.values(existingDatasets).some(dataset => 
    dataset.label?.includes('Crime Data') || 
    dataset.id?.includes('csv-data') ||
    dataset.label?.includes('ps_removed_dt')
  );

  const hasCrimeLayers = existingLayers.some(layer =>
    layer.type === 'point' && 
    !layer.config?.label?.includes('Hotspot') &&
    !layer.config?.label?.includes('Emerging')
  );

  if (hasCrimeData || hasCrimeLayers) {
    console.log('Crime data already loaded (datasets:', hasCrimeData, ', layers:', hasCrimeLayers, '), skipping initial data fetch');
    isLoadingInitialData = false;
    return;
  }

  console.log('No existing crime data found, proceeding with initial load');

  store.dispatch({ type: '@@kepler.gl/REGISTER', payload: { id: 'map' } });
  store.dispatch(processingStarted());

  try {
    const processingResult = await processData({ isFiltered: false });
    if (!processingResult.success) {
      throw new Error(processingResult.error || 'Processing failed');
    }

    const csvText = await fetchCsvData();
    const parsedData = processCsvData(csvText);
    console.log('Loading initial crime data to Kepler.gl with', parsedData.rows.length, 'rows');
    loadDataToKepler(store, parsedData, 'Crime Data (Full Dataset)');
    
    // Auto-center map after initial load
    setTimeout(() => {
      centerMapToTrivandrum(store);
      store.dispatch({ type: 'PRELOAD_GEOJSON_LAYER' });
      store.dispatch({ type: 'PRELOAD_DISTRICT_LAYER' });
    }, 1500);
  } catch (error) {
    console.error('Error in handleFetchInitialData:', error);
    store.dispatch(processingError(error.message));
  } finally {
    isLoadingInitialData = false;
  }
};

export const handleFetchFilteredByDate = async (store, { startDate, endDate }) => {
  // Prevent duplicate loading
  if (isLoadingDateFilteredData) {
    console.log('Date filtered data loading already in progress, skipping...');
    return;
  }

  isLoadingDateFilteredData = true;

  store.dispatch({ type: '@@kepler.gl/REGISTER', payload: { id: 'map' } });
  store.dispatch(processingStarted());

  try {
    const processingResult = await processData({ startDate, endDate, isFiltered: false });
    if (!processingResult.success) {
      throw new Error(processingResult.error || 'Processing failed');
    }

    const csvText = await fetchCsvData();
    const parsedData = processCsvData(csvText);
    const dateTimeRange = formatDateTimeRange(startDate, endDate);
    console.log('Loading date-filtered crime data to Kepler.gl with', parsedData.rows.length, 'rows');
    loadDataToKepler(store, parsedData, `Crime Data (${dateTimeRange})`);
    
    // Auto-center map after date filtering
    setTimeout(() => {
      centerMapToTrivandrum(store);
      store.dispatch({ type: 'PRELOAD_GEOJSON_LAYER' });
      store.dispatch({ type: 'PRELOAD_DISTRICT_LAYER' });
    }, 1500);
  } catch (error) {
    console.error('Error in handleFetchFilteredByDate:', error);
    store.dispatch(processingError(error.message));
  } finally {
    isLoadingDateFilteredData = false;
  }
};

export const handleFetchFilteredData = async (store, { 
  severities, 
  partOfDay, 
  cityLocation, 
  isFiltered, 
  startDate, 
  endDate, 
  combinedFiltering,
  mainTypes,
  subtypes
}) => {
  // Prevent duplicate loading
  if (isLoadingFilteredData) {
    console.log('Filtered data loading already in progress, skipping...');
    return;
  }

  isLoadingFilteredData = true;

  store.dispatch({ type: '@@kepler.gl/REGISTER', payload: { id: 'map' } });
  store.dispatch(processingStarted());

  try {
    const hasDateRange = startDate && endDate;
    const hasOtherFilters = (severities && severities.length > 0) || 
                           (partOfDay && partOfDay.length > 0) || 
                           (cityLocation && cityLocation !== 'all') ||
                           (mainTypes && mainTypes.length > 0) ||
                           (subtypes && subtypes.length > 0);

    // Prepare the payload for the backend
    const backendPayload = {
      isFiltered: isFiltered || hasOtherFilters
    };

    // Add date range if provided
    if (hasDateRange) {
      backendPayload.startDate = startDate;
      backendPayload.endDate = endDate;
    }

    // Add other filters if provided
    if (hasOtherFilters) {
      if (severities && severities.length > 0) {
        backendPayload.severities = severities;
      }
      if (partOfDay && partOfDay.length > 0) {
        backendPayload.partOfDay = partOfDay;
      }
      if (cityLocation && cityLocation !== 'all') {
        backendPayload.cityLocation = cityLocation;
      }
      if (mainTypes && mainTypes.length > 0) {
        backendPayload.mainTypes = mainTypes;
      }
      if (subtypes && subtypes.length > 0) {
        backendPayload.subtypes = subtypes;
      }
    }

    // Add combined filtering flag
    if (combinedFiltering) {
      backendPayload.combinedFiltering = true;
    }

    console.log('Backend payload:', backendPayload);

    const processingResult = await processData(backendPayload);

    if (!processingResult.success) {
      throw new Error(processingResult.error || 'Processing failed');
    }
    
    // Determine which CSV file to fetch
    const csvFile = (backendPayload.isFiltered && hasOtherFilters) ? 'filtered_data.csv' : 'ps_removed_dt.csv';
    const csvText = await fetchCsvData(csvFile);
    const parsedData = processCsvData(csvText);
    
    if (parsedData.rows.length === 0) {
      throw new Error('No data points match the applied filters.');
    }
    
    // Build label for the dataset
    const filterLabels = [];
    
    if (hasDateRange) {
      const dateTimeRange = formatDateTimeRange(startDate, endDate);
      filterLabels.push(`Date: ${dateTimeRange}`);
    }
    
    if (mainTypes && mainTypes.length > 0) {
      filterLabels.push(`Main Types: ${mainTypes.join(', ')}`);
    }
    if (subtypes && subtypes.length > 0) {
      filterLabels.push(`Subtypes: ${subtypes.join(', ')}`);
    }
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
      
    console.log('Loading filtered crime data to Kepler.gl with', parsedData.rows.length, 'rows, label:', label);
    loadDataToKepler(store, parsedData, label);
    
    // Auto-center map after applying filters
    setTimeout(() => {
      centerMapToTrivandrum(store);
      store.dispatch({ type: 'PRELOAD_GEOJSON_LAYER' });
      store.dispatch({ type: 'PRELOAD_DISTRICT_LAYER' });
    }, 1500);
  } catch (error) {
    console.error('Error in handleFetchFilteredData:', error);
    store.dispatch(processingError(error.message));
  } finally {
    isLoadingFilteredData = false;
  }
};