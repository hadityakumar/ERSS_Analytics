// src/store.js
import { combineReducers } from 'redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { taskMiddleware } from 'react-palm/tasks';
import keplerGlReducer from '@kepler.gl/reducers';
import { keplerGlInit } from '@kepler.gl/actions';
import apiMiddleware from './middleware/apiMiddleware';

const csvProcessingSlice = createSlice({
  name: 'csvProcessing',
  initialState: {
    isProcessing: true,
    error: null,
    startDate: null,
    endDate: null
  },
  reducers: {
    processingStarted: (state) => {
      state.isProcessing = true;
      state.error = null;
    },
    processingComplete: (state) => {
      state.isProcessing = false;
      state.error = null;
    },
    processingError: (state, action) => {
      state.isProcessing = false;
      state.error = action.payload;
    },
    setDateFilter: (state, action) => {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
    }
  }
});

// Export actions for use in components
export const { 
  processingStarted, 
  processingComplete, 
  processingError, 
  setDateFilter 
} = csvProcessingSlice.actions;

// Custom Kepler.gl reducer to handle modal issues and custom filter actions
const customKeplerGlReducer = (state, action) => {
  // Handle modal cleanup on data fetch start
  if (action.type === 'FETCH_CSV_DATA') {
    // Close any open modals before fetching new data
    if (state && state.map && state.map.uiState && state.map.uiState.currentModal) {
      return {
        ...state,
        map: {
          ...state.map,
          uiState: {
            ...state.map.uiState,
            currentModal: null
          }
        }
      };
    }
  }
  
  if (action.type === 'KEPLERGL_FORCE_UPDATE') {
    return {
      ...state,
      map: {
        ...state.map,
        visState: {
          ...state.map.visState,
          layerMetaVersion: (state.map.visState?.layerMetaVersion || 0) + 1
        }
      }
    };
  }
  
  // Handle custom filter actions
  if (action.type === '@@kepler.gl/ADD_FILTER_DIRECT' && action.target === 'map') {
    console.log('Custom ADD_FILTER_DIRECT action received:', action.payload);
    
    if (state && state.map && state.map.visState) {
      const currentFilters = state.map.visState.filters || [];
      const newFilters = [...currentFilters, action.payload.filter];
      
      console.log('Adding filter directly to state:', {
        currentCount: currentFilters.length,
        newCount: newFilters.length,
        newFilter: action.payload.filter
      });
      
      return {
        ...state,
        map: {
          ...state.map,
          visState: {
            ...state.map.visState,
            filters: newFilters
          }
        }
      };
    }
  }
  
  if (action.type === '@@kepler.gl/UPDATE_FILTER_COMPLETE' && action.target === 'map') {
    console.log('Custom UPDATE_FILTER_COMPLETE action received:', action.payload);
    
    if (state && state.map && state.map.visState) {
      console.log('Updating filters array completely:', {
        oldCount: (state.map.visState.filters || []).length,
        newCount: action.payload.filters.length,
        newFilters: action.payload.filters
      });
      
      return {
        ...state,
        map: {
          ...state.map,
          visState: {
            ...state.map.visState,
            filters: action.payload.filters
          }
        }
      };
    }
  }
  
  // Use the standard reducer for all other actions
  return keplerGlReducer(state, action);
};

const rootReducer = combineReducers({
  keplerGl: customKeplerGlReducer,
  csvProcessing: csvProcessingSlice.reducer
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: {
        ignoredPaths: [
          'keplerGl.map.visState',
          'keplerGl.map.mapState',
          'keplerGl.map.mapStyle'
        ],
        ignoredActions: [
          '@@kepler.gl/LAYER_HOVER',
          '@@kepler.gl/MOUSE_MOVE',
          '@@kepler.gl/UPDATE_MAP',
          '@@kepler.gl/ADD_DATA_TO_MAP',
          '@@kepler.gl/ADD_FILTER',
          '@@kepler.gl/UPDATE_FILTER',
          '@@kepler.gl/REMOVE_FILTER',
          'KEPLERGL_FORCE_UPDATE',
          '@@kepler.gl/ADD_FILTER_DIRECT',
          '@@kepler.gl/UPDATE_FILTER_COMPLETE'
        ],
        ignoredActionPaths: [
          'payload',
          'meta'
        ]
      },
    }).concat(taskMiddleware, apiMiddleware),
  devTools: true
});

export default store;
