import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFilter, setFilter, removeFilter } from '@kepler.gl/actions';
import crimeTypesData from '../data/crimeTypes.json';

const SUBTYPE_FIELD_NAME = 'ahp_weighted_event_types_sub_type';
const MAIN_TYPE_FIELD_NAME = 'ahp_weighted_event_types_main_type';

const SubtypeDropdown = ({ selectedMainTypes, onSelectionChange }) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSubtypes, setSelectedSubtypes] = useState(['All Subtypes']);

  const datasets = useSelector(state => state.keplerGl?.map?.visState?.datasets);
  const reduxFilters = useSelector(state => state.keplerGl?.map?.visState?.filters);

  const datasetInfo = useMemo(() => {
    if (!datasets || Object.keys(datasets).length === 0) return null;
    
    const datasetId = Object.keys(datasets)[0];
    const dataset = datasets[datasetId];
    
    return {
      datasetId,
      subtypeFieldIndex: dataset.fields?.findIndex(f => f.name === SUBTYPE_FIELD_NAME),
      mainTypeFieldIndex: dataset.fields?.findIndex(f => f.name === MAIN_TYPE_FIELD_NAME),
      totalCount: dataset.dataContainer?._rows?.length || 0,
      dataset
    };
  }, [datasets]);

  const availableSubtypes = useMemo(() => {
    if (!selectedMainTypes || selectedMainTypes.includes('All Types')) {
      const allSubtypes = Object.values(crimeTypesData.event_sub_type).flat();
      return [...new Set(allSubtypes)].sort();
    }
    
    const subtypeSet = new Set();
    selectedMainTypes.forEach(mainType => {
      if (crimeTypesData.event_sub_type[mainType]) {
        crimeTypesData.event_sub_type[mainType].forEach(subtype => subtypeSet.add(subtype));
      }
    });
    
    return Array.from(subtypeSet).sort();
  }, [selectedMainTypes]);

  const subtypeCounts = useMemo(() => {
    if (!datasetInfo || datasetInfo.subtypeFieldIndex === -1) return {};
    
    const counts = {};
    availableSubtypes.forEach(subtype => {
      let count = 0;
      if (datasetInfo.dataset?.getValue) {
        for (let i = 0; i < datasetInfo.dataset.length; i++) {
          if (datasetInfo.dataset.getValue(SUBTYPE_FIELD_NAME, i) === subtype) count++;
        }
      }
      counts[subtype] = count;
    });
    return counts;
  }, [datasetInfo, availableSubtypes]);

  useEffect(() => {
    setSelectedSubtypes(['All Subtypes']);
  }, [selectedMainTypes]);

  const reapplyMainTypeFilter = useCallback(() => {
    if (!datasetInfo || selectedMainTypes.includes('All Types')) {
      // Clear all filters
      const currentFilters = reduxFilters || [];
      for (let i = currentFilters.length - 1; i >= 0; i--) {
        dispatch(removeFilter(i, 'map'));
      }
      return;
    }

    // Clear all filters and recreate main type filter
    const currentFilters = reduxFilters || [];
    for (let i = currentFilters.length - 1; i >= 0; i--) {
      dispatch(removeFilter(i, 'map'));
    }

    setTimeout(() => {
      dispatch(addFilter(datasetInfo.datasetId, 'map'));
      
      setTimeout(() => {
        dispatch(setFilter(0, 'fieldIdx', [datasetInfo.mainTypeFieldIndex], 'map'));
        dispatch(setFilter(0, 'name', [MAIN_TYPE_FIELD_NAME], 'map'));
        dispatch(setFilter(0, 'type', 'multiSelect', 'map'));
        dispatch(setFilter(0, 'value', selectedMainTypes, 'map'));
        dispatch(setFilter(0, 'enabled', true, 'map'));
      }, 100);
    }, 200);
  }, [datasetInfo, selectedMainTypes, reduxFilters, dispatch]);

  const createSubtypeFilter = useCallback((filterValues) => {
    if (!datasetInfo || datasetInfo.subtypeFieldIndex === -1 || !filterValues.length) return;
    
    // First, reapply main type filter to ensure it exists
    reapplyMainTypeFilter();
    
    // Then add subtype filter
    setTimeout(() => {
      dispatch(addFilter(datasetInfo.datasetId, 'map'));
      
      setTimeout(() => {
        // Subtype filter will be at index 1 (after main type filter at index 0)
        dispatch(setFilter(1, 'fieldIdx', [datasetInfo.subtypeFieldIndex], 'map'));
        dispatch(setFilter(1, 'name', [SUBTYPE_FIELD_NAME], 'map'));
        dispatch(setFilter(1, 'type', 'multiSelect', 'map'));
        dispatch(setFilter(1, 'value', filterValues, 'map'));
        dispatch(setFilter(1, 'enabled', true, 'map'));
      }, 100);
    }, 300); // Wait for main type filter to be applied first
  }, [datasetInfo, reapplyMainTypeFilter, dispatch]);

  const handleSubtypeSelect = useCallback((subtype) => {
    let newSelectedSubtypes;
    
    if (subtype === 'All Subtypes') {
      newSelectedSubtypes = ['All Subtypes'];
      reapplyMainTypeFilter();
    } else {
      if (selectedSubtypes.includes('All Subtypes')) {
        newSelectedSubtypes = [subtype];
        createSubtypeFilter([subtype]);
      } else if (selectedSubtypes.includes(subtype)) {
        newSelectedSubtypes = selectedSubtypes.filter(s => s !== subtype);
        
        if (newSelectedSubtypes.length === 0) {
          newSelectedSubtypes = ['All Subtypes'];
          reapplyMainTypeFilter();
        } else {
          createSubtypeFilter(newSelectedSubtypes);
        }
      } else {
        newSelectedSubtypes = [...selectedSubtypes, subtype];
        createSubtypeFilter(newSelectedSubtypes);
      }
    }
    
    setSelectedSubtypes(newSelectedSubtypes);
    onSelectionChange?.(newSelectedSubtypes);
  }, [selectedSubtypes, reapplyMainTypeFilter, createSubtypeFilter, onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    setSelectedSubtypes(['All Subtypes']);
    reapplyMainTypeFilter();
    onSelectionChange?.(['All Subtypes']);
  }, [reapplyMainTypeFilter, onSelectionChange]);

  const getDisplayText = () => {
    if (selectedSubtypes.includes('All Subtypes')) return 'All Subtypes';
    if (selectedSubtypes.length === 1) return selectedSubtypes[0];
    if (selectedSubtypes.length <= 3) return selectedSubtypes.join(', ');
    return `${selectedSubtypes.length} subtypes selected`;
  };

  if (!datasetInfo) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
        <h4 style={{
          margin: '0',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#333',
          width: '80px',
          flexShrink: 0
        }}>
          Subtypes:
        </h4>
        <div style={{ fontSize: '11px', color: '#666', flex: '1' }}>Loading...</div>
      </div>
    );
  }

  const totalAvailableCount = availableSubtypes.reduce((sum, subtype) => 
    sum + (subtypeCounts[subtype] || 0), 0
  );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
      <h4 style={{
        margin: '0',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#333',
        width: '80px',
        flexShrink: 0
      }}>
        Subtypes:
      </h4>
      
      <div style={{ position: 'relative', flex: '1', width: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Main dropdown container - Fixed width */}
          <div style={{
            width: 'calc(100% - 28px)', // Fixed width minus clear button and gap
            display: 'flex',
            backgroundColor: '#fff',
            border: '1px solid #000',
            borderRadius: '3px'
          }}>
            {/* Display text area */}
            <div style={{
              flex: '1',
              padding: '6px 8px',
              fontSize: '12px',
              color: '#333',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0
            }}>
              {getDisplayText()}
            </div>
            
            {/* Dropdown button */}
            <button onClick={() => setIsOpen(!isOpen)} style={{
              padding: '6px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#333',
              flexShrink: 0
            }}>
              <span style={{ 
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                display: 'inline-block'
              }}>▼</span>
            </button>
          </div>

          {/* Clear button (X) - Fixed position */}
          <button 
            onClick={handleClearSelection}
            style={{
              marginLeft: '4px',
              width: '24px',
              height: '24px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title="Clear selection"
          >
            ×
          </button>
        </div>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            border: '1px solid #000',
            borderRadius: '3px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 999,
            marginTop: '2px'
          }}>
            <div
              style={{
                padding: '6px 8px',
                cursor: 'pointer',
                fontSize: '12px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: selectedSubtypes.includes('All Subtypes') ? '#f0f0f0' : 'transparent'
              }}
              onClick={() => handleSubtypeSelect('All Subtypes')}
            >
              <span>All Subtypes ({totalAvailableCount})</span>
              {selectedSubtypes.includes('All Subtypes') && (
                <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
              )}
            </div>
            {availableSubtypes.map((subtype, index) => (
              <div
                key={`${subtype}-${index}`}
                style={{
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderBottom: index === availableSubtypes.length - 1 ? 'none' : '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: selectedSubtypes.includes(subtype) ? '#f0f0f0' : 'transparent'
                }}
                onClick={() => handleSubtypeSelect(subtype)}
              >
                <span>{subtype} ({subtypeCounts[subtype] || 0})</span>
                {selectedSubtypes.includes(subtype) && (
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
            ))}
          </div>
        )}        
      </div>
    </div>
  );
};

export default SubtypeDropdown;