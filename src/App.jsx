// src/App.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Header from './components/Header';
import CenterButton from './components/CenterButton';
import DateRangeSelector from './components/DateRangeSelector';
import HotspotButton from './components/HotspotButton';
import KDEButton from './components/KDEButton';
import FilterDropdown from './components/FilterDropdown';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import MapContainer from './components/MapContainer';

import { useMapStyles } from './hooks/useMapStyles';

const App = () => {
  const dispatch = useDispatch();
  
  useMapStyles();
  
  const { isProcessing, error } = useSelector(state => state.csvProcessing || { isProcessing: true, error: null });

  useEffect(() => {
    console.log("Initial data fetch triggered");
    dispatch({ type: 'FETCH_CSV_DATA' });
  }, [dispatch]);

  if (isProcessing) {
    console.log("Rendering loading state");
    return <LoadingState />;
  }

  if (error) {
    console.log("Rendering error state:", error);
    return <ErrorState error={error} />;
  }

  console.log("Rendering map view");
  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%',
      overflow: 'hidden'
    }}>
      <Header />
      <CenterButton />
      <HotspotButton />
      <KDEButton />
      <FilterDropdown />
      <DateRangeSelector />
      <MapContainer />
    </div>
  );
};

export default App;

