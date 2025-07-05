import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

const SEVERITY_FIELD_NAME = 'ahp_weighted_event_types_label'; 
const MAIN_TYPE_FIELD_NAME = 'ahp_weighted_event_types_main_type';
const SUBTYPE_FIELD_NAME = 'ahp_weighted_event_types_sub_type';
const SEVERITY_LEVELS = ['LOW', 'HIGH', 'MEDIUM', 'EMERGENCY'];

const SeverityRadio = ({ selectedMainTypes, selectedSubtypes, onSelectionChange }) => {
  const [selectedSeverities, setSelectedSeverities] = useState(['All Levels']);

  const datasets = useSelector(state => state.keplerGl?.map?.visState?.datasets);

  const datasetInfo = useMemo(() => {
    if (!datasets || Object.keys(datasets).length === 0) return null;
    const datasetId = Object.keys(datasets)[0];
    const dataset = datasets[datasetId];
    return {
      datasetId,
      fieldIndex: dataset.fields?.findIndex(f => f.name === SEVERITY_FIELD_NAME),
      mainTypeFieldIndex: dataset.fields?.findIndex(f => f.name === MAIN_TYPE_FIELD_NAME),
      subtypeFieldIndex: dataset.fields?.findIndex(f => f.name === SUBTYPE_FIELD_NAME),
      totalCount: dataset.dataContainer?._rows?.length || 0,
      dataset
    };
  }, [datasets]);

  useEffect(() => {
    setSelectedSeverities(['All Levels']);
    onSelectionChange?.(['All Levels']);
  }, [selectedMainTypes, selectedSubtypes, onSelectionChange]);

  const severityCounts = useMemo(() => {
    if (!datasetInfo || datasetInfo.fieldIndex === -1) return {};
    const counts = { LOW: 0, HIGH: 0, MEDIUM: 0, EMERGENCY: 0 };
    if (datasetInfo.dataset?.getValue) {
      for (let i = 0; i < datasetInfo.dataset.length; i++) {
        const severityValue = datasetInfo.dataset.getValue(SEVERITY_FIELD_NAME, i);
        const mainTypeValue = datasetInfo.dataset.getValue(MAIN_TYPE_FIELD_NAME, i);
        const subtypeValue = datasetInfo.dataset.getValue(SUBTYPE_FIELD_NAME, i);
        let matchesMainType = true;
        if (selectedMainTypes && !selectedMainTypes.includes('All Types')) {
          matchesMainType = selectedMainTypes.includes(mainTypeValue);
        }
        let matchesSubtype = true;
        if (selectedSubtypes && !selectedSubtypes.includes('All Subtypes')) {
          matchesSubtype = selectedSubtypes.includes(subtypeValue);
        }
        if (matchesMainType && matchesSubtype && counts.hasOwnProperty(severityValue)) {
          counts[severityValue]++;
        }
      }
    }
    return counts;
  }, [datasetInfo, selectedMainTypes, selectedSubtypes]);

  const handleSeverityChange = useCallback((severity) => {
    let newSelectedSeverities;
    if (severity === 'All Levels') {
      newSelectedSeverities = ['All Levels'];
    } else {
      if (selectedSeverities.includes('All Levels')) {
        newSelectedSeverities = [severity];
      } else if (selectedSeverities.includes(severity)) {
        newSelectedSeverities = selectedSeverities.filter(s => s !== severity);
        if (newSelectedSeverities.length === 0) {
          newSelectedSeverities = ['All Levels'];
        }
      } else {
        newSelectedSeverities = [...selectedSeverities, severity];
      }
    }
    setSelectedSeverities(newSelectedSeverities);
    onSelectionChange?.(newSelectedSeverities);
  }, [selectedSeverities, onSelectionChange]);

  if (!datasetInfo) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
        <h4 style={{
          margin: '0x',
          fontSize: '10..5px',
          fontWeight: 'bold',
          color: '#333',
          minWidth: '80px'
        }}>
          Severity Levels:
        </h4>
        <div style={{ fontSize: '10.5px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  const totalCount = Object.values(severityCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <h4 style={{
        margin: '0',
        fontSize: '11.5px',
        fontWeight: 'bold',
        color: '#333',
        minWidth: '80px'
      }}>
        Severity Levels
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 70px',
          gridTemplateRows: '1fr 1fr',
          gap: '2px 12px',
          minWidth: '240px',
          alignItems: 'center',
          justifyItems: 'start'
        }}
      >
        {/* Row 1 */}
        <SeverityButton
          checked={selectedSeverities.includes('LOW')}
          label={`Low (${severityCounts['LOW'] || 0})`}
          onClick={() => handleSeverityChange('LOW')}
        />
        <SeverityButton
          checked={selectedSeverities.includes('HIGH')}
          label={`High (${severityCounts['HIGH'] || 0})`}
          onClick={() => handleSeverityChange('HIGH')}
        />
        {/* All Levels button, centered vertically across both rows */}
        <SeverityButton
          checked={selectedSeverities.includes('All Levels')}
          label={`All (${totalCount})`}
          onClick={() => handleSeverityChange('All Levels')}
          style={{
            gridRow: '1 / span 2',
            gridColumn: 3,
            justifySelf: 'center'
          }}
        />
        {/* Row 2 */}
        <SeverityButton
          checked={selectedSeverities.includes('MEDIUM')}
          label={`Medium (${severityCounts['MEDIUM'] || 0})`}
          onClick={() => handleSeverityChange('MEDIUM')}
        />
        <SeverityButton
          checked={selectedSeverities.includes('EMERGENCY')}
          label={`Emergency (${severityCounts['EMERGENCY'] || 0})`}
          onClick={() => handleSeverityChange('EMERGENCY')}
        />
        {/* (empty cell in grid, handled by gridRow/span above) */}
      </div>
    </div>
  );
};

const SeverityButton = ({ checked, label, onClick, style = {} }) => (
  <label
    style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: '10px',
      color: '#333',
      userSelect: 'none',
      gap: '7px',
      ...style
    }}
    onClick={onClick}
  >
    <span style={{
      width: 9,
      height: 9,
      minWidth: 6,
      minHeight: 6,
      border: checked ? 'none' : '2px solid #000',
      borderRadius: '3px',
      background: checked ? '#28a745' : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '14px',
      transition: 'background 0.15s, border 0.15s'
    }}>
      {checked && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
    </span>
    <span>{label}</span>
  </label>
);


export default SeverityRadio;
