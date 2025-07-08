import React, { useState, useCallback } from 'react';
import keralaCitiesData from '../data/kerala_cities.json';
import Dropdown from './Dropdown';

const DistrictDropdown = ({ onSelectionChange }) => {
  const [selectedDistrict, setSelectedDistrict] = useState('Thiruvananthapuram');
  const districts = Object.keys(keralaCitiesData.Kerala);

  const handleDistrictSelect = useCallback((district) => {
    setSelectedDistrict(district);
    onSelectionChange?.(district);
  }, [onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    setSelectedDistrict('All Districts');
    onSelectionChange?.('All Districts');
  }, [onSelectionChange]);

  const options = [
    { value: 'All Districts', label: 'All Districts' },
    ...districts.map(district => ({
      value: district,
      label: district
    }))
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
      <h4 style={{
        margin: '0',
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#00',
        width: '80px',
        flexShrink: 0
      }}>
        District
      </h4>
      <Dropdown
        options={options}
        selected={[selectedDistrict]}
        onSelect={handleDistrictSelect}
        clearable={true}
        onClear={handleClearSelection}
        placeholder="All Districts"
        width="100%"
        renderSelected={selected => selected && selected[0]}
        renderOption={option => option.label}
        disabled={false}
      />
    </div>
  );
};

export default DistrictDropdown;
