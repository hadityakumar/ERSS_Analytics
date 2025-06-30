import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

const SEVERITY_FIELD_NAME = 'ahp_weighted_event_types_label'; 
const MAIN_TYPE_FIELD_NAME = 'ahp_weighted_event_types_main_type';
const SUBTYPE_FIELD_NAME = 'ahp_weighted_event_types_sub_type';
const SEVERITY_LEVELS = ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'];

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

  // Reset selected severities when main types or subtypes change
  useEffect(() => {
    setSelectedSeverities(['All Levels']);
    onSelectionChange?.(['All Levels']);
  }, [selectedMainTypes, selectedSubtypes, onSelectionChange]);

  // Calculate severity counts based on current main type and subtype selections
  const severityCounts = useMemo(() => {
    if (!datasetInfo || datasetInfo.fieldIndex === -1) return {};
    
    const counts = {};
    SEVERITY_LEVELS.forEach(severity => {
      counts[severity] = 0;
    });

    if (datasetInfo.dataset?.getValue) {
      for (let i = 0; i < datasetInfo.dataset.length; i++) {
        const severityValue = datasetInfo.dataset.getValue(SEVERITY_FIELD_NAME, i);
        const mainTypeValue = datasetInfo.dataset.getValue(MAIN_TYPE_FIELD_NAME, i);
        const subtypeValue = datasetInfo.dataset.getValue(SUBTYPE_FIELD_NAME, i);
        
        // Check if this row matches the current main type filter
        let matchesMainType = true;
        if (selectedMainTypes && !selectedMainTypes.includes('All Types')) {
          matchesMainType = selectedMainTypes.includes(mainTypeValue);
        }
        
        // Check if this row matches the current subtype filter
        let matchesSubtype = true;
        if (selectedSubtypes && !selectedSubtypes.includes('All Subtypes')) {
          matchesSubtype = selectedSubtypes.includes(subtypeValue);
        }
        
        // Only count if it matches both filters and is a valid severity level
        if (matchesMainType && matchesSubtype && SEVERITY_LEVELS.includes(severityValue)) {
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
        // If "All Levels" was selected, replace it with the specific severity
        newSelectedSeverities = [severity];
      } else if (selectedSeverities.includes(severity)) {
        // If severity is already selected, remove it
        newSelectedSeverities = selectedSeverities.filter(s => s !== severity);
        
        // If no severities are selected, default to "All Levels"
        if (newSelectedSeverities.length === 0) {
          newSelectedSeverities = ['All Levels'];
        }
      } else {
        // Add the severity to the selection
        newSelectedSeverities = [...selectedSeverities, severity];
      }
    }
    
    setSelectedSeverities(newSelectedSeverities);
    onSelectionChange?.(newSelectedSeverities);
  }, [selectedSeverities, onSelectionChange]);

  if (!datasetInfo) {
    return (
      <div style={{ marginBottom: '8px' }}>
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '220px',
          opacity: 0.6
        }}>
          Initializing...
        </div>
      </div>
    );
  }

  const totalCount = SEVERITY_LEVELS.reduce((sum, severity) => 
    sum + (severityCounts[severity] || 0), 0
  );

  return (
    <div style={{ marginBottom: '8px' }}>
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
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'black',
            fontWeight: selectedSeverities.includes('All Levels') ? 'bold' : 'normal'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={selectedSeverities.includes('All Levels')}
                onChange={() => handleSeverityChange('All Levels')}
                style={{ marginRight: '8px' }}
              />
              All Levels
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>({totalCount})</span>
          </label>
          
          {SEVERITY_LEVELS.map((severity) => (
            <label key={severity} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'black',
              fontWeight: selectedSeverities.includes(severity) ? 'bold' : 'normal'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedSeverities.includes(severity)}
                  onChange={() => handleSeverityChange(severity)}
                  style={{ marginRight: '8px' }}
                />
                {severity}
              </div>
              <span style={{ fontSize: '12px', color: '#666' }}>({severityCounts[severity] || 0})</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeverityRadio;