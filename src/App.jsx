// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store';
import { useMapStyles } from './hooks/useMapStyles';
import './App.css';

// Component imports
import Header from './components/Header';
import Footer from './components/Footer';
import ControlPanel from './components/ControlPanel';
import MapContainer from './components/MapContainer';
import MapPanel from './components/MapPanel';
import ChartPanel from './components/ChartPanel';
import HotspotButton from './components/HotspotButton';
import EmergingHotspotsButton from './components/EmergingHotspotsButton';
import PreLoader from './components/PreLoader';
import ErrorState from './components/ErrorState';
import { ToastContainer } from 'react-toastify';

const HEADER_HEIGHT = 26;  // px
const FOOTER_HEIGHT = 28;  // px

const ContentPanel = ({ style, children }) => (
  <div
    style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '5px',
      border: '1px solid black',
      ...style,
    }}
  >
    {children}
  </div>
);

const SidebarIconButton = ({ active, onClick, iconSrc, alt }) => (
  <div
    onClick={onClick}
    style={{
      width: '42px',
      height: '42px',
      margin: '0',
      borderRadius: '20%',
      background: active ? '#fff' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'background 0.2s',
      userSelect: 'none',
    }}
    tabIndex={0}
    aria-label={alt}
    role="button"
  >
    <img
      src={iconSrc}
      alt={alt}
      style={{
        width: '1.6rem',
        height: '1.6rem',
        filter: active ? 'invert(1)' : 'invert(0)',
        transition: 'filter 0.2s',
      }}
      draggable={false}
    />
  </div>
);

const SidebarSeparator = () => (
  <div
    style={{
      width: '60%',
      height: '1px',
      background: 'rgba(249, 249, 249, 0.25)',
      margin: '0.5rem auto',
    }}
  />
);

const CollapseButton = ({ isCollapsed, onClick }) => (
  <button
    onClick={onClick}
    style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'black',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      width: '33px',
      height: '33px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      zIndex: 10,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }}
    title={isCollapsed ? 'Expand Control Panel' : 'Collapse Control Panel'}
  >
    {isCollapsed ? '▼' : '▲'}
  </button>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isControlPanelCollapsed, setIsControlPanelCollapsed] = useState(false);

  useMapStyles();

  const { isProcessing, error, isFiltering } = useSelector((state) =>
    state.csvProcessing || { isProcessing: true, error: null, isFiltering: false }
  );

  useEffect(() => {
    dispatch({ type: 'FETCH_CSV_DATA_INITIAL' });
  }, [dispatch]);

  if (error) return <ErrorState error={error} />;

  const appWrapperStyle = {
    position: 'absolute',
    top: HEADER_HEIGHT,
    bottom: FOOTER_HEIGHT,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '10px 5px',
    overflow: 'hidden',
    backgroundColor: '#000',
  };

  const mainContentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    gap: '5px',
    minHeight: 0,
    minWidth: 0,
  };

  const chartProps = {
    selectedDateRange,
    selectedTemporalTrend,
    selectedMainTypes,
    selectedSubtypes,
    selectedSeverities,
    selectedPartOfDay,
    selectedDistrict,
    selectedCityLocation,
  };

  return (
    <Provider store={store}>
      {/* Fixed Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_HEIGHT,
          zIndex: 100,
        }}
      >
        <Header />
      </div>

      {/* Main scrollable container between header & footer */}
      <div style={appWrapperStyle}>
        <PreLoader
          isLoading={isProcessing || isFiltering}
          loadingText={isProcessing ? 'Processing Crime Data' : 'Loading Filtered Data'}
          subText={
            isProcessing
              ? 'Initializing ERSS Crime Analytics Dashboard...'
              : 'Applying filters to crime data...'
          }
        >
          <div style={mainContentStyle}>
            {/* Left Sidebar */}
            <ContentPanel
              style={{
                width: 'fit-content',
                minWidth: '2%',
                padding: 0,
                display: 'flex',
                backgroundColor: 'rgba(0, 0, 0, 1)',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <SidebarIconButton
                  active={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  iconSrc="analysis.svg"
                  alt="Analysis"
                />
                <SidebarSeparator />
                <SidebarIconButton
                  active={currentPage === 2}
                  onClick={() => setCurrentPage(2)}
                  iconSrc="MDT_allocation.svg"
                  alt="MDT Allocation"
                />
                <SidebarSeparator />
                <SidebarIconButton
                  active={currentPage === 3}
                  onClick={() => setCurrentPage(3)}
                  iconSrc="hexagons.svg"
                  alt="Hexagons"
                />
              </div>
            </ContentPanel>

            {/* Main Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* PAGE 1 */}
              <div
                style={{
                  display: currentPage === 1 ? 'flex' : 'none',
                  flex: 1,
                  flexDirection: 'column',
                  gap: '10px',
                  minHeight: 0,
                }}
              >
                {/* Collapsible Control Panel */}
                <div
                  style={{
                    maxHeight: isControlPanelCollapsed ? '50px' : '300px',
                    overflow: 'hidden',
                    transition: 'max-height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                  }}
                >
                  <ContentPanel
                    style={{
                      position: 'relative',
                      minHeight: '50px',
                      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: 1,
                    }}
                  >
                    <CollapseButton
                      isCollapsed={isControlPanelCollapsed}
                      onClick={() => setIsControlPanelCollapsed(!isControlPanelCollapsed)}
                    />
                    <div
                      style={{
                        opacity: isControlPanelCollapsed ? 1 : 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '50px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: 'black',
                        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: isControlPanelCollapsed ? 'static' : 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 5,
                      }}
                    >
                      Control Panel
                    </div>
                    <div
                      style={{
                        opacity: isControlPanelCollapsed ? 0 : 1,
                        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: isControlPanelCollapsed ? 'none' : 'auto',
                      }}
                    >
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
                    </div>
                  </ContentPanel>
                </div>

                <div style={{ display: 'flex', flex: 1, gap: '10px', minHeight: 0 }}>
                  {/* Chart Column */}
                  <div 
                    style={{ 
                      flex: isControlPanelCollapsed ? '0 0 40%' : 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '10px',
                      transition: 'flex 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <ContentPanel style={{ flex: 1, overflow: 'hidden' }}>
                      <ChartPanel {...chartProps} />
                    </ContentPanel>
                    <ContentPanel
                      style={{
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                      }}
                    >
                      Status Bar
                    </ContentPanel>
                  </div>

                  {/* Map Column */}
                  <div 
                    style={{ 
                      flex: isControlPanelCollapsed ? '0 0 60%' : 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '10px',
                      transition: 'flex 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <ContentPanel style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: 16,
                          left: 16,
                          zIndex: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <HotspotButton />
                        <EmergingHotspotsButton />
                        <ToastContainer
                          position="top-right"
                          autoClose={5000}
                          hideProgressBar={false}
                          newestOnTop={false}
                          closeOnClick
                          pauseOnFocusLoss
                          draggable
                          pauseOnHover
                          theme="dark"
                        />
                      </div>
                      <MapContainer />
                      <MapPanel />
                    </ContentPanel>
                  </div>
                </div>
              </div>

              {/* PAGE 2 */}
              <div
                style={{
                  display: currentPage === 2 ? 'block' : 'none',
                  flex: 1,
                  background: '#fff',
                  borderRadius: 8,
                }}
              >
                {/* MDT Allocation Page */}
                <div style={{ padding: '200px', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '35px', color: '#333' }}>MDT Allocation</h2>
                  <p style={{ fontSize: '22px', color: '#666' }}>
                    This page will display the allocation of Mobile Data Terminals (MDTs)
                  </p>
                
                  <img
                    src="gears.gif"
                    alt="Loading"
                    style={{ width: '150px', height: '150px', marginTop: '10px' }}
                  />
                  </div>
              </div>

              {/* PAGE 3 */}
              <div
                style={{
                  display: currentPage === 3 ? 'block' : 'none',
                  flex: 1,
                  background: '#fff',
                  borderRadius: 8,
                }}
              />
            </div>
          </div>
        </PreLoader>
      </div>

      {/* Fixed Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: FOOTER_HEIGHT,
          zIndex: 100,
        }}
      >
        <Footer />
      </div>
    </Provider>
  );
};

export default App;


