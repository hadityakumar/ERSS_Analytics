import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

const ToggleCrimePointsButton = () => {
  const dispatch = useDispatch();
  const [isLayerVisible, setIsLayerVisible] = useState(true); // Start as true since crime points are visible by default

  const handleToggleLayer = () => {
    const newVisibility = !isLayerVisible;
    
    dispatch({ 
      type: 'TOGGLE_CRIME_POINTS_VISIBILITY', 
      payload: { isVisible: newVisibility } 
    });
    
    setIsLayerVisible(newVisibility);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '110px', // Position below the city boundaries button
      right: '20px',
      zIndex: 1000
    }}>
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
        title={isLayerVisible ? "Hide Crime Points" : "Show Crime Points"}
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
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6M12 17v6M23 12h-6M7 12H1" />
        </svg>
      </button>
    </div>
  );
};

export default ToggleCrimePointsButton;