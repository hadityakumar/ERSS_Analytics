import React, { useCallback, useMemo, useState } from 'react';
import KeplerGl from '@kepler.gl/components';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { useDispatch } from 'react-redux';

import keplerConfig from '../config/keplerConfig.json';

const MAPBOX_TOKEN = null;

const MapContainer = () => {
  const dispatch = useDispatch();
  
  // State to store current map coordinates
  const [mapCoordinates, setMapCoordinates] = useState({
    longitude: 76.95390701,
    latitude: 8.5782259865,
    zoom: 9
  });

  const mapStyle = useMemo(() => keplerConfig.config.mapStyle, []);

  // Handler to capture view state changes
  const handleViewStateChange = useCallback((viewState) => {
    const { longitude, latitude, zoom } = viewState;
    setMapCoordinates({
      longitude: parseFloat(longitude.toFixed(6)),
      latitude: parseFloat(latitude.toFixed(6)),
      zoom: parseFloat(zoom.toFixed(2))
    });
  }, []);

  const renderMap = useCallback(
    ({ width, height }) =>
      width && height ? (
        <KeplerGl
          id="map"
          width={width}
          height={height}
          mapboxApiAccessToken={MAPBOX_TOKEN}
          mapStyle={mapStyle}
          config={keplerConfig.config}
          onViewStateChange={handleViewStateChange}
          appName="GIS_V3"
          version="1.0.0"
          features={{
            exportMap: true,
            exportData: true,
            shareMap: true,
            notifications: false
          }}
        />
      ) : null,
    [mapStyle, handleViewStateChange]
  );

  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      <AutoSizer>{renderMap}</AutoSizer>
      
      {/* Enhanced Coordinate Display Box */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        border: '1px solid #ccc',
        borderRadius: '6px',
        padding: '10px 12px',
        fontSize: '11px',
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        color: '#444',
        zIndex: 1000,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        minWidth: '190px',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ 
          marginBottom: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#666', fontWeight: 'bold' }}>Lat:</span>
          <span style={{ color: '#2c5234', fontWeight: 'bold' }}>
            {mapCoordinates.latitude}°
          </span>
        </div>
        <div style={{ 
          marginBottom: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#666', fontWeight: 'bold' }}>Lng:</span>
          <span style={{ color: '#2c5234', fontWeight: 'bold' }}>
            {mapCoordinates.longitude}°
          </span>
        </div>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#666', fontWeight: 'bold' }}>Zoom:</span>
          <span style={{ color: '#8b4513', fontWeight: 'bold' }}>
            {mapCoordinates.zoom}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MapContainer);