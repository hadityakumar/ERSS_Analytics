// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';

import Header from './components/Header';
import Footer from './components/Footer';
import CenterButton from './components/CenterButton';
import ToggleLayerButton from './components/ToggleLayerButton';
import ToggleCrimePointsButton from './components/ToggleCrimePointsButton';
import ToggleDistrictButton from './components/ToggleDistrictButton';
import DateRangeSelector from './components/DateRangeSelector';
import HotspotButton from './components/HotspotButton';
import KDEButton from './components/KDEButton';
import FilterDropdown from './components/FilterDropdown';
import SubtypeDropdown from './components/SubtypeDropdown';
import SeverityDropdown from './components/SeverityDropdown';
import PartOfDayDropdown from './components/PartOfDayDropdown';
import PreLoader from './components/PreLoader';
import ErrorState from './components/ErrorState';
import MapContainer from './components/MapContainer';

import store from './store';
import { useMapStyles } from './hooks/useMapStyles';
import './App.css';

const App = () => {
  const dispatch = useDispatch();
  const [selectedMainTypes, setSelectedMainTypes] = useState(['All Types']);
  const [selectedSubtypes, setSelectedSubtypes] = useState(['All Subtypes']);
  const [selectedSeverities, setSelectedSeverities] = useState(['All Levels']);
  
  useMapStyles();
  
  const { isProcessing, error, isFiltering } = useSelector(state => 
    state.csvProcessing || { isProcessing: true, error: null, isFiltering: false }
  );

  useEffect(() => {
    dispatch({ type: 'FETCH_CSV_DATA_INITIAL' });
  }, [dispatch]);

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <Provider store={store}>
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
        
        <PreLoader 
          isLoading={isProcessing || isFiltering}
          loadingText={isProcessing ? "Processing Crime Data" : "Loading Filtered Data"}
          subText={isProcessing ? "Initializing ERSS Crime Analytics Dashboard..." : "Applying filters to crime data..."}
        >
          <div style={{
            position: 'absolute',
            top: '45px', 
            left: '10px',
            right: '10px',
            bottom: '36px', 
            display: 'flex',
            flexDirection: 'row',
            gap: '10px'
          }}>
            
            {/* Left content */}
            <div style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* Top panel with controls */}
              <div style={{
                height: '35%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '5px',
                padding: '8px',
                boxShadow: '0 4px 20px black',
                border: '1px solid black',
                overflow: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px', 
                  alignItems: 'flex-start',
                  height: '100%'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <HotspotButton />
                    <KDEButton />
                    <SeverityDropdown 
                      selectedMainTypes={selectedMainTypes} 
                      selectedSubtypes={selectedSubtypes} 
                    />
                    <PartOfDayDropdown 
                      selectedMainTypes={selectedMainTypes} 
                      selectedSubtypes={selectedSubtypes}
                      selectedSeverities={selectedSeverities}
                    />
                  </div>
                  <div>
                    <FilterDropdown onSelectionChange={setSelectedMainTypes} />
                    <SubtypeDropdown 
                      selectedMainTypes={selectedMainTypes} 
                      onSelectionChange={setSelectedSubtypes}
                    />
                  </div>
                  <DateRangeSelector />
                </div>
              </div>

              {/* Bottom row */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '10px',
                flex: '1'
              }}>
                {/* Left panels */}
                <div style={{
                  flex: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
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

                {/* Center panels */}
                <div style={{
                  flex: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {/* Map */}
                  <div style={{
                    flex: '1',
                    position: 'relative',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px black',
                    border: '1px solid black'
                  }}>
                    <MapContainer />
                    <CenterButton />
                    <ToggleLayerButton />
                    <ToggleCrimePointsButton />
                    <ToggleDistrictButton />
                  </div>
                  
                  {/* Status */}
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
                    border: '1px solid black'
                  }}>
                    Status Bar
                  </div>
                </div>
              </div>
            </div>

            {/* Right sidebar - Tools panel spanning full height */}
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
              border: '1px solid black'
            }}>
              Tools
            </div>
          </div>
        </PreLoader>
      </div>
    </Provider>
  );
};

export default App;

