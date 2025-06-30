import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const ToggleLayerButton = () => {
  const dispatch = useDispatch();
  const [isLayerVisible, setIsLayerVisible] = useState(false);
  
  // Get Kepler.gl state to check actual layer visibility
  const keplerState = useSelector(state => state.keplerGl?.map);

  // Sync button state with actual layer visibility
  useEffect(() => {
    if (keplerState && keplerState.visState && keplerState.visState.layers) {
      const cityLayer = keplerState.visState.layers.find(layer => 
        layer.config.label === 'City Boundaries' ||
        (layer.type === 'geojson' && layer.config.dataId.includes('geojson-data'))
      );
      
      if (cityLayer) {
        setIsLayerVisible(cityLayer.config.isVisible);
      }
    }
  }, [keplerState]);

  const handleToggleLayer = () => {
    const newVisibility = !isLayerVisible;
    
    console.log('Toggle city boundaries:', newVisibility);
    
    dispatch({ 
      type: 'TOGGLE_GEOJSON_VISIBILITY', 
      payload: { isVisible: newVisibility } 
    });
    
    setIsLayerVisible(newVisibility);
  };

  return (
    <button
      onClick={handleToggleLayer}
      style={{
        width: '35px',
        height: '35px',
        backgroundColor: isLayerVisible ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        border: 'none',
        borderRadius: '17.5px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(4px)',
        padding: '6px'
      }}
      onMouseOver={(e) => {
        e.target.style.transform = 'scale(1.05)';
        if (!isLayerVisible) {
          e.target.style.backgroundColor = 'rgba(30, 187, 214, 0.9)';
        }
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.backgroundColor = isLayerVisible 
          ? 'rgba(76, 175, 80, 0.9)' 
          : 'rgba(255, 255, 255, 0.9)';
      }}
      title={isLayerVisible ? "Hide City Boundaries" : "Show City Boundaries"}
    >
      <img src="building_button.svg" alt="" />
    </button>
  );
};

export default ToggleLayerButton;