import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore, applyMiddleware, combineReducers } from 'redux';
import { taskMiddleware } from 'react-palm/tasks';
import { keplerGlReducer } from '@kepler.gl/reducers';
import App from './App';
import './index.css';

const rootReducer = combineReducers({
  keplerGl: keplerGlReducer,
  app: (state = { csvProcessing: true, csvError: null }, action) => {
    switch (action.type) {
      case 'CSV_PROCESSING_STARTED':
        return { ...state, csvProcessing: true, csvError: null };
      case 'CSV_PROCESSING_COMPLETE':
        return { ...state, csvProcessing: false, csvError: null };
      case 'CSV_PROCESSING_ERROR':
        return { ...state, csvProcessing: false, csvError: action.error };
      default:
        return state;
    }
  }
});

// Create the store
const store = configureStore(rootReducer, {}, applyMiddleware(taskMiddleware));

// Function to process CSV via backend API
const processCSV = async () => {
  store.dispatch({ type: 'CSV_PROCESSING_STARTED' });
  
  try {
    // Call the backend API to run the Python script
    const response = await fetch('/api/process-csv', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to process CSV: ${error}`);
    }
    
    const result = await response.json();
    console.log('CSV processing result:', result);
    
    // Dispatch success action
    store.dispatch({ type: 'CSV_PROCESSING_COMPLETE' });
    
    return true;
  } catch (error) {
    console.error('Error processing CSV:', error);
    store.dispatch({ type: 'CSV_PROCESSING_ERROR', error: error.message });
    return false;
  }
};

// Trigger CSV processing as soon as the app loads
processCSV();

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);