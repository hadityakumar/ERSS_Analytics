import React, { useState, useCallback } from 'react';

const TemporalTrendDropdown = ({ onSelectionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTrendType, setSelectedTrendType] = useState('Hourly');

  // Available temporal trend types
  const trendTypes = ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

  const handleTrendTypeSelect = useCallback((trendType) => {
    setSelectedTrendType(trendType);
    setIsOpen(false);
    onSelectionChange?.(trendType);
  }, [onSelectionChange]);

  const getDisplayText = () => {
    return selectedTrendType;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'black' }}>
        Temporal Trend Type
      </div>
      
      <div style={{ position: 'static', minWidth: '220px', display: 'flex' }}>
        <div style={{ position: 'relative', display: 'flex', width: '100%' }}>
          <div style={{
            flex: '1',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: 'black',
            border: '1px solid #ddd',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '150px'
          }}>
            {getDisplayText()}
          </div>
          
          <button onClick={() => setIsOpen(!isOpen)} style={{
            padding: '12px',
            backgroundColor: isOpen ? 'rgba(30, 187, 214, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            color: isOpen ? 'white' : 'black',
            border: '1px solid #ddd',
            borderLeft: 'none',
            borderRadius: '0 8px 8px 0',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            minWidth: '40px'
          }}>
            <span style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>▼</span>
          </button>

          {isOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1001,
              marginTop: '4px'
            }}>
              {trendTypes.map((trendType, index) => (
                <div
                  key={trendType}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottom: index === trendTypes.length - 1 ? 'none' : '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: selectedTrendType === trendType ? 'bold' : 'normal',
                    backgroundColor: selectedTrendType === trendType ? '#e3f2fd' : 'transparent'
                  }}
                  onClick={() => handleTrendTypeSelect(trendType)}
                >
                  <span>{trendType}</span>
                  {selectedTrendType === trendType && (
                    <span style={{ color: '#1EBBD6', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          )}        
        </div>
      </div>
    </div>
  );
};

export default TemporalTrendDropdown;