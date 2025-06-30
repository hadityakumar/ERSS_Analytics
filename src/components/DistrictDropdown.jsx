import React, { useState, useCallback } from 'react';
import keralaCitiesData from '../data/kerala_cities.json';

const DistrictDropdown = ({ onSelectionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');

  // Get all districts from the Kerala data
  const districts = Object.keys(keralaCitiesData.Kerala);

  const handleDistrictSelect = useCallback((district) => {
    setSelectedDistrict(district);
    setIsOpen(false);
    onSelectionChange?.(district);
  }, [onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    setSelectedDistrict('All Districts');
    onSelectionChange?.('All Districts');
  }, [onSelectionChange]);

  const getDisplayText = () => {
    return selectedDistrict;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
      <h4 style={{
        margin: '0',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#333',
        width: '80px',
        flexShrink: 0
      }}>
        District:
      </h4>
      
      <div style={{ position: 'relative', flex: '1', width: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Main dropdown container - Fixed width */}
          <div style={{
            width: 'calc(100% - 28px)', // Fixed width minus clear button and gap
            display: 'flex',
            backgroundColor: '#fff',
            border: '1px solid #000',
            borderRadius: '3px'
          }}>
            {/* Display text area */}
            <div style={{
              flex: '1',
              padding: '6px 8px',
              fontSize: '12px',
              color: '#333',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0
            }}>
              {getDisplayText()}
            </div>
            
            {/* Dropdown button */}
            <button onClick={() => setIsOpen(!isOpen)} style={{
              padding: '6px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#333',
              flexShrink: 0
            }}>
              <span style={{ 
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                display: 'inline-block'
              }}>▼</span>
            </button>
          </div>

          {/* Clear button (X) - Fixed position */}
          <button 
            onClick={handleClearSelection}
            style={{
              marginLeft: '4px',
              width: '24px',
              height: '24px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title="Clear selection"
          >
            ×
          </button>
        </div>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #000',
            borderRadius: '3px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1001,
            marginTop: '2px'
          }}>
            <div
              style={{
                padding: '6px 8px',
                cursor: 'pointer',
                fontSize: '12px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: selectedDistrict === 'All Districts' ? '#f0f0f0' : 'transparent'
              }}
              onClick={() => handleDistrictSelect('All Districts')}
            >
              <span>All Districts</span>
              {selectedDistrict === 'All Districts' && (
                <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
              )}
            </div>
            {districts.map((district, index) => (
              <div
                key={district}
                style={{
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderBottom: index === districts.length - 1 ? 'none' : '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: selectedDistrict === district ? '#f0f0f0' : 'transparent'
                }}
                onClick={() => handleDistrictSelect(district)}
              >
                <span>{district}</span>
                {selectedDistrict === district && (
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
            ))}
          </div>
        )}        
      </div>
    </div>
  );
};

export default DistrictDropdown;