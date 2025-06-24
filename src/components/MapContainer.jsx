import React, { useCallback, useMemo } from 'react';
import KeplerGl             from '@kepler.gl/components';
import AutoSizer            from 'react-virtualized/dist/commonjs/AutoSizer';
import { useDispatch }      from 'react-redux';

import keplerConfig         from '../config/keplerConfig.json';

const MAPBOX_TOKEN         = null;

const MapContainer = () => {
  const dispatch = useDispatch();
  
  const mapStyle = useMemo(() => keplerConfig.config.mapStyle, []);

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
    [mapStyle]
  );

  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      <AutoSizer>{renderMap}</AutoSizer>
    </div>
  );
};

export default React.memo(MapContainer);