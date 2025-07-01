// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store';
import { useMapStyles } from './hooks/useMapStyles';
import './App.css';

// Component imports
import Header from './components/Header';
import Footer from './components/Footer';
import MapPanel from './components/MapPanel';
import DateRangeSelector from './components/DateRangeSelector';
import HotspotButton from './components/HotspotButton';
import EmergingHotspotsButton from './components/EmergingHotspotsButton';
import FilterDropdown from './components/FilterDropdown';
import SubtypeDropdown from './components/SubtypeDropdown';
import SeverityRadio from './components/SeverityRadio';
import PartOfDayRadio from './components/PartOfDayRadio';
import ApplyFiltersButton from './components/ApplyFiltersButton';
import PreLoader from './components/PreLoader';
import ErrorState from './components/ErrorState';
import MapContainer from './components/MapContainer';
import DistrictDropdown from './components/DistrictDropdown';
import TemporalTrendDropdown from './components/TemporalTrendDropdown';
import ChartPanel from './components/ChartPanel';

const ControlPanel = ({ 
  selectedMainTypes, setSelectedMainTypes,
  selectedSubtypes, setSelectedSubtypes,
  selectedSeverities, setSelectedSeverities,
  selectedPartOfDay, setSelectedPartOfDay,
  selectedCityLocation, selectedDateRange, setSelectedDateRange,
  selectedDistrict, setSelectedDistrict,
  selectedTemporalTrend, setSelectedTemporalTrend
}) => {
  const panelStyle = {
    height: '237px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '5px',
    padding: '8px',
    boxShadow: '0 4px 20px black',
    border: '1px solid black',
    overflow: 'auto'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '239px 1px 321px 1px 284px 1px 284px 1px 1fr',
    gap: '0',
    height: '100%',
    alignItems: 'start'
  };

  const columnStyle = (paddingLeft = '0px', paddingRight = '8px') => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingLeft,
    paddingRight
  });

  const headerStyle = {
    margin: '0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    borderBottom: '2px solid #333',
    paddingBottom: '4px'
  };

  const separatorStyle = {
    width: '1px',
    height: '100%',
    backgroundColor: '#ddd'
  };

  const lineStyle = {
    height: '1px',
    backgroundColor: '#ddd',
    margin: '8px 0'
  };

  const inputStyle = {
    flex: '1',
    padding: '4px 8px',
    fontSize: '11px',
    backgroundColor: '#fff',
    border: '1px solid #000',
    borderRadius: '3px',
    outline: 'none'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#333',
    minWidth: '60px'
  };

  const InputRow = ({ label, placeholder, type = "text", step, unit }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={labelStyle}>{label}:</label>
      <input type={type} step={step} placeholder={placeholder} style={inputStyle} />
      {unit && <span style={{ fontSize: '10px', color: '#666' }}>{unit}</span>}
    </div>
  );

  return (
    <div style={panelStyle}>
      <div style={gridStyle}>
        {/* Column 1: Date Range */}
        <div style={columnStyle('0px')}>
          <h3 style={headerStyle}>Date Range</h3>
          <DateRangeSelector onDateRangeChange={setSelectedDateRange} />
          <div style={lineStyle}></div>
          <PartOfDayRadio 
            selectedMainTypes={selectedMainTypes} 
            selectedSubtypes={selectedSubtypes}
            selectedSeverities={selectedSeverities}
            onSelectionChange={setSelectedPartOfDay}
          />
        </div>

        <div style={separatorStyle}></div>

        {/* Column 2: Event Details */}
        <div style={columnStyle('8px')}>
          <h3 style={headerStyle}>Event Details</h3>
          <FilterDropdown onSelectionChange={setSelectedMainTypes} />
          <SubtypeDropdown 
            selectedMainTypes={selectedMainTypes} 
            onSelectionChange={setSelectedSubtypes}
          />
          <div style={lineStyle}></div>
          <TemporalTrendDropdown onSelectionChange={setSelectedTemporalTrend} />
        </div>

        <div style={separatorStyle}></div>

        {/* Column 3: Place Details */}
        <div style={columnStyle('8px')}>
          <h3 style={headerStyle}>Place Details</h3>
          <DistrictDropdown onSelectionChange={setSelectedDistrict} />
          <div style={lineStyle}></div>
          <SeverityRadio 
            selectedMainTypes={selectedMainTypes} 
            selectedSubtypes={selectedSubtypes} 
            onSelectionChange={setSelectedSeverities}
          />
        </div>

        <div style={separatorStyle}></div>

        {/* Column 4: Location */}
        <div style={columnStyle('8px')}>
          <h3 style={headerStyle}>Location</h3>
          <InputRow label="Landmark" placeholder="Search landmark..." />
          <div style={{ height: '1px', backgroundColor: '#ddd', margin: '4px 0' }}></div>
          <InputRow label="Latitude" placeholder="40.7128" type="number" step="any" />
          <InputRow label="Longitude" placeholder="-74.0060" type="number" step="any" />
          <div style={{ height: '1px', backgroundColor: '#ddd', margin: '4px 0' }}></div>
          <InputRow label="Range" placeholder="1.0" type="number" step="0.1" unit="km" />
        </div>

        <div style={separatorStyle}></div>

        {/* Column 5: Actions */}
        <div style={{
          ...columnStyle('8px', '0px'),
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}>
          <h3 style={{ ...headerStyle, textAlign: 'center', width: '100%' }}>Actions</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            flex: '1',
            width: '100%'
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
      </div>
    </div>
  );
};

const ContentPanel = ({ style, children }) => (
  <div style={{
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '5px',
    boxShadow: '0 4px 20px black',
    border: '1px solid black',
    ...style
  }}>
    {children}
  </div>
);

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

  if (error) return <ErrorState error={error} />;

  const containerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#000000'
  };

  const mainContentStyle = {
    position: 'absolute',
    top: '45px',
    left: '10px',
    right: '10px',
    bottom: '36px',
    display: 'flex',
    flexDirection: 'row',
    gap: '10px'
  };

  const chartProps = {
    selectedDateRange,
    selectedTemporalTrend,
    selectedMainTypes,
    selectedSubtypes,
    selectedSeverities,
    selectedPartOfDay,
    selectedDistrict,
    selectedCityLocation
  };

  return (
    <Provider store={store}>
      <div style={containerStyle}>
        <Header />
        <Footer />
        
        <PreLoader 
          isLoading={isProcessing || isFiltering}
          loadingText={isProcessing ? "Processing Crime Data" : "Loading Filtered Data"}
          subText={isProcessing ? "Initializing ERSS Crime Analytics Dashboard..." : "Applying filters to crime data..."}
        >
          <div style={mainContentStyle}>
            {/* Main Content */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ControlPanel 
                selectedMainTypes={selectedMainTypes}
                setSelectedMainTypes={setSelectedMainTypes}
                selectedSubtypes={selectedSubtypes}
                setSelectedSubtypes={setSelectedSubtypes}
                selectedSeverities={selectedSeverities}
                setSelectedSeverities={setSelectedSeverities}
                selectedPartOfDay={selectedPartOfDay}
                setSelectedPartOfDay={setSelectedPartOfDay}
                selectedCityLocation={selectedCityLocation}
                selectedDateRange={selectedDateRange}
                setSelectedDateRange={setSelectedDateRange}
                selectedDistrict={selectedDistrict}
                setSelectedDistrict={setSelectedDistrict}
                selectedTemporalTrend={selectedTemporalTrend}
                setSelectedTemporalTrend={setSelectedTemporalTrend}
              />

              {/* Bottom Row */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', flex: '1' }}>
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ContentPanel style={{ flex: '1', height: '536px', overflow: 'hidden' }}>
                    <ChartPanel {...chartProps} />
                  </ContentPanel>
                </div>

                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ContentPanel style={{ flex: '1', position: 'relative', overflow: 'hidden' }}>
                    <MapContainer />
                    <MapPanel />
                  </ContentPanel>
                  
                  <ContentPanel style={{
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'black',
                    fontSize: '14px'
                  }}>
                    Status Bar
                  </ContentPanel>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <ContentPanel style={{
              width: '110px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              color: 'black',
              fontSize: '12px',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <HotspotButton />
                <EmergingHotspotsButton />
              </div>
            </ContentPanel>
          </div>
        </PreLoader>
      </div>
    </Provider>
  );
};

export default App;

