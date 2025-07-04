import React from 'react';
import CenterButton from './CenterButton';
import ToggleLayerButton from './ToggleLayerButton';
import ToggleCrimePointsButton from './ToggleCrimePointsButton';
import ToggleDistrictButton from './ToggleDistrictButton';
import ToggleHotspotButton from './ToggleHotspotButton';
import ToggleEmergingHotspotsButton from './ToggleEmergingHotspotsButton';
import MapPanelIconButton from './MapPanelIconButton';

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
      <div><CenterButton /></div>
      <div><ToggleCrimePointsButton /></div>
      <div><ToggleLayerButton /></div>
      <div><ToggleDistrictButton /></div>
      <div><ToggleHotspotButton /></div>
      <div><ToggleEmergingHotspotsButton /></div>
      <div>
        <MapPanelIconButton
          icon="snapshot.svg"
          alt="Snapshot"
          title="Take Snapshot"
          iconSize={28} // Increased icon size
          onClick={() => { /* TODO: add functionality */ }}
        />
      </div>
      <div>
        <MapPanelIconButton
          icon="locate.svg"
          alt="Locate"
          title="Locate"
          iconSize={28} // Increased icon size
          onClick={() => { /* TODO: add functionality */ }}
        />
      </div>
      <div>
        <MapPanelIconButton
          icon="left_arrows.svg"
          alt="Left Arrows"
          title="Navigate Left"
          iconSize={28} // Increased icon size
          onClick={() => { /* TODO: add functionality */ }}
        />
      </div>
      <div>
        <MapPanelIconButton
          icon="map_locate.svg"
          alt="Map Locate"
          title="Map Locate"
          iconSize={42} // Increased icon size
          onClick={() => { /* TODO: add functionality */ }}
        />
      </div>
    </div>
  );
};

export default MapPanel;
