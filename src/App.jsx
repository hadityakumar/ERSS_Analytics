// src/App.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Header from './components/Header';
import Footer from './components/Footer';
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
  
  const { isProcessing, error, isFiltering } = useSelector(state => state.csvProcessing || { isProcessing: true, error: null, isFiltering: false });

  // Load initial data once when the app starts
  useEffect(() => {
    console.log('App mounted, loading initial data...');
    dispatch({ type: 'FETCH_CSV_DATA_INITIAL' });
  }, [dispatch]); // Only run once when component mounts

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
      overflow: 'hidden',
      backgroundColor: '#000000'
    }}>
      <Header />
      <Footer />
      
      {/* Main content area between header and footer */}
      <div style={{
        position: 'absolute',
        top:  '45px', 
        left: '10px',
        right: '10px',
        bottom: '50px', // Above footer (40px + 10px margin)
        display: 'flex',
        flexDirection: 'row',
        gap: '10px'
      }}>
        
        {/* First column - Left panels with 2 rows */}
        <div style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Top left */}
          <div style={{
            flex: '0.44',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '5px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'black',
            fontSize: '18px',
            boxShadow: '0 4px 20px black',
            border: '1px solid black'
          }}>
            Top Left Panel
          </div>
          
          {/* Bottom left */}
          <div style={{
            flex: '1',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '5px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'black',
            fontSize: '18px',
            boxShadow: '0 4px 20px black',
            border: '1px solid black'
          }}>
            Bottom Left Panel
          </div>
        </div>

        {/* Second column - Control panels with 3 rows */}
        <div style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Top right - Control buttons */}
          <div style={{
            flex: '0.35', // Smaller than top left (0.44)
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '5px',
            padding: '8px', // Reduced padding
            position: 'relative',
            boxShadow: '0 4px 20px black',
            border: '1px solid black',
            overflow: 'auto',
            minHeight: '29.9%', 
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px', // Smaller gap
              alignItems: 'flex-start',
              height: '100%'
            }}>
              <HotspotButton />
              <KDEButton />
              <FilterDropdown />
              <DateRangeSelector />
            </div>
          </div>
          
          {/* Middle right - Map */}
          <div style={{
            flex: '2',
            position: 'relative',
            borderRadius: '5px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px black',
            border: '1px solid black'
          }}>
            <MapContainer />
            <CenterButton />
            {/* Show map-only loading overlay for both initial load and filtering */}
            {(isProcessing || isFiltering) && <LoadingState mapOnly={true} />}
          </div>
          
          {/* Bottom right panel */}
          <div style={{
            height: '30px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'black',
            fontSize: '14px',
            boxShadow: '0 4px 20px black',
            border: '1px solid black',
          }}>
            Status Bar
          </div>
        </div>

        {/* Third column - Narrow sidebar */}
        <div style={{
          width: '110px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'black',
          fontSize: '12px',
          writingMode: 'vertical-lr',
          textOrientation: 'mixed',
          boxShadow: '0 4px 20px black',
          border: '1px solid black',
        }}>
          Tools
        </div>
      </div>
    </div>
  );
};

export default App;

