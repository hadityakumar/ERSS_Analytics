import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateVisData } from '@kepler.gl/actions';
import crimeTypesData from '../data/crimeTypes.json';

const FilterDropdown = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('All Types');

  // Use separate selectors to avoid object creation warnings
  const datasets = useSelector(state => state.keplerGl?.map?.visState?.datasets);
  const filters = useSelector(state => state.keplerGl?.map?.visState?.filters);

  // Get crime types from JSON file
  const crimeTypes = crimeTypesData.crimeTypes;

  // Store original data for filtering
  const [originalData, setOriginalData] = useState(null);

  // Memoized dataset info for counts and filtering
  const datasetInfo = useMemo(() => {
    if (!datasets || Object.keys(datasets).length === 0) {
      return null;
    }

    const datasetIds = Object.keys(datasets);
    console.log('Available datasets:', datasetIds);
    console.log('Available filters:', filters);
    
    // Find the main crime dataset
    const crimeDataset = datasetIds.find(id => 
      id.includes('csv-data') || 
      id.includes('Crime') || 
      datasets[id].label?.includes('Crime') ||
      datasets[id].label?.includes('Data')
    ) || datasetIds[0];

    console.log('Selected dataset for filtering:', crimeDataset);

    if (!crimeDataset || !datasets[crimeDataset]) {
      return null;
    }

    const dataset = datasets[crimeDataset];
    
    // Access data through dataContainer instead of allData/data/filteredData
    let actualData = null;
    let dataCount = 0;
    
    if (dataset.dataContainer && dataset.dataContainer._rows) {
      actualData = dataset.dataContainer._rows;
      dataCount = actualData.length;
      console.log('Using dataContainer._rows, count:', dataCount);
    } else if (dataset.length > 0) {
      // Alternative: use the dataset's getValue method to access data
      actualData = [];
      dataCount = dataset.length;
      console.log('Using dataset.getValue method, count:', dataCount);
      
      // Create array representation for easier processing
      for (let i = 0; i < Math.min(dataCount, 1000); i++) { // Limit to first 1000 for performance
        const row = [];
        dataset.fields.forEach(field => {
          row[field.fieldIdx] = dataset.getValue(field.name, i);
        });
        actualData.push(row);
      }
    }

    // Store original data once
    if (actualData && !originalData) {
      setOriginalData({
        fields: dataset.fields,
        rows: actualData
      });
    }

    const field = dataset.fields?.find(
      field => field.name === 'ahp_weighted_event_types_main_type'
    );
    const fieldIndex = dataset.fields?.findIndex(
      field => field.name === 'ahp_weighted_event_types_main_type'
    );

    console.log('Crime type field:', field);
    console.log('Crime type field index:', fieldIndex);
    console.log('Available fields:', dataset.fields?.map(f => f.name) || []);
    
    if (actualData && actualData.length > 0) {
      // Debug: Log some sample data
      console.log('Dataset total rows:', dataCount);
      console.log('First 5 rows of data:', actualData.slice(0, 5));
      console.log('Sample values from crime type field:', 
        actualData.slice(0, 10).map(row => row[fieldIndex])
      );
    }

    return {
      datasetId: crimeDataset,
      field,
      fieldIndex,
      data: actualData || [],
      totalCount: dataCount,
      dataset // Keep reference to the original dataset for getValue method
    };
  }, [datasets, filters, originalData]);

  // Memoized counts for each crime type
  const typeCounts = useMemo(() => {
    if (!datasetInfo || datasetInfo.fieldIndex === -1 || !datasetInfo.data.length) {
      console.log('Cannot calculate counts - missing data or field index');
      return {};
    }

    console.log('Calculating counts for field index:', datasetInfo.fieldIndex);
    console.log('Total data rows:', datasetInfo.data.length);

    const counts = {};
    
    // If we have the original dataset, use its getValue method for better performance
    if (datasetInfo.dataset && datasetInfo.dataset.getValue && datasetInfo.dataset.length > 0) {
      console.log('Using dataset.getValue for counting');
      
      const fieldName = 'ahp_weighted_event_types_main_type';
      const uniqueValues = new Set();
      
      // Sample some values first to see what we're working with
      for (let i = 0; i < Math.min(datasetInfo.dataset.length, 100); i++) {
        const value = datasetInfo.dataset.getValue(fieldName, i);
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(value);
        }
      }
      
      console.log('Sample unique values found:', Array.from(uniqueValues));
      console.log('Crime types we are looking for:', crimeTypes);
      
      // Count each crime type
      crimeTypes.forEach(type => {
        let count = 0;
        for (let i = 0; i < datasetInfo.dataset.length; i++) {
          const value = datasetInfo.dataset.getValue(fieldName, i);
          if (value === type) {
            count++;
          }
        }
        counts[type] = count;
        console.log(`Count for "${type}": ${count}`);
      });
    } else {
      // Fallback to array-based counting
      console.log('Using array-based counting');
      
      // First, let's see what unique values actually exist in the data
      const uniqueValues = new Set();
      datasetInfo.data.forEach(row => {
        const value = row[datasetInfo.fieldIndex];
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(value);
        }
      });
      
      console.log('Unique values found in data:', Array.from(uniqueValues));
      console.log('Crime types we are looking for:', crimeTypes);

      // Count each crime type
      crimeTypes.forEach(type => {
        const count = datasetInfo.data.filter(row => {
          const value = row[datasetInfo.fieldIndex];
          return value === type;
        }).length;
        counts[type] = count;
        console.log(`Count for "${type}": ${count}`);
      });
    }

    console.log('Final crime type counts:', counts);
    return counts;
  }, [datasetInfo, crimeTypes]);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setIsOpen(false);

    if (!datasetInfo || !originalData) {
      console.warn('No dataset info or original data available for filtering');
      return;
    }

    console.log(`Applying filter for: ${type}`);

    if (type === 'All Types') {
      // Restore original data
      console.log('Restoring original data with', originalData.rows.length, 'rows');
      
      // Use the correct payload structure for updateVisData
      dispatch(updateVisData({
        datasets: [{
          info: {
            id: datasetInfo.datasetId,
            label: 'Crime Data'
          },
          data: {
            fields: originalData.fields,
            rows: originalData.rows
          }
        }],
        options: {
          centerMap: false,
          keepExistingConfig: true
        }
      }, 'map'));
    } else {
      const filteredRows = originalData.rows.filter(row => 
        row[datasetInfo.fieldIndex] === type
      );
      
      console.log(`Filtered ${filteredRows.length} rows for type: ${type}`);
      
      if (filteredRows.length === 0) {
        console.warn('No data found for selected crime type');
        return;
      }
      
      dispatch(updateVisData({
        datasets: [{
          info: {
            id: datasetInfo.datasetId,
            label: `Crime Data - ${type}`
          },
          data: {
            fields: originalData.fields,
            rows: filteredRows
          }
        }],
        options: {
          centerMap: false,
          keepExistingConfig: true
        }
      }, 'map'));
    }
  };

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

  // Don't render if no datasets are available yet
  if (!datasets || Object.keys(datasets).length === 0) {
    console.log('FilterDropdown: Waiting for datasets to load');
    return null; // Hide completely while loading
  }

  // Don't render if we can't find the crime type field
  if (!datasetInfo || datasetInfo.fieldIndex === -1) {
    console.log('FilterDropdown: Crime type field not found, hiding component');
    return null;
  }

  // Don't render if no data is available
  if (!datasetInfo.data || datasetInfo.data.length === 0) {
    console.log('FilterDropdown: No data available in dataset');
    return (
      <div style={dropdownStyle}>
        <div style={{
          ...buttonStyle,
          cursor: 'not-allowed',
          opacity: 0.6
        }}>
          Loading data...
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
          onMouseOver={(e) => {
            if (!isOpen) {
              e.target.style.backgroundColor = 'rgba(240, 240, 240, 0.95)';
            }
          }}
          onMouseOut={(e) => {
            if (!isOpen) {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            }
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
              onMouseOver={(e) => {
                if (selectedType !== 'All Types') {
                  e.target.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseOut={(e) => {
                if (selectedType !== 'All Types') {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
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
                  onMouseOver={(e) => {
                    if (selectedType !== type) {
                      e.target.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedType !== type) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
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