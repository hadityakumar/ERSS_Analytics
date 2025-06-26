import { processCsvData } from '@kepler.gl/processors';
import { processingStarted, processingError } from '../../store';
import { processCsvData as processData, fetchCsvData, fetchFilteredData } from '../services/apiService';
import { loadDataToKepler } from '../services/dataProcessor';
import { centerMapToTrivandrum, formatDateTimeRange } from '../utils/mapUtils';

export const handleFetchInitialData = async (store) => {
  store.dispatch({ type: '@@kepler.gl/REGISTER', payload: { id: 'map' } });
  store.dispatch(processingStarted());

  try {
    const processingResult = await processData({ isFiltered: false });
    if (!processingResult.success) {
      throw new Error(processingResult.error || 'Processing failed');
    }

    const csvText = await fetchCsvData();
    const parsedData = processCsvData(csvText);
    loadDataToKepler(store, parsedData, 'Crime Data (Full Dataset)');
    
    // Auto-center map after initial load
    setTimeout(() => {
      centerMapToTrivandrum(store);
      store.dispatch({ type: 'PRELOAD_GEOJSON_LAYER' });
      store.dispatch({ type: 'PRELOAD_DISTRICT_LAYER' });
    }, 1500);
  } catch (error) {
    store.dispatch(processingError(error.message));
  }
};

export const handleFetchFilteredByDate = async (store, { startDate, endDate }) => {
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
    loadDataToKepler(store, parsedData, `Crime Data (${dateTimeRange})`);
    
    // Auto-center map after date filtering
    setTimeout(() => {
      centerMapToTrivandrum(store);
      store.dispatch({ type: 'PRELOAD_GEOJSON_LAYER' });
      store.dispatch({ type: 'PRELOAD_DISTRICT_LAYER' });
    }, 1500);
  } catch (error) {
    store.dispatch(processingError(error.message));
  }
};

export const handleFetchFilteredData = async (store, { severities, partOfDay, cityLocation, isFiltered }) => {
  store.dispatch({ type: '@@kepler.gl/REGISTER', payload: { id: 'map' } });
  store.dispatch(processingStarted());

  try {
    const hasFilters = (severities && severities.length > 0) || 
                      (partOfDay && partOfDay.length > 0) || 
                      (cityLocation && cityLocation !== 'all');

    const processingResult = await processData({
      severities,
      partOfDay,
      cityLocation,
      isFiltered: isFiltered && hasFilters
    });

    if (!processingResult.success) {
      throw new Error(processingResult.error || 'Processing failed');
    }
    
    const csvFile = (isFiltered && hasFilters) ? 'filtered_data.csv' : 'ps_removed_dt.csv';
    const csvText = await fetchCsvData(csvFile);
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
  } catch (error) {
    store.dispatch(processingError(error.message));
  }
};