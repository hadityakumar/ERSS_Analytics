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

  const getDisplayText = () => {
    return selectedDistrict;
  };

  return (
    <div style={{ position: 'static', minWidth: '220px', display: 'flex', marginBottom: '4px' }}>
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
            <div
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: selectedDistrict === 'All Districts' ? 'bold' : 'normal',
                backgroundColor: selectedDistrict === 'All Districts' ? '#f8f9fa' : 'transparent'
              }}
              onClick={() => handleDistrictSelect('All Districts')}
            >
              <span>All Districts</span>
              {selectedDistrict === 'All Districts' && (
                <span style={{ color: '#1EBBD6', fontWeight: 'bold' }}>✓</span>
              )}
            </div>
            {districts.map((district, index) => (
              <div
                key={district}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  borderBottom: index === districts.length - 1 ? 'none' : '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: selectedDistrict === district ? 'bold' : 'normal',
                  backgroundColor: selectedDistrict === district ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => handleDistrictSelect(district)}
              >
                <span>{district}</span>
                {selectedDistrict === district && (
                  <span style={{ color: '#1EBBD6', fontWeight: 'bold' }}>✓</span>
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