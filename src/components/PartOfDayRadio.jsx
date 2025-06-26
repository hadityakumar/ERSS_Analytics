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
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'black' }}>
          Part of Day
        </div>
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

  const totalCount = PART_OF_DAY_CATEGORIES.reduce((sum, partOfDay) => 
    sum + (partOfDayCounts[partOfDay] || 0), 0
  );

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'black' }}>
        Part of Day
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
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'black',
            fontWeight: selectedPartOfDay.includes('All Times') ? 'bold' : 'normal'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={selectedPartOfDay.includes('All Times')}
                onChange={() => handlePartOfDayChange('All Times')}
                style={{ marginRight: '8px' }}
              />
              All Times
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>({totalCount})</span>
          </label>
          
          {PART_OF_DAY_CATEGORIES.map((partOfDay) => (
            <label key={partOfDay} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'black',
              fontWeight: selectedPartOfDay.includes(partOfDay) ? 'bold' : 'normal'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedPartOfDay.includes(partOfDay)}
                  onChange={() => handlePartOfDayChange(partOfDay)}
                  style={{ marginRight: '8px' }}
                />
                {partOfDay}
              </div>
              <span style={{ fontSize: '12px', color: '#666' }}>({partOfDayCounts[partOfDay] || 0})</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartOfDayRadio;