import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFilter, setFilter, removeFilter } from '@kepler.gl/actions';
import crimeTypesData from '../data/crimeTypes.json';

const FILTER_FIELD_NAME = 'ahp_weighted_event_types_main_type';

const FilterDropdown = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('All Types');

  const datasets = useSelector(state => state.keplerGl?.map?.visState?.datasets);
  const reduxFilters = useSelector(state => state.keplerGl?.map?.visState?.filters);

  const crimeTypes = crimeTypesData.crimeTypes;

  const datasetInfo = useMemo(() => {
    if (!datasets || Object.keys(datasets).length === 0) {
      return null;
    }
    const datasetIds = Object.keys(datasets);
    const targetDatasetId = datasetIds[0]; 
    
    if (!targetDatasetId || !datasets[targetDatasetId]) {
      return null;
    }
    const dataset = datasets[targetDatasetId];
    return {
      datasetId: targetDatasetId,
      field: dataset.fields?.find(f => f.name === FILTER_FIELD_NAME),
      fieldIndex: dataset.fields?.findIndex(f => f.name === FILTER_FIELD_NAME),
      data: (dataset.dataContainer && dataset.dataContainer._rows) || [],
      totalCount: (dataset.dataContainer && dataset.dataContainer._rows?.length) || 0,
      dataset
    };
  }, [datasets]);

  const typeCounts = useMemo(() => {
    if (!datasetInfo || datasetInfo.fieldIndex === -1 || !datasetInfo.data?.length) return {};
    const counts = {};
    crimeTypes.forEach(type => {
      let count = 0;
      if (datasetInfo.dataset && typeof datasetInfo.dataset.getValue === 'function' && datasetInfo.dataset.length > 0) {
        for (let i = 0; i < datasetInfo.dataset.length; i++) {
          if (datasetInfo.dataset.getValue(FILTER_FIELD_NAME, i) === type) count++;
        }
      }
      counts[type] = count;
    });
    return counts;
  }, [datasetInfo, crimeTypes]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const currentFilters = reduxFilters || [];
    console.log(`Clearing ${currentFilters.length} filters`);
    
    for (let i = currentFilters.length - 1; i >= 0; i--) {
      dispatch(removeFilter(i, 'map'));
    }
  }, [reduxFilters, dispatch]);

  // Create filter using the original Kepler.gl actions but with proper field reference
  const createFilterFixed = useCallback((filterValue) => {
    if (!datasetInfo || !datasetInfo.field) {
      console.log('Cannot create filter: no dataset info or field');
      return;
    }

    console.log(`Creating filter for "${filterValue}"`);
    console.log('Dataset ID:', datasetInfo.datasetId);
    console.log('Field object:', datasetInfo.field);
    
    // Clear existing filters first
    clearAllFilters();
    
    setTimeout(() => {
      console.log('Adding filter...');
      dispatch(addFilter(datasetInfo.datasetId, 'map'));
      
      setTimeout(() => {
        console.log('Setting filter name using field object...');
        // Try using the complete field object instead of just the name
        dispatch(setFilter(0, 'name', [datasetInfo.field], 'map'));
        
        setTimeout(() => {
          console.log('Setting filter type...');
          dispatch(setFilter(0, 'type', 'multiSelect', 'map'));
          
          setTimeout(() => {
            console.log('Setting filter value...');
            dispatch(setFilter(0, 'value', [filterValue], 'map'));
            
            setTimeout(() => {
              console.log('Enabling filter...');
              dispatch(setFilter(0, 'enabled', true, 'map'));
              
              console.log(`Filter configuration complete for "${filterValue}"`);
              
              // Verification
              setTimeout(() => {
                console.log('=== VERIFICATION ===');
                const currentFilters = reduxFilters || [];
                console.log('Filter count:', currentFilters.length);
                if (currentFilters.length > 0) {
                  const filter = currentFilters[0];
                  console.log('Filter details:', {
                    name: filter.name,
                    type: filter.type,
                    value: filter.value,
                    enabled: filter.enabled,
                    dataId: filter.dataId,
                    fieldIdx: filter.fieldIdx
                  });
                  
                  // Check if filter is properly configured
                  if (Array.isArray(filter.name) && filter.name.length > 0 && 
                      filter.type === 'multiSelect' &&
                      Array.isArray(filter.value) && filter.value.includes(filterValue) &&
                      filter.enabled === true) {
                    console.log('✅ Filter appears to be properly configured');
                  } else {
                    console.log('❌ Filter configuration has issues');
                  }
                }
              }, 1000);
              
            }, 200);
          }, 200);
        }, 200);
      }, 500);
    }, 300);
  }, [datasetInfo, dispatch, clearAllFilters, reduxFilters]);

  // Alternative approach: Try setting the name as the field name string (not array)
  const createFilterAlternative = useCallback((filterValue) => {
    if (!datasetInfo || !datasetInfo.field) {
      console.log('Cannot create filter: no dataset info or field');
      return;
    }

    console.log(`Creating filter alternative approach for "${filterValue}"`);
    
    clearAllFilters();
    
    setTimeout(() => {
      dispatch(addFilter(datasetInfo.datasetId, 'map'));
      
      setTimeout(() => {
        // Try setting name as just the field name string
        console.log('Setting filter name as string:', FILTER_FIELD_NAME);
        dispatch(setFilter(0, 'name', FILTER_FIELD_NAME, 'map'));
        
        setTimeout(() => {
          dispatch(setFilter(0, 'type', 'multiSelect', 'map'));
          
          setTimeout(() => {
            dispatch(setFilter(0, 'value', [filterValue], 'map'));
            
            setTimeout(() => {
              dispatch(setFilter(0, 'enabled', true, 'map'));
              
              console.log(`Alternative filter approach complete for "${filterValue}"`);
              
            }, 100);
          }, 100);
        }, 100);
      }, 300);
    }, 200);
  }, [datasetInfo, dispatch, clearAllFilters]);

  // Try creating filter with dataId array and field index
  const createFilterWithFieldIndex = useCallback((filterValue) => {
    if (!datasetInfo || !datasetInfo.field) {
      console.log('Cannot create filter: no dataset info or field');
      return;
    }

    console.log(`Creating filter with field index for "${filterValue}"`);
    console.log('Field index:', datasetInfo.fieldIndex);
    
    clearAllFilters();
    
    setTimeout(() => {
      dispatch(addFilter(datasetInfo.datasetId, 'map'));
      
      setTimeout(() => {
        // Try setting fieldIdx directly
        dispatch(setFilter(0, 'fieldIdx', [datasetInfo.fieldIndex], 'map'));
        
        setTimeout(() => {
          dispatch(setFilter(0, 'name', [FILTER_FIELD_NAME], 'map'));
          
          setTimeout(() => {
            dispatch(setFilter(0, 'type', 'multiSelect', 'map'));
            
            setTimeout(() => {
              dispatch(setFilter(0, 'value', [filterValue], 'map'));
              
              setTimeout(() => {
                dispatch(setFilter(0, 'enabled', true, 'map'));
                
                console.log(`Field index filter approach complete for "${filterValue}"`);
                
              }, 100);
            }, 100);
          }, 100);
        }, 100);
      }, 300);
    }, 200);
  }, [datasetInfo, dispatch, clearAllFilters]);

  // Handle type selection
  const handleTypeSelect = useCallback((type) => {
    console.log(`handleTypeSelect: User selected type "${type}"`);
    setSelectedType(type);
    setIsOpen(false);
    
    if (type === 'All Types') {
      clearAllFilters();
    } else {
      // Try the field index approach first
      createFilterWithFieldIndex(type);
    }
  }, [clearAllFilters, createFilterWithFieldIndex]);

  // Debug logging
  useEffect(() => {
    if (reduxFilters && reduxFilters.length > 0) {
      console.log(`Active filters count: ${reduxFilters.length}`);
      reduxFilters.forEach((filter, index) => {
        console.log(`Filter ${index}:`, {
          name: filter.name,
          nameType: typeof filter.name,
          nameIsArray: Array.isArray(filter.name),
          type: filter.type,
          value: filter.value,
          enabled: filter.enabled,
          dataId: filter.dataId,
          fieldIdx: filter.fieldIdx
        });
      });
    } else {
      console.log('No filters currently active');
    }
  }, [reduxFilters]);

  // Debug dataset info
  useEffect(() => {
    if (datasetInfo) {
      console.log('Dataset ready:', {
        datasetId: datasetInfo.datasetId,
        fieldExists: !!datasetInfo.field,
        totalCount: datasetInfo.totalCount,
        fieldIndex: datasetInfo.fieldIndex,
        fieldName: FILTER_FIELD_NAME
      });
    }
  }, [datasetInfo]);

  // Styles
  const dropdownStyle = {
    position: 'absolute',
    top: '175px',
    right: '100px',
    zIndex: 1000,
    minWidth: '220px'
  };

  const buttonStyle = {
    padding: '12px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backdropFilter: 'blur(4px)',
    transition: 'all 0.2s ease',
    width: '100%'
  };

  const menuStyle = {
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
  };

  const itemStyle = {
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.15s ease'
  };

  if (!datasetInfo) {
    return (
      <div style={dropdownStyle}>
        <div style={{ ...buttonStyle, cursor: 'not-allowed', opacity: 0.6 }}>
          Initializing...
        </div>
      </div>
    );
  }

  return (
    <div style={dropdownStyle}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            ...buttonStyle,
            backgroundColor: isOpen ? 'rgba(30, 187, 214, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            color: isOpen ? 'white' : 'black'
          }}
        >
          <span style={{ 
            maxWidth: '170px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {selectedType}
          </span>
          <span style={{ 
            marginLeft: '8px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>▼</span>
        </button>

        {isOpen && (
          <div style={menuStyle}>
            <div
              style={{
                ...itemStyle,
                fontWeight: selectedType === 'All Types' ? 'bold' : 'normal',
                backgroundColor: selectedType === 'All Types' ? '#f8f9fa' : 'transparent'
              }}
              onClick={() => handleTypeSelect('All Types')}
            >
              All Types ({datasetInfo.totalCount})
            </div>
            {crimeTypes.map((type, index) => {
              const count = typeCounts[type] || 0;
              return (
                <div
                  key={type}
                  style={{
                    ...itemStyle,
                    borderBottom: index === crimeTypes.length - 1 ? 'none' : '1px solid #f0f0f0',
                    fontWeight: selectedType === type ? 'bold' : 'normal',
                    backgroundColor: selectedType === type ? '#e3f2fd' : 'transparent'
                  }}
                  onClick={() => handleTypeSelect(type)}
                >
                  {type} ({count})
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterDropdown;