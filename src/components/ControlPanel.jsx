import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateMap } from '@kepler.gl/actions';
import DateRangeSelector from './DateRangeSelector';
import FilterDropdown from './FilterDropdown';
import SubtypeDropdown from './SubtypeDropdown';
import SeverityRadio from './SeverityRadio';
import PartOfDayRadio from './PartOfDayRadio';
import ApplyFiltersButton from './ApplyFiltersButton';
import DistrictDropdown from './DistrictDropdown';
import TemporalTrendDropdown from './TemporalTrendDropdown';
import RangeDropdown from './RangeDropdown';

// Animation helpers from CenterButton
const easeOutQuad = (t) => t * (2 - t);
const lerp = (start, end, factor) => start + (end - start) * factor;

const ControlPanel = ({
  selectedMainTypes, setSelectedMainTypes,
  selectedSubtypes, setSelectedSubtypes,
  selectedSeverities, setSelectedSeverities,
  selectedPartOfDay, setSelectedPartOfDay,
  selectedCityLocation, selectedDateRange, setSelectedDateRange,
  selectedDistrict, setSelectedDistrict,
  selectedTemporalTrend, setSelectedTemporalTrend
}) => {
  const dispatch = useDispatch();
  
  // State for location inputs
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [zoom, setZoom] = useState('');

  // Get current map state for smooth animation
  const currentLat = useSelector(state => state.keplerGl?.map?.mapState?.latitude || 8.5241);
  const currentLng = useSelector(state => state.keplerGl?.map?.mapState?.longitude || 76.9366);
  const currentZoom = useSelector(state => state.keplerGl?.map?.mapState?.zoom || 10);

  // Center map function with smooth animation like CenterButton
  const centerMapToCoordinates = useCallback((lat, lng, zoomLevel) => {
    const targetLat = parseFloat(lat);
    const targetLng = parseFloat(lng);
    const targetZoom = parseFloat(zoomLevel);

    // Validate inputs
    if (isNaN(targetLat) || isNaN(targetLng) || isNaN(targetZoom)) {
      alert('Please enter valid numbers for latitude, longitude, and zoom.');
      return;
    }

    // Validate coordinate ranges
    if (targetLat < -90 || targetLat > 90) {
      alert('Latitude must be between -90 and 90 degrees.');
      return;
    }

    if (targetLng < -180 || targetLng > 180) {
      alert('Longitude must be between -180 and 180 degrees.');
      return;
    }

    if (targetZoom < 0 || targetZoom > 20) {
      alert('Zoom level must be between 0 and 20.');
      return;
    }

    // Check if already at target position (avoid unnecessary animation)
    const latDiff = Math.abs(currentLat - targetLat);
    const lngDiff = Math.abs(currentLng - targetLng);
    const zoomDiff = Math.abs(currentZoom - targetZoom);

    if (latDiff < 0.001 && lngDiff < 0.001 && zoomDiff < 0.1) {
      console.log('Already at target coordinates');
      return;
    }

    // Smooth animation like CenterButton
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);

      // Interpolate between current and target values
      const animatedLat = lerp(currentLat, targetLat, easedProgress);
      const animatedLng = lerp(currentLng, targetLng, easedProgress);
      const animatedZoom = lerp(currentZoom, targetZoom, easedProgress);

      // Dispatch the map update
      dispatch(updateMap({
        latitude: animatedLat,
        longitude: animatedLng,
        zoom: animatedZoom,
        bearing: 0,
        pitch: 0,
        dragRotate: false,
        isSplit: false,
        isViewportSynced: true,
        isZoomLocked: false,
        splitMapViewports: []
      }, 'map'));

      // Continue animation until complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log(`Map smoothly centered to: Lat=${targetLat}, Lng=${targetLng}, Zoom=${targetZoom}`);
      }
    };

    // Start the animation
    animate();
  }, [dispatch, currentLat, currentLng, currentZoom]);

  // Handle GO button click
  const handleGoClick = useCallback(() => {
    if (!latitude || !longitude || !zoom) {
      alert('Please enter latitude, longitude, and zoom values.');
      return;
    }
    
    centerMapToCoordinates(latitude, longitude, zoom);
  }, [latitude, longitude, zoom, centerMapToCoordinates]);

  // Handle Enter key press in input fields
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleGoClick();
    }
  }, [handleGoClick]);

  // Responsive: no fixed height, fills flex container
  const panelStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '5px',
    padding: '15px',
    boxShadow: '0 4px 20px black',
    border: '1px solid black',
    overflow: 'visible', // Changed from 'auto' to 'visible' to allow dropdowns to extend outside
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative' // Added for dropdown positioning context
  };

  // Responsive grid: percentages for columns, 1px for separators, 1fr for actions
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '11.6% 1px 25% 1px 25% 1px 20% 1px 1fr',
    gap: '0',
    height: '100%',
    alignItems: 'start',
    width: '100%'
  };

  const columnStyle = (paddingLeft = '0px', paddingRight = '8px') => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingLeft,
    paddingRight,
    minWidth: 0, // allow shrinking
    position: 'relative' // Added for dropdown positioning
  });

  const headerStyle = {
    margin: '0',
    fontSize: '10.5px',
    fontWeight: 'bold',
    color: '#3C00FF',
    borderBottom: '2px solid #3C00FF',
    paddingBottom: '4px'
  };

  const separatorStyle = {
    width: '1px',
    backgroundColor: '#ddd',
    alignSelf: 'stretch',
    height: 'auto',
    margin: '0',
    padding: 0
  };

  const ThickseparatorStyle = {
    width: '2px',
    backgroundColor: 'black',
    alignSelf: 'stretch',
    height: 'auto',
    margin: 0,
    padding: 0
  };

  const lineStyle = {
    height: '1px',
    backgroundColor: '#ddd',
    margin: '8px 0'
  };

  const labelStyle = {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#333',
    minWidth: '60px'
  };

  // UPDATED InputRow to accept inputWidth and set flex:none if width is specified
  const InputRow = ({ label, placeholder, type = "text", step, unit, inputWidth }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={labelStyle}>{label}</label>
      <input
        className="cp-input"
        type={type}
        step={step}
        placeholder={placeholder}
        style={inputWidth ? { width: inputWidth, flex: 'none' } : {}}
      />
      {unit && <span style={{ fontSize: '10px', color: '#666' }}>{unit}</span>}
    </div>
  );

  return (
    <div style={panelStyle}>
      {/* --- Input box style to match dropdown --- */}
      <style>{`
        .cp-input {
          flex: 1;
          padding: 7px 10px;
          font-size: 12px;
          background: #fff;
          border: 2px solid #000;
          border-radius: 0;
          outline: none;
          min-width: 0;
          box-sizing: border-box;
          transition: border 0.16s;
        }
        .cp-input::placeholder {
          font-size: 10px;
        }
        .cp-input:focus {
          border: 2.5px solid #111;
        }
        .go-button {
          padding: 7px 10px;
          fontSize: 12px;
          background: black;
          border: 2px solid #000;
          color: white;
          border-radius: 0;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
          transition: background 0.2s, transform 0.1s;
        }
        .go-button:hover {
          background: #333;
          transform: translateY(-1px);
        }
        .go-button:active {
          transform: translateY(0);
        }
      `}</style>
      <div style={gridStyle}>
        {/* Column 1: Date Range */}
        <div style={columnStyle('0px')}>
          <h3 style={headerStyle}>Date Range & Time</h3>
          <DateRangeSelector onDateRangeChange={setSelectedDateRange} />
        </div>

        <div style={ThickseparatorStyle}></div>

        {/* Column 2: Event Details */}
        <div style={columnStyle('8px')}>
          <h3 style={headerStyle}>Event Details</h3>
          <FilterDropdown onSelectionChange={setSelectedMainTypes} />
          <SubtypeDropdown
            selectedMainTypes={selectedMainTypes}
            onSelectionChange={setSelectedSubtypes}
          />
          <RangeDropdown />
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
          <div style={lineStyle}></div>
          <PartOfDayRadio
            selectedMainTypes={selectedMainTypes}
            selectedSubtypes={selectedSubtypes}
            selectedSeverities={selectedSeverities}
            onSelectionChange={setSelectedPartOfDay}
          />
        </div>

        <div style={separatorStyle}></div>

        {/* Column 4: Location */}
        <div style={columnStyle('8px')}>
          <h3 style={headerStyle}>Location</h3>
          <InputRow label="Landmark" placeholder="Search landmark..." />
          <div style={{ height: '1px', backgroundColor: '#ddd', margin: '4px 0' }}></div>
          
          {/* Latitude Input with state management */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={labelStyle}>Latitude</label>
            <input
              className="cp-input"
              type="number"
              step="any"
              placeholder="8.565000"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ width: '100px', flex: 'none' }}
            />
          </div>
          
          {/* Longitude Input with state management */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={labelStyle}>Longitude</label>
            <input
              className="cp-input"
              type="number"
              step="any"
              placeholder="76.958000"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ width: '100px', flex: 'none' }}
            />
          </div>
          
          <div style={{ height: '1px', backgroundColor: '#ddd', margin: '4px 0' }}></div>
          
          {/* Zoom input with GO button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={labelStyle}>Zoom</label>
            <input
              className="cp-input"
              type="number"
              step="0.1"
              placeholder="9.0"
              value={zoom}
              onChange={(e) => setZoom(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ width: '65px', flex: 'none' }}
            />
            <button
              className="go-button"
              onClick={handleGoClick}
              title="Center map to coordinates"
            >
              GO
            </button>
          </div>
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

export default ControlPanel;

