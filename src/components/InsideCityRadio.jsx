import React from 'react';

const InsideCityRadio = ({ selectedValue, onSelectionChange }) => {
  const handleRadioChange = (value) => {
    onSelectionChange(value);
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'black' }}>
        Location Filter
      </div>
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '220px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            fontSize: '14px',
            color: 'black'
          }}>
            <input
              type="radio"
              name="cityLocation"
              value="all"
              checked={selectedValue === 'all'}
              onChange={() => handleRadioChange('all')}
              style={{ marginRight: '8px' }}
            />
            All Locations
          </label>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            fontSize: '14px',
            color: 'black'
          }}>
            <input
              type="radio"
              name="cityLocation"
              value="inside"
              checked={selectedValue === 'inside'}
              onChange={() => handleRadioChange('inside')}
              style={{ marginRight: '8px' }}
            />
            Inside City Only
          </label>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            fontSize: '14px',
            color: 'black'
          }}>
            <input
              type="radio"
              name="cityLocation"
              value="outside"
              checked={selectedValue === 'outside'}
              onChange={() => handleRadioChange('outside')}
              style={{ marginRight: '8px' }}
            />
            Outside City Only
          </label>
        </div>
      </div>
    </div>
  );
};

export default InsideCityRadio;