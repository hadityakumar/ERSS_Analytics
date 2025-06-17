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

// Custom Kepler.gl reducer to handle modal issues
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
          'KEPLERGL_FORCE_UPDATE'
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
