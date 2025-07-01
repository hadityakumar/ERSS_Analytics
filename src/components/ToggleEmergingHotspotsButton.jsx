import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ACTION_TYPES } from '../middleware/utils/constants';

const ToggleEmergingHotspotsButton = () => {
  const dispatch = useDispatch();
  const [isLayerVisible, setIsLayerVisible] = useState(false);
  
  // Monitor Kepler.gl state for emerging hotspots layers
  const keplerState = useSelector(state => state.keplerGl?.map);
  const layers = keplerState?.visState?.layers || [];
  
  // Find emerging hotspots layer
  const emergingHotspotsLayer = layers.find(layer => 
    layer.config?.label?.includes('Emerging Hotspots') ||
    layer.id?.includes('emerging_hotspots') ||
    (layer.config?.label?.includes('Emerging') && layer.config?.label?.includes('Hotspot'))
  );

  // Update visibility state when emerging hotspots layer is added or visibility changes
  useEffect(() => {
    if (emergingHotspotsLayer) {
      setIsLayerVisible(emergingHotspotsLayer.config.isVisible);
    } else {
      setIsLayerVisible(false);
    }
  }, [emergingHotspotsLayer]);

  const handleToggleLayer = () => {
    if (!emergingHotspotsLayer) {
      alert('No emerging hotspots layer found. Please run emerging hotspots analysis first.');
      return;
    }

    const newVisibility = !isLayerVisible;
    
    // Use the layer handler action
    dispatch({ 
      type: ACTION_TYPES.TOGGLE_EMERGING_HOTSPOTS_VISIBILITY, 
      payload: { isVisible: newVisibility }
    });
    
    setIsLayerVisible(newVisibility);
  };

  return (
    <button
      onClick={handleToggleLayer}
      disabled={!emergingHotspotsLayer}
      style={{
        width: '35px',
        height: '35px',
        backgroundColor: !emergingHotspotsLayer 
          ? 'rgba(128, 128, 128, 0.5)' 
          : isLayerVisible 
            ? 'rgba(138, 43, 226, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)',
        border: 'none',
        borderRadius: '17.5px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        cursor: !emergingHotspotsLayer ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(4px)',
        padding: '6px',
        opacity: !emergingHotspotsLayer ? 0.5 : 1
      }}
      onMouseOver={(e) => {
        if (emergingHotspotsLayer) {
          e.target.style.transform = 'scale(1.05)';
          if (!isLayerVisible) {
            e.target.style.backgroundColor = 'rgba(186, 85, 211, 0.9)';
          }
        }
      }}
      onMouseOut={(e) => {
        if (emergingHotspotsLayer) {
          e.target.style.transform = 'scale(1)';
          e.target.style.backgroundColor = isLayerVisible 
            ? 'rgba(138, 43, 226, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)';
        }
      }}
      title={!emergingHotspotsLayer 
        ? "No emerging hotspots layer available" 
        : isLayerVisible 
          ? "Hide Emerging Hotspots Layer" 
          : "Show Emerging Hotspots Layer"
      }
    >
      <img src="emerging_hotspot_button.svg" alt="" style={{
        filter: !emergingHotspotsLayer ? 'grayscale(100%)' : 'none'
      }} />
    </button>
  );
};

export default ToggleEmergingHotspotsButton;