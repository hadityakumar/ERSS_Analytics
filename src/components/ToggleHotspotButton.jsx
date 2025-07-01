import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ACTION_TYPES } from '../middleware/utils/constants';

const ToggleHotspotButton = () => {
  const dispatch = useDispatch();
  const [isLayerVisible, setIsLayerVisible] = useState(false);
  
  // Monitor Kepler.gl state for hotspot layers
  const keplerState = useSelector(state => state.keplerGl?.map);
  const layers = keplerState?.visState?.layers || [];
  
  // Find hotspot layer
  const hotspotLayer = layers.find(layer => 
    (layer.type === 'heatmap' && layer.config?.label?.includes('Hotspot')) ||
    (layer.config?.label?.includes('Hotspot') && !layer.config?.label?.includes('Emerging')) ||
    (layer.id?.includes('hotspot') && !layer.id?.includes('emerging'))
  );

  // Update visibility state when hotspot layer is added or visibility changes
  useEffect(() => {
    if (hotspotLayer) {
      setIsLayerVisible(hotspotLayer.config.isVisible);
    } else {
      setIsLayerVisible(false);
    }
  }, [hotspotLayer]);

  const handleToggleLayer = () => {
    if (!hotspotLayer) {
      alert('No hotspot layer found. Please run hotspot analysis first.');
      return;
    }

    const newVisibility = !isLayerVisible;
    
    // Use the layer handler action
    dispatch({ 
      type: ACTION_TYPES.TOGGLE_HOTSPOT_VISIBILITY, 
      payload: { isVisible: newVisibility }
    });
    
    setIsLayerVisible(newVisibility);
  };

  return (
    <button
      onClick={handleToggleLayer}
      disabled={!hotspotLayer}
      style={{
        width: '35px',
        height: '35px',
        backgroundColor: !hotspotLayer 
          ? 'rgba(128, 128, 128, 0.5)' 
          : isLayerVisible 
            ? 'rgba(255, 107, 53, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)',
        border: 'none',
        borderRadius: '17.5px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        cursor: !hotspotLayer ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(4px)',
        padding: '6px',
        opacity: !hotspotLayer ? 0.5 : 1
      }}
      onMouseOver={(e) => {
        if (hotspotLayer) {
          e.target.style.transform = 'scale(1.05)';
          if (!isLayerVisible) {
            e.target.style.backgroundColor = 'rgba(255, 152, 0, 0.9)';
          }
        }
      }}
      onMouseOut={(e) => {
        if (hotspotLayer) {
          e.target.style.transform = 'scale(1)';
          e.target.style.backgroundColor = isLayerVisible 
            ? 'rgba(255, 107, 53, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)';
        }
      }}
      title={!hotspotLayer 
        ? "No hotspot layer available" 
        : isLayerVisible 
          ? "Hide Hotspot Layer" 
          : "Show Hotspot Layer"
      }
    >
      <img src="hotspot_button.svg" alt="" style={{
        filter: !hotspotLayer ? 'grayscale(100%)' : 'none'
      }} />
    </button>
  );
};

export default ToggleHotspotButton;