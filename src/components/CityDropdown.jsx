import React, { useState, useCallback, useMemo } from 'react';
import keralaCitiesData from '../data/kerala_cities.json';

const CityDropdown = ({ selectedDistrict, onSelectionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All Cities');

  // Get cities based on selected district
  const availableCities = useMemo(() => {
    if (!selectedDistrict || selectedDistrict === 'All Districts') {
      // Return all cities from all districts
      const allCities = [];
      Object.values(keralaCitiesData.Kerala).forEach(districtCities => {
        allCities.push(...districtCities);
      });
      return [...new Set(allCities)].sort(); // Remove duplicates and sort
    }
    
    return keralaCitiesData.Kerala[selectedDistrict] || [];
  }, [selectedDistrict]);

  // Reset city selection when district changes
  React.useEffect(() => {
    setSelectedCity('All Cities');
    onSelectionChange?.('All Cities');
  }, [selectedDistrict, onSelectionChange]);

  const handleCitySelect = useCallback((city) => {
    setSelectedCity(city);
    setIsOpen(false);
    onSelectionChange?.(city);
  }, [onSelectionChange]);

  const getDisplayText = () => {
    return selectedCity;
  };

  const isDisabled = !selectedDistrict || selectedDistrict === 'All Districts' ? false : availableCities.length === 0;

  return (
    <div style={{ position: 'static', minWidth: '220px', display: 'flex' }}>
      <div style={{ position: 'relative', display: 'flex', width: '100%' }}>
        <div style={{
          flex: '1',
          padding: '12px 16px',
          backgroundColor: isDisabled ? 'rgba(240, 240, 240, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          color: isDisabled ? '#999' : 'black',
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
          {selectedDistrict && selectedDistrict !== 'All Districts' && (
            <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
              ({availableCities.length})
            </span>
          )}
        </div>
        
        <button 
          onClick={() => !isDisabled && setIsOpen(!isOpen)} 
          disabled={isDisabled}
          style={{
            padding: '12px',
            backgroundColor: isDisabled 
              ? 'rgba(240, 240, 240, 0.95)' 
              : isOpen 
                ? 'rgba(30, 187, 214, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
            color: isDisabled ? '#999' : isOpen ? 'white' : 'black',
            border: '1px solid #ddd',
            borderLeft: 'none',
            borderRadius: '0 8px 8px 0',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            minWidth: '40px'
          }}
        >
          <span style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>▼</span>
        </button>

        {isOpen && !isDisabled && (
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
                fontWeight: selectedCity === 'All Cities' ? 'bold' : 'normal',
                backgroundColor: selectedCity === 'All Cities' ? '#f8f9fa' : 'transparent'
              }}
              onClick={() => handleCitySelect('All Cities')}
            >
              <span>All Cities ({availableCities.length})</span>
              {selectedCity === 'All Cities' && (
                <span style={{ color: '#1EBBD6', fontWeight: 'bold' }}>✓</span>
              )}
            </div>
            {availableCities.map((city, index) => (
              <div
                key={city}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  borderBottom: index === availableCities.length - 1 ? 'none' : '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: selectedCity === city ? 'bold' : 'normal',
                  backgroundColor: selectedCity === city ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => handleCitySelect(city)}
              >
                <span>{city}</span>
                {selectedCity === city && (
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

export default CityDropdown;