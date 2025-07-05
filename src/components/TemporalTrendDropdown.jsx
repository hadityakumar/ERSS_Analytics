import React, { useState, useCallback } from 'react';
import Dropdown from './Dropdown'; // Use your shared Dropdown component

const trendTypes = ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

const TemporalTrendDropdown = ({ onSelectionChange }) => {
  const [selectedTrendType, setSelectedTrendType] = useState('Hourly'); // Default is now 'Hourly'

  const handleTypeSelect = useCallback((type) => {
    setSelectedTrendType(type);
    onSelectionChange?.(type);
  }, [onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    setSelectedTrendType('Hourly');
    onSelectionChange?.('Hourly');
  }, [onSelectionChange]);

  const options = trendTypes.map(type => ({
    value: type,
    label: type
  }));

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
        Temporal Trend:
      </h4>
      <Dropdown
        options={options}
        selected={[selectedTrendType]}
        onSelect={handleTypeSelect}
        clearable={true}
        onClear={handleClearSelection}
        placeholder="Hourly"
        width="100%"
        renderSelected={selected => selected && selected[0]}
        renderOption={option => option.label}
        disabled={false}
      />
    </div>
  );
};

export default TemporalTrendDropdown;
