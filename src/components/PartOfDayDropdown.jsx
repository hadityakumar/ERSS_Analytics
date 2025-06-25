import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFilter, setFilter, removeFilter } from '@kepler.gl/actions';

const PART_OF_DAY_FIELD_NAME = 'part_of_day';
const MAIN_TYPE_FIELD_NAME = 'ahp_weighted_event_types_main_type';
const SUBTYPE_FIELD_NAME = 'ahp_weighted_event_types_sub_type';
const SEVERITY_FIELD_NAME = 'ahp_weighted_event_types_label';
const PART_OF_DAY_CATEGORIES = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];

const PartOfDayDropdown = ({ selectedMainTypes, selectedSubtypes, selectedSeverities }) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPartOfDay, setSelectedPartOfDay] = useState(['All Times']);

  const datasets = useSelector(state => state.keplerGl?.map?.visState?.datasets);
  const reduxFilters = useSelector(state => state.keplerGl?.map?.visState?.filters);

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
  }, [selectedMainTypes, selectedSubtypes, selectedSeverities]);

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

  const clearPartOfDayFilters = useCallback(() => {
    const currentFilters = reduxFilters || [];
    for (let i = currentFilters.length - 1; i >= 0; i--) {
      const filter = currentFilters[i];
      if (filter?.name?.[0] === PART_OF_DAY_FIELD_NAME) {
        dispatch(removeFilter(i, 'map'));
      }
    }
  }, [reduxFilters, dispatch]);

  const createFilter = useCallback((filterValues) => {
    if (!datasetInfo || datasetInfo.fieldIndex === -1 || !filterValues.length) return;
    
    // Clear existing part of day filters first
    clearPartOfDayFilters();
    
    // Wait for filters to be cleared, then add new filter
    setTimeout(() => {
      dispatch(addFilter(datasetInfo.datasetId, 'map'));
    }, 50);
    
    // Configure the new filter after it's been added
    setTimeout(() => {
      // Get current filters state after adding the new filter
      const currentState = reduxFilters || [];
      // The new filter will be at the end of the array
      const newFilterIndex = currentState.length;
      
      // Set filter properties step by step
      dispatch(setFilter(newFilterIndex, 'dataId', [datasetInfo.datasetId], 'map'));
      dispatch(setFilter(newFilterIndex, 'fieldIdx', [datasetInfo.fieldIndex], 'map'));
      dispatch(setFilter(newFilterIndex, 'name', [PART_OF_DAY_FIELD_NAME], 'map'));
      dispatch(setFilter(newFilterIndex, 'type', 'multiSelect', 'map'));
      dispatch(setFilter(newFilterIndex, 'value', filterValues, 'map'));
      dispatch(setFilter(newFilterIndex, 'enabled', true, 'map'));
    }, 100);
  }, [datasetInfo, dispatch, clearPartOfDayFilters, reduxFilters]);

  const handlePartOfDaySelect = useCallback((partOfDay) => {
    let newSelectedPartOfDay;
    
    if (partOfDay === 'All Times') {
      newSelectedPartOfDay = ['All Times'];
      clearPartOfDayFilters();
    } else {
      if (selectedPartOfDay.includes('All Times')) {
        newSelectedPartOfDay = [partOfDay];
        createFilter([partOfDay]); 
      } else if (selectedPartOfDay.includes(partOfDay)) {
        newSelectedPartOfDay = selectedPartOfDay.filter(p => p !== partOfDay);
        
        if (newSelectedPartOfDay.length === 0) {
          newSelectedPartOfDay = ['All Times'];
          clearPartOfDayFilters();
        } else {
          createFilter(newSelectedPartOfDay);
        }
      } else {
        newSelectedPartOfDay = [...selectedPartOfDay, partOfDay];
        createFilter(newSelectedPartOfDay);
      }
    }
    
    setSelectedPartOfDay(newSelectedPartOfDay);
  }, [selectedPartOfDay, clearPartOfDayFilters, createFilter]);

  const getDisplayText = () => {
    if (selectedPartOfDay.includes('All Times')) return 'All Times';
    if (selectedPartOfDay.length === 1) return selectedPartOfDay[0];
    if (selectedPartOfDay.length <= 3) return selectedPartOfDay.join(', ');
    return `${selectedPartOfDay.length} times selected`;
  };

  if (!datasetInfo) {
    return (
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'black' }}>
          Part of Day
        </div>
        <div style={{ minWidth: '220px', display: 'flex' }}>
          <div style={{ flex: 1, padding: '12px 16px', opacity: 0.6 }}>Initializing...</div>
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
              zIndex: 1003,
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
                  fontWeight: selectedPartOfDay.includes('All Times') ? 'bold' : 'normal',
                  backgroundColor: selectedPartOfDay.includes('All Times') ? '#f8f9fa' : 'transparent'
                }}
                onClick={() => handlePartOfDaySelect('All Times')}
              >
                <span>All Times ({totalCount})</span>
                {selectedPartOfDay.includes('All Times') && (
                  <span style={{ color: '#1EBBD6', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
              {PART_OF_DAY_CATEGORIES.map((partOfDay, index) => (
                <div
                  key={partOfDay}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottom: index === PART_OF_DAY_CATEGORIES.length - 1 ? 'none' : '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: selectedPartOfDay.includes(partOfDay) ? 'bold' : 'normal',
                    backgroundColor: selectedPartOfDay.includes(partOfDay) ? '#e3f2fd' : 'transparent'
                  }}
                  onClick={() => handlePartOfDaySelect(partOfDay)}
                >
                  <span>{partOfDay} ({partOfDayCounts[partOfDay] || 0})</span>
                  {selectedPartOfDay.includes(partOfDay) && (
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

export default PartOfDayDropdown;