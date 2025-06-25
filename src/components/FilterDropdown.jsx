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

  const getDisplayText = () => {
    if (selectedTypes.includes('All Types')) return 'All Types';
    if (selectedTypes.length === 1) return selectedTypes[0];
    if (selectedTypes.length <= 3) return selectedTypes.join(', ');
    return `${selectedTypes.length} types selected`;
  };

  if (!datasetInfo) {
    return (
      <div style={{ minWidth: '220px', display: 'flex' }}>
        <div style={{ flex: 1, padding: '12px 16px', opacity: 0.6 }}>Initializing...</div>
      </div>
    );
  }

  return (
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
            zIndex: 1001,
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
                fontWeight: selectedTypes.includes('All Types') ? 'bold' : 'normal',
                backgroundColor: selectedTypes.includes('All Types') ? '#f8f9fa' : 'transparent'
              }}
              onClick={() => handleTypeSelect('All Types')}
            >
              <span>All Types ({datasetInfo.totalCount})</span>
              {selectedTypes.includes('All Types') && (
                <span style={{ color: '#1EBBD6', fontWeight: 'bold' }}>✓</span>
              )}
            </div>
            {crimeTypesData.crimeTypes.map((type, index) => (
              <div
                key={type}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  borderBottom: index === crimeTypesData.crimeTypes.length - 1 ? 'none' : '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: selectedTypes.includes(type) ? 'bold' : 'normal',
                  backgroundColor: selectedTypes.includes(type) ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => handleTypeSelect(type)}
              >
                <span>{type} ({typeCounts[type] || 0})</span>
                {selectedTypes.includes(type) && (
                  <span style={{ color: '#1EBBD6', fontWeight: 'bold' }}>✓</span>
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