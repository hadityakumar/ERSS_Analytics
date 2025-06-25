import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFilter, setFilter, removeFilter } from '@kepler.gl/actions';

const SEVERITY_FIELD_NAME = 'ahp_weighted_event_types_label'; 
const MAIN_TYPE_FIELD_NAME = 'ahp_weighted_event_types_main_type';
const SUBTYPE_FIELD_NAME = 'ahp_weighted_event_types_sub_type';
const SEVERITY_LEVELS = ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'];

const SeverityDropdown = ({ selectedMainTypes, selectedSubtypes }) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSeverities, setSelectedSeverities] = useState(['All Levels']);

  const datasets = useSelector(state => state.keplerGl?.map?.visState?.datasets);
  const reduxFilters = useSelector(state => state.keplerGl?.map?.visState?.filters);

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
  }, [selectedMainTypes, selectedSubtypes]);

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

  const clearSeverityFilters = useCallback(() => {
    const currentFilters = reduxFilters || [];
    for (let i = currentFilters.length - 1; i >= 0; i--) {
      const filter = currentFilters[i];
      if (filter?.name?.[0] === SEVERITY_FIELD_NAME) {
        dispatch(removeFilter(i, 'map'));
      }
    }
  }, [reduxFilters, dispatch]);

  const createFilter = useCallback((filterValues) => {
    if (!datasetInfo || datasetInfo.fieldIndex === -1 || !filterValues.length) return;
    
    // Clear existing severity filters
    clearSeverityFilters();
    
    setTimeout(() => {
      dispatch(addFilter(datasetInfo.datasetId, 'map'));
      
      setTimeout(() => {
        const newFilterIndex = (reduxFilters || []).length;
        dispatch(setFilter(newFilterIndex, 'fieldIdx', [datasetInfo.fieldIndex], 'map'));
        dispatch(setFilter(newFilterIndex, 'name', [SEVERITY_FIELD_NAME], 'map'));
        dispatch(setFilter(newFilterIndex, 'type', 'multiSelect', 'map'));
        dispatch(setFilter(newFilterIndex, 'value', filterValues, 'map'));
        dispatch(setFilter(newFilterIndex, 'enabled', true, 'map'));
      }, 100);
    }, 200);
  }, [datasetInfo, dispatch, clearSeverityFilters, reduxFilters]);

  const handleSeveritySelect = useCallback((severity) => {
    let newSelectedSeverities;
    
    if (severity === 'All Levels') {
      newSelectedSeverities = ['All Levels'];
      clearSeverityFilters();
    } else {
      if (selectedSeverities.includes('All Levels')) {
        newSelectedSeverities = [severity];
        createFilter([severity]); 
      } else if (selectedSeverities.includes(severity)) {
        newSelectedSeverities = selectedSeverities.filter(s => s !== severity);
        
        if (newSelectedSeverities.length === 0) {
          newSelectedSeverities = ['All Levels'];
          clearSeverityFilters();
        } else {
          createFilter(newSelectedSeverities);
        }
      } else {
        newSelectedSeverities = [...selectedSeverities, severity];
        createFilter(newSelectedSeverities);
      }
    }
    
    setSelectedSeverities(newSelectedSeverities);
  }, [selectedSeverities, clearSeverityFilters, createFilter]);

  const getDisplayText = () => {
    if (selectedSeverities.includes('All Levels')) return 'All Levels';
    if (selectedSeverities.length === 1) return selectedSeverities[0];
    if (selectedSeverities.length <= 3) return selectedSeverities.join(', ');
    return `${selectedSeverities.length} levels selected`;
  };

  if (!datasetInfo) {
    return (
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'black' }}>
          Severity Level
        </div>
        <div style={{ minWidth: '220px', display: 'flex' }}>
          <div style={{ flex: 1, padding: '12px 16px', opacity: 0.6 }}>Initializing...</div>
        </div>
      </div>
    );
  }

  const totalCount = SEVERITY_LEVELS.reduce((sum, severity) => 
    sum + (severityCounts[severity] || 0), 0
  );

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'black' }}>
        Severity Level
      </div>
      <div style={{ position: 'static', minWidth: '220px', display: 'flex' }}>
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
              zIndex: 1002,
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
                  fontWeight: selectedSeverities.includes('All Levels') ? 'bold' : 'normal',
                  backgroundColor: selectedSeverities.includes('All Levels') ? '#f8f9fa' : 'transparent'
                }}
                onClick={() => handleSeveritySelect('All Levels')}
              >
                <span>All Levels ({totalCount})</span>
                {selectedSeverities.includes('All Levels') && (
                  <span style={{ color: '#1EBBD6', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
              {SEVERITY_LEVELS.map((severity, index) => (
                <div
                  key={severity}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottom: index === SEVERITY_LEVELS.length - 1 ? 'none' : '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: selectedSeverities.includes(severity) ? 'bold' : 'normal',
                    backgroundColor: selectedSeverities.includes(severity) ? '#e3f2fd' : 'transparent'
                  }}
                  onClick={() => handleSeveritySelect(severity)}
                >
                  <span>{severity} ({severityCounts[severity] || 0})</span>
                  {selectedSeverities.includes(severity) && (
                    <span style={{ color: '#1EBBD6', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          )}        
        </div>
      </div>
    </div>
  );
};

export default SeverityDropdown;