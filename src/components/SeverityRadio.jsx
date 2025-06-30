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
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <h4 style={{
          margin: '0',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#333',
          minWidth: '80px'
        }}>
          Severity Levels:
        </h4>
        <div style={{ fontSize: '11px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  const totalCount = SEVERITY_LEVELS.reduce((sum, severity) => 
    sum + (severityCounts[severity] || 0), 0
  );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <h4 style={{
        margin: '0',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#333',
        minWidth: '80px'
      }}>
        Severity Levels:
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* All Levels option */}
        <label 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '11px',
            color: '#333'
          }}
          onClick={() => handleSeverityChange('All Levels')}
        >
          <div style={{
            width: '14px',
            height: '14px',
            border: '1px solid #000',
            borderRadius: '2px',
            marginRight: '6px',
            backgroundColor: selectedSeverities.includes('All Levels') ? '#28a745' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {selectedSeverities.includes('All Levels') && (
              <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>
            )}
          </div>
          <span>
            All Levels ({totalCount})
          </span>
        </label>
        
        {/* Individual severity levels */}
        {SEVERITY_LEVELS.map((severity) => (
          <label 
            key={severity} 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '11px',
              color: '#333'
            }}
            onClick={() => handleSeverityChange(severity)}
          >
            <div style={{
              width: '14px',
              height: '14px',
              border: '1px solid #000',
              borderRadius: '2px',
              marginRight: '6px',
              backgroundColor: selectedSeverities.includes(severity) ? '#28a745' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selectedSeverities.includes(severity) && (
                <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>
              )}
            </div>
            <span>
              {severity} ({severityCounts[severity] || 0})
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default SeverityRadio;