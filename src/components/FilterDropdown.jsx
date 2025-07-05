import React, { useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFilter, setFilter, removeFilter } from '@kepler.gl/actions';
import crimeTypesData from '../data/crimeTypes.json';
import Dropdown from './Dropdown';

const FILTER_FIELD_NAME = 'ahp_weighted_event_types_main_type';

const FilterDropdown = ({ onSelectionChange }) => {
  const dispatch = useDispatch();
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

  const reduxClearAllFilters = useCallback(() => {
    const currentFilters = reduxFilters || [];
    for (let i = currentFilters.length - 1; i >= 0; i--) {
      dispatch(removeFilter(i, 'map'));
    }
  }, [reduxFilters, dispatch]);

  const createFilter = useCallback((filterValues) => {
    if (!datasetInfo || datasetInfo.fieldIndex === -1 || !filterValues.length) return;
    reduxClearAllFilters();
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
  }, [datasetInfo, dispatch, reduxClearAllFilters]);

  const handleTypeSelect = useCallback((type) => {
    let newSelectedTypes;
    if (type === 'All Types') {
      newSelectedTypes = ['All Types'];
      reduxClearAllFilters();
    } else {
      if (selectedTypes.includes('All Types')) {
        newSelectedTypes = [type];
        createFilter([type]);
      } else if (selectedTypes.includes(type)) {
        newSelectedTypes = selectedTypes.filter(t => t !== type);
        if (newSelectedTypes.length === 0) {
          newSelectedTypes = ['All Types'];
          reduxClearAllFilters();
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
  }, [selectedTypes, reduxClearAllFilters, createFilter, onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    setSelectedTypes(['All Types']);
    reduxClearAllFilters();
    onSelectionChange?.(['All Types']);
  }, [reduxClearAllFilters, onSelectionChange]);

  const options = [
    { value: 'All Types', label: `All Types (${datasetInfo?.totalCount || 0})` },
    ...crimeTypesData.crimeTypes.map(type => ({
      value: type,
      label: `${type} (${typeCounts[type] || 0})`
    }))
  ];

  if (!datasetInfo) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
        <h4 style={{
          margin: '0',
          fontSize: '10px',
          fontWeight: 'bold',
          color: 'black',
          width: '80px',
          flexShrink: 0
        }}>
          Event Main-Types
        </h4>
        <div style={{ fontSize: '10px', color: '#666', flex: '1' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
      <h4 style={{
        margin: '0',
        fontSize: '10px',
        fontWeight: 'bold',
        color: 'black',
        width: '80px',
        flexShrink: 0
      }}>
        Event Main Types
      </h4>
      <Dropdown
        options={options}
        selected={selectedTypes}
        onSelect={handleTypeSelect}
        clearable={true}
        onClear={handleClearSelection}
        placeholder="All Types"
        width="100%"
        renderSelected={(selected) => {
          if (!selected || selected.includes('All Types')) return 'All Types';
          if (selected.length === 1) return selected[0];
          if (selected.length <= 1) return selected.join(', ');
          return `${selected.length} types selected`;
        }}
        renderOption={option => option.label}
        disabled={false}
      />
    </div>
  );
};

export default FilterDropdown;
