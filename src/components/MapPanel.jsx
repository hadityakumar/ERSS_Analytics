import React from 'react';
import CenterButton from './CenterButton';
import ToggleLayerButton from './ToggleLayerButton';
import ToggleCrimePointsButton from './ToggleCrimePointsButton';
import ToggleDistrictButton from './ToggleDistrictButton';

const MapPanel = () => {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      height: '95%',
      zIndex: 1000,
      backgroundColor: '#fff',
      borderRadius: '4px',
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      minWidth: '50px'
    }}>
      {/* Remove absolute positioning from individual buttons */}
      <div style={{ position: 'relative' }}>
        <CenterButton />
      </div>
      <div style={{ position: 'relative' }}>
        <ToggleLayerButton />
      </div>
      <div style={{ position: 'relative' }}>
        <ToggleCrimePointsButton />
      </div>
      <div style={{ position: 'relative' }}>
        <ToggleDistrictButton />
      </div>
    </div>
  );
};

export default MapPanel;