import React, { useState } from 'react';
import Dropdown from './Dropdown';

const RangeDropdown = () => {
  const options = [
    { value: '100m', label: '100m' },
    { value: '500m', label: '500m' },
    { value: '1km', label: '1km' },
    { value: '5km', label: '5km' },
    { value: '10km', label: '10km' }
  ];

  const [selectedRange, setSelectedRange] = useState(null);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
      <h4 style={{
        margin: '0',
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#000',
        width: '80px',
        flexShrink: 0
      }}>
        Range
      </h4>
      <div style={{ width: '100px' }}>
        <Dropdown
          options={options}
          selected={selectedRange ? [selectedRange] : []}
          onSelect={value => setSelectedRange(value)}
          placeholder="Range"
          clearable={true}
          onClear={() => setSelectedRange(null)}
          width="100%"
          renderSelected={selected => selected && selected.length > 0 ? selected[0] : 'Range'}
          renderOption={option => option.label}
        />
      </div>
    </div>
  );
};

export default RangeDropdown;
