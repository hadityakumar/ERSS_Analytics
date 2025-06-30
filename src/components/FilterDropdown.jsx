import React, { useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFilter, setFilter, removeFilter } from '@kepler.gl/actions';
import crimeTypesData from '../data/crimeTypes.json';

const FILTER_FIELD_NAME = 'ahp_weighted_event_types_main_type';

const FilterDropdown = ({ onSelectionChange }) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(['All Types']);

  const datasets = useSelector(state => state.keplerGl?.map?.visState?.datasets);
  const reduxFilters = useSelector(state => state.keplerGl?.map?.visState?.filters);

  const datasetInfo = useMemo(() => {
    if (!datasets || Object.keys(datasets).length === 0) return null;
    
    const datasetId = Object.keys(datasets)[0];
    const dataset = datasets[datasetId];
    
    return {
      datasetId,
      fieldIndex: dataset.fields?.findIndex(f => f.name === FILTER_FIELD_NAME),
      totalCount: dataset.dataContainer?._rows?.length || 0,
      dataset
    };
  }, [datasets]);

  const typeCounts = useMemo(() => {
    if (!datasetInfo || datasetInfo.fieldIndex === -1) return {};
    
    const counts = {};
    crimeTypesData.crimeTypes.forEach(type => {
      let count = 0;
      if (datasetInfo.dataset?.getValue) {
        for (let i = 0; i < datasetInfo.dataset.length; i++) {
          if (datasetInfo.dataset.getValue(FILTER_FIELD_NAME, i) === type) count++;
        }
      }
      counts[type] = count;
    });
    return counts;
  }, [datasetInfo]);

  const clearAllFilters = useCallback(() => {
    const currentFilters = reduxFilters || [];
    for (let i = currentFilters.length - 1; i >= 0; i--) {
      dispatch(removeFilter(i, 'map'));
    }
  }, [reduxFilters, dispatch]);

  const createFilter = useCallback((filterValues) => {
    if (!datasetInfo || datasetInfo.fieldIndex === -1 || !filterValues.length) return;
    
    clearAllFilters();
    
    setTimeout(() => {
      dispatch(addFilter(datasetInfo.datasetId, 'map'));
      
      setTimeout(() => {
        dispatch(setFilter(0, 'fieldIdx', [datasetInfo.fieldIndex], 'map'));
        dispatch(setFilter(0, 'name', [FILTER_FIELD_NAME], 'map'));
        dispatch(setFilter(0, 'type', 'multiSelect', 'map'));
        dispatch(setFilter(0, 'value', filterValues, 'map'));
        dispatch(setFilter(0, 'enabled', true, 'map'));
      }, 100);
    }, 200);
  }, [datasetInfo, dispatch, clearAllFilters]);

  const handleTypeSelect = useCallback((type) => {
    let newSelectedTypes;
    
    if (type === 'All Types') {
      newSelectedTypes = ['All Types'];
      clearAllFilters();
    } else {
      if (selectedTypes.includes('All Types')) {
        newSelectedTypes = [type];
        createFilter([type]); 
      } else if (selectedTypes.includes(type)) {
        newSelectedTypes = selectedTypes.filter(t => t !== type);
        
        if (newSelectedTypes.length === 0) {
          newSelectedTypes = ['All Types'];
          clearAllFilters();
        } else {
          createFilter(newSelectedTypes);
        }
      } else {
        newSelectedTypes = [...selectedTypes, type];
        createFilter(newSelectedTypes);
      }
    }
    
    setSelectedTypes(newSelectedTypes);
    onSelectionChange?.(newSelectedTypes);
  }, [selectedTypes, clearAllFilters, createFilter, onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    setSelectedTypes(['All Types']);
    clearAllFilters();
    onSelectionChange?.(['All Types']);
  }, [clearAllFilters, onSelectionChange]);

  const getDisplayText = () => {
    if (selectedTypes.includes('All Types')) return 'All Types';
    if (selectedTypes.length === 1) return selectedTypes[0];
    if (selectedTypes.length <= 3) return selectedTypes.join(', ');
    return `${selectedTypes.length} types selected`;
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
          Main Types:
        </h4>
        <div style={{ fontSize: '11px', color: '#666', flex: '1' }}>Loading...</div>
      </div>
    );
  }

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
        Main Types:
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
            zIndex: 1001,
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
                backgroundColor: selectedTypes.includes('All Types') ? '#f0f0f0' : 'transparent'
              }}
              onClick={() => handleTypeSelect('All Types')}
            >
              <span>All Types ({datasetInfo.totalCount})</span>
              {selectedTypes.includes('All Types') && (
                <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
              )}
            </div>
            {crimeTypesData.crimeTypes.map((type, index) => (
              <div
                key={type}
                style={{
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderBottom: index === crimeTypesData.crimeTypes.length - 1 ? 'none' : '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: selectedTypes.includes(type) ? '#f0f0f0' : 'transparent'
                }}
                onClick={() => handleTypeSelect(type)}
              >
                <span>{type} ({typeCounts[type] || 0})</span>
                {selectedTypes.includes(type) && (
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

export default FilterDropdown;