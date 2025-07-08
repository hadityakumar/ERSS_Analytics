import { processCsvData } from '@kepler.gl/processors';
import { processingStarted, processingError } from '../../store';
import { processCsvData as processData, fetchCsvData, fetchFilteredData } from '../services/apiService';
import { loadDataToKepler } from '../services/dataProcessor';
import { centerMapToCoordinates, formatDateTimeRange } from '../utils/mapUtils';

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
      centerMapToCoordinates(store, 8.5782259865, 76.95390701, 9);
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
    console.log('=== DATE-ONLY FILTER DEBUG ===');
    console.log('Calling backend with payload:', { startDate, endDate, isFiltered: false });
    
    const processingResult = await processData({ startDate, endDate, isFiltered: false });
    if (!processingResult.success) {
      throw new Error(processingResult.error || 'Processing failed');
    }

    console.log('Backend processing completed, waiting before fetching...');
    // Add delay to ensure file is written
    await new Promise(resolve => setTimeout(resolve, 1000));

    const csvText = await fetchCsvData();
    console.log('Fetched CSV data, first 100 chars:', csvText.substring(0, 100));
    
    const parsedData = processCsvData(csvText);
    const dateTimeRange = formatDateTimeRange(startDate, endDate);
    console.log('Loading date-filtered crime data to Kepler.gl with', parsedData.rows.length, 'rows');
    loadDataToKepler(store, parsedData, `Crime Data (${dateTimeRange})`);
    
    // Auto-center map after date filtering
    setTimeout(() => {
      centerMapToCoordinates(store, 8.5782259865, 76.95390701, 9);
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
  subtypes,
  twoStepFiltering
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
    console.log('=== RECEIVED PAYLOAD ===');
    console.log('Raw startDate:', startDate, 'Type:', typeof startDate);
    console.log('Raw endDate:', endDate, 'Type:', typeof endDate);
    console.log('Raw severities:', severities, 'Type:', typeof severities, 'Length:', severities?.length);
    console.log('Raw partOfDay:', partOfDay, 'Type:', typeof partOfDay, 'Length:', partOfDay?.length);
    console.log('Raw cityLocation:', cityLocation, 'Type:', typeof cityLocation);
    console.log('Raw mainTypes:', mainTypes, 'Type:', typeof mainTypes, 'Length:', mainTypes?.length);
    console.log('Raw subtypes:', subtypes, 'Type:', typeof subtypes, 'Length:', subtypes?.length);
    
    const hasDateRange = startDate && endDate;
    const hasOtherFilters = (severities && severities.length > 0) || 
                           (partOfDay && partOfDay.length > 0) || 
                           (cityLocation && cityLocation !== 'all') ||
                           (mainTypes && mainTypes.length > 0) ||
                           (subtypes && subtypes.length > 0);

    console.log('Filter analysis:', {
      hasDateRange,
      hasOtherFilters,
      combinedFiltering,
      twoStepFiltering,
      startDate,
      endDate,
      severities,
      partOfDay,
      cityLocation,
      mainTypes,
      subtypes
    });

    console.log('=== DECISION LOGIC ===');
    console.log('hasDateRange && hasOtherFilters:', hasDateRange && hasOtherFilters);
    console.log('hasDateRange only:', hasDateRange && !hasOtherFilters);
    console.log('hasOtherFilters only:', !hasDateRange && hasOtherFilters);
    console.log('no filters:', !hasDateRange && !hasOtherFilters);

    let parsedData;
    
    if (hasDateRange && hasOtherFilters) {
      // TWO-STEP FILTERING PROCESS
      console.log('=== EXECUTING TWO-STEP FILTERING PROCESS ===');
      
      // Step 1: Apply date filtering to create ps_removed_dt.csv
      console.log('Step 1: Applying date filtering to create ps_removed_dt.csv...');
      const dateFilterPayload = {
        startDate,
        endDate,
        isFiltered: false // Only date filtering, no other filters
      };
      
      console.log('Date filter payload:', dateFilterPayload);
      const dateProcessingResult = await processData(dateFilterPayload);
      
      if (!dateProcessingResult.success) {
        throw new Error(dateProcessingResult.error || 'Date filtering failed in Step 1');
      }
      
      console.log('Step 1 completed: ps_removed_dt.csv created with date filtering');
      
      // Step 2: Apply other filters to the date-filtered ps_removed_dt.csv
      console.log('Step 2: Applying other filters to date-filtered data...');
      
      // Wait a moment to ensure the file is written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const otherFiltersPayload = {
        severities,
        partOfDay,
        cityLocation,
        mainTypes,
        subtypes,
        isFiltered: true, // Apply other filters to existing ps_removed_dt.csv
        useDateFilteredBase: true // Flag to use existing ps_removed_dt.csv
      };
      
      console.log('Other filters payload:', otherFiltersPayload);
      const otherFiltersResult = await processData(otherFiltersPayload);
      
      if (!otherFiltersResult.success) {
        throw new Error(otherFiltersResult.error || 'Other filters failed in Step 2');
      }
      
      console.log('Step 2 completed: filtered_data.csv created with all filters');
      
      // Fetch the final filtered data
      const csvText = await fetchCsvData('filtered_data.csv');
      parsedData = processCsvData(csvText);
      console.log('Two-step filtering completed successfully, loaded', parsedData.rows.length, 'rows');
      
    } else if (hasDateRange) {
      // DATE-ONLY FILTERING
      console.log('=== DATE-ONLY FILTERING BRANCH TRIGGERED ===');
      console.log('About to call backend API for date-only filtering...');
      
      const dateOnlyPayload = {
        startDate,
        endDate,
        isFiltered: false
      };
      
      console.log('Backend payload:', dateOnlyPayload);
      console.log('Making API call to backend...');
      
      const processingResult = await processData(dateOnlyPayload);
      console.log('Backend API response:', processingResult);
      
      if (!processingResult.success) {
        throw new Error(processingResult.error || 'Date filtering failed');
      }
      
      console.log('Backend processing completed, now fetching ps_removed_dt.csv...');
      const csvText = await fetchCsvData('ps_removed_dt.csv');
      console.log('Fetched CSV - first 200 chars:', csvText.substring(0, 200));
      
      parsedData = processCsvData(csvText);
      console.log('Date-only filtering completed, loaded', parsedData.rows.length, 'rows');
      
    } else if (hasOtherFilters) {
      // OTHER FILTERS ONLY
      console.log('Applying other filters only...');
      
      const otherOnlyPayload = {
        severities,
        partOfDay,
        cityLocation,
        mainTypes,
        subtypes,
        isFiltered: true
      };
      
      const processingResult = await processData(otherOnlyPayload);
      if (!processingResult.success) {
        throw new Error(processingResult.error || 'Other filters failed');
      }
      
      const csvFile = 'filtered_data.csv';
      const csvText = await fetchCsvData(csvFile);
      parsedData = processCsvData(csvText);
      
    } else {
      // NO FILTERS - FULL DATASET
      console.log('No filters applied, fetching full dataset...');
      
      const processingResult = await processData({ isFiltered: false });
      if (!processingResult.success) {
        throw new Error(processingResult.error || 'Processing failed');
      }
      
      const csvText = await fetchCsvData('ps_removed_dt.csv');
      parsedData = processCsvData(csvText);
    }
    
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
      centerMapToCoordinates(store, 8.5782259865, 76.95390701, 9);
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