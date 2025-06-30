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
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={isLayerVisible ? "#ffffff" : "#333333"}
        strokeWidth="2"
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </button>
  );
};

export default ToggleLayerButton;