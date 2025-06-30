// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';

import Header from './components/Header';
import Footer from './components/Footer';
import MapPanel from './components/MapPanel';
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
              {/* Top panel with controls*/}
              <div style={{
                height: '237px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '5px',
                padding: '8px',
                boxShadow: '0 4px 20px black',
                border: '1px solid black',
                overflow: 'auto',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '239px 1px 321px 1px 284px 1px 284px 1px 1fr',
                  gap: '0',
                  height: '100%',
                  alignItems: 'start'
                }}>
                  {/* Column 1: Date Range - 239px */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingRight: '8px'
                  }}>
                    <h3 style={{
                      margin: '0',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#333',
                      borderBottom: '2px solid #333',
                      paddingBottom: '4px'
                    }}>
                      Date Range
                    </h3>
                    <DateRangeSelector onDateRangeChange={setSelectedDateRange} />
                    
                    {/* Separator line */}
                    <div style={{
                      height: '1px',
                      backgroundColor: '#ddd',
                      margin: '8px 0'
                    }}></div>
                    
                    <PartOfDayRadio 
                      selectedMainTypes={selectedMainTypes} 
                      selectedSubtypes={selectedSubtypes}
                      selectedSeverities={selectedSeverities}
                      onSelectionChange={setSelectedPartOfDay}
                    />
                  </div>

                  {/* Separator line 1 */}
                  <div style={{
                    width: '1px',
                    height: '100%',
                    backgroundColor: '#ddd'
                  }}></div>

                  {/* Column 2: Event Details - 321px */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                  }}>
                    <h3 style={{
                      margin: '0',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#333',
                      borderBottom: '2px solid #333',
                      paddingBottom: '4px'
                    }}>
                      Event Details
                    </h3>
                    <FilterDropdown onSelectionChange={setSelectedMainTypes} />
                    <SubtypeDropdown 
                      selectedMainTypes={selectedMainTypes} 
                      onSelectionChange={setSelectedSubtypes}
                    />
                    
                    {/* Separator line */}
                    <div style={{
                      height: '1px',
                      backgroundColor: '#ddd',
                      margin: '8px 0'
                    }}></div>
                    
                    <TemporalTrendDropdown onSelectionChange={setSelectedTemporalTrend} />
                  </div>

                  {/* Separator line 2 */}
                  <div style={{
                    width: '1px',
                    height: '100%',
                    backgroundColor: '#ddd'
                  }}></div>

                  {/* Column 3: Place Details - 284px */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                  }}>
                    <h3 style={{
                      margin: '0',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#333',
                      borderBottom: '2px solid #333',
                      paddingBottom: '4px'
                    }}>
                      Place Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <DistrictDropdown onSelectionChange={setSelectedDistrict} />
                    </div>
                    
                   <div style={{
                      height: '1px',
                      backgroundColor: '#ddd',
                      margin: '8px 0'
                    }}></div>
                    <SeverityRadio 
                      selectedMainTypes={selectedMainTypes} 
                      selectedSubtypes={selectedSubtypes} 
                      onSelectionChange={setSelectedSeverities}
                    />
                  </div>

                  {/* Separator line 3 */}
                  <div style={{
                    width: '1px',
                    height: '100%',
                    backgroundColor: '#ddd'
                  }}></div>

                  {/* Column 4: Location - 284px */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                  }}>
                    <h3 style={{
                      margin: '0',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#333',
                      borderBottom: '2px solid #333',
                      paddingBottom: '4px'
                    }}>
                      Location
                    </h3>
                    
                    {/* Landmark search */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#333',
                        minWidth: '60px'
                      }}>
                        Landmark:
                      </label>
                      <input
                        type="text"
                        placeholder="Search landmark..."
                        style={{
                          flex: '1',
                          padding: '4px 8px',
                          fontSize: '11px',
                          backgroundColor: '#fff',
                          border: '1px solid #000',
                          borderRadius: '3px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    {/* Separator line */}
                    <div style={{
                      height: '1px',
                      backgroundColor: '#ddd',
                      margin: '4px 0'
                    }}></div>
                    
                    {/* Latitude input */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#333',
                        minWidth: '60px'
                      }}>
                        Latitude:
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="40.7128"
                        style={{
                          flex: '1',
                          padding: '4px 8px',
                          fontSize: '11px',
                          backgroundColor: '#fff',
                          border: '1px solid #000',
                          borderRadius: '3px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    {/* Longitude input */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#333',
                        minWidth: '60px'
                      }}>
                        Longitude:
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="-74.0060"
                        style={{
                          flex: '1',
                          padding: '4px 8px',
                          fontSize: '11px',
                          backgroundColor: '#fff',
                          border: '1px solid #000',
                          borderRadius: '3px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    {/* Separator line */}
                    <div style={{
                      height: '1px',
                      backgroundColor: '#ddd',
                      margin: '4px 0'
                    }}></div>
                    
                    {/* Range input */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <label style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#333',
                        minWidth: '60px'
                      }}>
                        Range:
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="1.0"
                        style={{
                          flex: '1',
                          padding: '4px 8px',
                          fontSize: '11px',
                          backgroundColor: '#fff',
                          border: '1px solid #000',
                          borderRadius: '3px',
                          outline: 'none'
                        }}
                      />
                      <span style={{
                        fontSize: '10px',
                        color: '#666'
                      }}>
                        km
                      </span>
                    </div>
                  </div>

                  {/* Separator line 4 */}
                  <div style={{
                    width: '1px',
                    height: '100%',
                    backgroundColor: '#ddd'
                  }}></div>

                  {/* Column 5: Actions - Remaining space (1fr) */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    paddingLeft: '8px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                  }}>
                    <h3 style={{
                      margin: '0',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#333',
                      borderBottom: '2px solid #333',
                      paddingBottom: '4px',
                      textAlign: 'center',
                      width: '100%'
                    }}>
                      Actions
                    </h3>
                    
                    {/* Apply filters button - centered in column */}
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
                    height: '536px',
                    boxShadow: '0 4px 20px black',
                    border: '1px solid black',
                    overflow: 'hidden'
                  }}>
                    <ChartPanel 
                      selectedDateRange={selectedDateRange}
                      selectedTemporalTrend={selectedTemporalTrend}
                      selectedMainTypes={selectedMainTypes}
                      selectedSubtypes={selectedSubtypes}
                      selectedSeverities={selectedSeverities}
                      selectedPartOfDay={selectedPartOfDay}
                      selectedDistrict={selectedDistrict}
                      selectedCityLocation={selectedCityLocation}
                    />
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
                    <MapPanel />
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
             
              
              {/* Analysis tools */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                width: '100%'
              }}>
                <HotspotButton />
                <KDEButton />
              </div>
            </div>
          </div>
        </PreLoader>
      </div>
    </Provider>
  );
};

export default App;

