import React, { useState, useCallback, useEffect } from 'react';
import KeplerGl from '@kepler.gl/components';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { useDispatch } from 'react-redux';
import GL from '@luma.gl/constants';

const TILESERVER_STYLE_URL = 'http://localhost:8080/styles/basic-preview/style.json';
const MAPBOX_TOKEN = null;

const MapContainer = () => {
  const dispatch = useDispatch();
  const [dataLoadTime] = useState(Date.now());

  const onMapReady = useCallback((mapInstance) => {
    console.log('Map is ready, checking tile server...');
    fetch(TILESERVER_STYLE_URL)
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(style => console.log('Tileserver style loaded successfully'))
      .catch(error => console.error('Error loading tiles:', error));
  }, []);

  const onStyleLoadError = useCallback((error) => {
    console.error('Map style load error:', error);
  }, []);

  useEffect(() => {
    dispatch({
      type: 'KEPLERGL_STYLE_CHANGE',
      payload: {
        mapStyle: {
          styleType: 'customTileserver',
          topLayerGroups: {},
          visibleLayerGroups: {},
          mapStyles: {
            customTileserver: {
              id: 'customTileserver',
              label: 'Local Tileserver',
              url: TILESERVER_STYLE_URL,
              icon: 'map',
              layerGroups: []
            }
          }
        },
        mapId: 'map'
      }
    });
  }, [dispatch]);

  return (
    <div style={{ position: 'absolute', top: '70px', left: 0, right: 0, bottom: 0 }}>
      <AutoSizer>
        {({ height, width }) => (
          <KeplerGl
            key={`kepler-gl-${dataLoadTime}`}
            id="map"
            width={width}
            height={height}
            mapboxApiAccessToken={MAPBOX_TOKEN}
            onMapReady={onMapReady}
            onStyleLoadError={onStyleLoadError}
            mapStyle={{
              styleType: 'customTileserver',
              mapStyles: {
                customTileserver: {
                  id: 'customTileserver',
                  label: 'Local Tileserver',
                  url: TILESERVER_STYLE_URL,
                  icon: 'map',
                  layerGroups: []
                }
              },
              topLayerGroups: {},
              visibleLayerGroups: {}
            }}
            mapOptions={{
              preserveDrawingBuffer: true,
              antialias: true,
              powerPreference: 'default',
              failIfMajorPerformanceCaveat: false,
              contextAttributes: {
                alpha: true,
                depth: true,
                stencil: true,
                antialias: true,
                premultipliedAlpha: true,
                preserveDrawingBuffer: true,
                powerPreference: 'default'
              }
            }}
            deckGlProps={{
              parameters: {
                blend: true,
                depthTest: true,
                depthFunc: GL.LEQUAL,
                depthMask: true,
                blendFunc: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA],
                blendEquation: GL.FUNC_ADD,
                antialias: true,
                cull: false
              },
              useDevicePixels: true,
              gl2: true,
              lighting: true,
              pickingRadius: 5,
              _animate: true,
              effects: [
                {
                  id: 'lighting',
                  enabled: true,
                  parameters: {
                    intensity: 0.8
                  }
                }
              ]
            }}
          />
        )}
      </AutoSizer>
    </div>
  );
};

export default MapContainer;