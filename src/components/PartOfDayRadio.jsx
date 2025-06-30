import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

const PART_OF_DAY_FIELD_NAME = 'part_of_day';
const MAIN_TYPE_FIELD_NAME = 'ahp_weighted_event_types_main_type';
const SUBTYPE_FIELD_NAME = 'ahp_weighted_event_types_sub_type';
const SEVERITY_FIELD_NAME = 'ahp_weighted_event_types_label';
const PART_OF_DAY_CATEGORIES = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];

const PartOfDayRadio = ({ selectedMainTypes, selectedSubtypes, selectedSeverities, onSelectionChange }) => {
  const [selectedPartOfDay, setSelectedPartOfDay] = useState(['All Times']);

  const datasets = useSelector(state => state.keplerGl?.map?.visState?.datasets);

  const datasetInfo = useMemo(() => {
    if (!datasets || Object.keys(datasets).length === 0) return null;
    
    const datasetId = Object.keys(datasets)[0];
    const dataset = datasets[datasetId];
    
    return {
      datasetId,
      fieldIndex: dataset.fields?.findIndex(f => f.name === PART_OF_DAY_FIELD_NAME),
      mainTypeFieldIndex: dataset.fields?.findIndex(f => f.name === MAIN_TYPE_FIELD_NAME),
      subtypeFieldIndex: dataset.fields?.findIndex(f => f.name === SUBTYPE_FIELD_NAME),
      severityFieldIndex: dataset.fields?.findIndex(f => f.name === SEVERITY_FIELD_NAME),
      totalCount: dataset.dataContainer?._rows?.length || 0,
      dataset
    };
  }, [datasets]);

  // Reset selected part of day when any other filter changes
  useEffect(() => {
    setSelectedPartOfDay(['All Times']);
    onSelectionChange?.(['All Times']);
  }, [selectedMainTypes, selectedSubtypes, selectedSeverities, onSelectionChange]);

  // Calculate part of day counts based on current filter selections
  const partOfDayCounts = useMemo(() => {
    if (!datasetInfo || datasetInfo.fieldIndex === -1) return {};
    
    const counts = {};
    PART_OF_DAY_CATEGORIES.forEach(partOfDay => {
      counts[partOfDay] = 0;
    });

    if (datasetInfo.dataset?.getValue) {
      for (let i = 0; i < datasetInfo.dataset.length; i++) {
        const partOfDayValue = datasetInfo.dataset.getValue(PART_OF_DAY_FIELD_NAME, i);
        const mainTypeValue = datasetInfo.dataset.getValue(MAIN_TYPE_FIELD_NAME, i);
        const subtypeValue = datasetInfo.dataset.getValue(SUBTYPE_FIELD_NAME, i);
        const severityValue = datasetInfo.dataset.getValue(SEVERITY_FIELD_NAME, i);
        
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
        
        // Check if this row matches the current severity filter
        let matchesSeverity = true;
        if (selectedSeverities && !selectedSeverities.includes('All Levels')) {
          matchesSeverity = selectedSeverities.includes(severityValue);
        }
        
        // Only count if it matches all filters and is a valid part of day category
        if (matchesMainType && matchesSubtype && matchesSeverity && PART_OF_DAY_CATEGORIES.includes(partOfDayValue)) {
          counts[partOfDayValue]++;
        }
      }
    }
    
    return counts;
  }, [datasetInfo, selectedMainTypes, selectedSubtypes, selectedSeverities]);

  const handlePartOfDayChange = useCallback((partOfDay) => {
    let newSelectedPartOfDay;
    
    if (partOfDay === 'All Times') {
      newSelectedPartOfDay = ['All Times'];
    } else {
      if (selectedPartOfDay.includes('All Times')) {
        // If "All Times" was selected, replace it with the specific time
        newSelectedPartOfDay = [partOfDay];
      } else if (selectedPartOfDay.includes(partOfDay)) {
        // If time is already selected, remove it
        newSelectedPartOfDay = selectedPartOfDay.filter(p => p !== partOfDay);
        
        // If no times are selected, default to "All Times"
        if (newSelectedPartOfDay.length === 0) {
          newSelectedPartOfDay = ['All Times'];
        }
      } else {
        // Add the time to the selection
        newSelectedPartOfDay = [...selectedPartOfDay, partOfDay];
      }
    }
    
    setSelectedPartOfDay(newSelectedPartOfDay);
    onSelectionChange?.(newSelectedPartOfDay);
  }, [selectedPartOfDay, onSelectionChange]);

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
          Part of Day:
        </h4>
        <div style={{ fontSize: '11px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  const totalCount = PART_OF_DAY_CATEGORIES.reduce((sum, partOfDay) => 
    sum + (partOfDayCounts[partOfDay] || 0), 0
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
        Part of Day:
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* All Times option */}
        <label 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '11px',
            color: '#333'
          }}
          onClick={() => handlePartOfDayChange('All Times')}
        >
          <div style={{
            width: '14px',
            height: '14px',
            border: '1px solid #000',
            borderRadius: '2px',
            marginRight: '6px',
            backgroundColor: selectedPartOfDay.includes('All Times') ? '#28a745' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {selectedPartOfDay.includes('All Times') && (
              <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>
            )}
          </div>
          <span>
            All Times ({totalCount})
          </span>
        </label>
        
        {/* Individual time periods */}
        {PART_OF_DAY_CATEGORIES.map((partOfDay) => (
          <label 
            key={partOfDay} 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '11px',
              color: '#333'
            }}
            onClick={() => handlePartOfDayChange(partOfDay)}
          >
            <div style={{
              width: '14px',
              height: '14px',
              border: '1px solid #000',
              borderRadius: '2px',
              marginRight: '6px',
              backgroundColor: selectedPartOfDay.includes(partOfDay) ? '#28a745' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selectedPartOfDay.includes(partOfDay) && (
                <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>
              )}
            </div>
            <span>
              {partOfDay} ({partOfDayCounts[partOfDay] || 0})
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PartOfDayRadio;