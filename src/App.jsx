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
import SeverityRadio from './components/SeverityRadio';
import PartOfDayRadio from './components/PartOfDayRadio';
import InsideCityRadio from './components/InsideCityRadio';
import ApplyFiltersButton from './components/ApplyFiltersButton';
import PreLoader from './components/PreLoader';
import ErrorState from './components/ErrorState';
import MapContainer from './components/MapContainer';
import DistrictDropdown from './components/DistrictDropdown';
import TemporalTrendDropdown from './components/TemporalTrendDropdown';
import ChartPanel from './components/ChartPanel';

import store from './store';
import { useMapStyles } from './hooks/useMapStyles';
import './App.css';

const App = () => {
  const dispatch = useDispatch();
  const [selectedMainTypes, setSelectedMainTypes] = useState(['All Types']);
  const [selectedSubtypes, setSelectedSubtypes] = useState(['All Subtypes']);
  const [selectedSeverities, setSelectedSeverities] = useState(['All Levels']);
  const [selectedPartOfDay, setSelectedPartOfDay] = useState(['All Times']);
  const [selectedCityLocation, setSelectedCityLocation] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [selectedTemporalTrend, setSelectedTemporalTrend] = useState('Hourly');

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
              {/* Top panel with controls - reduced height and reorganized */}
              <div style={{
                height: '35%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '5px',
                padding: '8px',
                boxShadow: '0 4px 20px black',
                border: '1px solid black',
                overflow: 'auto',
              }}>
                {/* First row - Analysis buttons and date selector */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  marginBottom: '8px',
                  alignItems: 'flex-start'
                }}>
                  {/* Analysis buttons column */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px',
                    minWidth: '120px'
                  }}>
                    <HotspotButton />
                    <KDEButton />
                  </div>
                  
                  {/* Updated DateRangeSelector with callback */}
                  <div style={{ minWidth: '200px' }}>
                    <DateRangeSelector onDateRangeChange={setSelectedDateRange} />
                  </div>
                  
                  {/* Updated ApplyFiltersButton with date range and types */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end',
                    height: '100%',
                    minWidth: '180px'
                  }}>
                    <ApplyFiltersButton
                      selectedSeverities={selectedSeverities}
                      selectedPartOfDay={selectedPartOfDay}
                      selectedCityLocation={selectedCityLocation}
                      selectedDateRange={selectedDateRange}
                      selectedMainTypes={selectedMainTypes}
                      selectedSubtypes={selectedSubtypes}
                    />
                  </div>
                </div>

                {/* Second row - Filter controls */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}>
                  {/* Main type and subtype filters */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <FilterDropdown onSelectionChange={setSelectedMainTypes} />
                    <SubtypeDropdown 
                      selectedMainTypes={selectedMainTypes} 
                      onSelectionChange={setSelectedSubtypes}
                    />
                  </div>
                  
                  {/* Severity filter */}
                  <SeverityRadio 
                    selectedMainTypes={selectedMainTypes} 
                    selectedSubtypes={selectedSubtypes} 
                    onSelectionChange={setSelectedSeverities}
                  />
                  
                  {/* Part of day filter */}
                  <PartOfDayRadio 
                    selectedMainTypes={selectedMainTypes} 
                    selectedSubtypes={selectedSubtypes}
                    selectedSeverities={selectedSeverities}
                    onSelectionChange={setSelectedPartOfDay}
                  />
                  
                  {/* District filter - standalone */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'black' }}>
                      District Filter
                    </div>
                    <DistrictDropdown onSelectionChange={setSelectedDistrict} />
                  </div>
                  
                  {/* Temporal Trend Type filter */}
                  <TemporalTrendDropdown onSelectionChange={setSelectedTemporalTrend} />
                  
                  {/* City location filter (Inside/Outside) */}
                  <InsideCityRadio
                    selectedValue={selectedCityLocation}
                    onSelectionChange={setSelectedCityLocation}
                  />
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
                    boxShadow: '0 4px 20px black',
                    border: '1px solid black',
                    overflow: 'hidden'
                  }}>
                    <ChartPanel />
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
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              color: 'black',
              fontSize: '12px',
              boxShadow: '0 4px 20px black',
              border: '1px solid black',
              gap: '10px'
            }}>
              <div style={{
                writingMode: 'vertical-lr',
                textOrientation: 'mixed',
                fontWeight: 'bold',
                marginBottom: '10px'
              }}>
                Tools
              </div>
              
              {/* Add your tool buttons here */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                width: '100%'
              }}>
                {/* Example tool buttons */}
                <button style={{
                  width: '100%',
                  padding: '8px 4px',
                  fontSize: '10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Tool 1
                </button>
                <button style={{
                  width: '100%',
                  padding: '8px 4px',
                  fontSize: '10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Tool 2
                </button>
                <button style={{
                  width: '100%',
                  padding: '8px 4px',
                  fontSize: '10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Tool 3
                </button>
              </div>
            </div>
          </div>
        </PreLoader>
      </div>
    </Provider>
  );
};

export default App;

