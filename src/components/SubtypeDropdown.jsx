import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFilter, setFilter, removeFilter } from '@kepler.gl/actions';
import crimeTypesData from '../data/crimeTypes.json';
import Dropdown from './Dropdown'; // <-- use your custom Dropdown

const SUBTYPE_FIELD_NAME = 'ahp_weighted_event_types_sub_type';
const MAIN_TYPE_FIELD_NAME = 'ahp_weighted_event_types_main_type';

const SubtypeDropdown = ({ selectedMainTypes, onSelectionChange }) => {
  const dispatch = useDispatch();
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
      const currentFilters = reduxFilters || [];
      for (let i = currentFilters.length - 1; i >= 0; i--) {
        dispatch(removeFilter(i, 'map'));
      }
      return;
    }
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
    reapplyMainTypeFilter();
    setTimeout(() => {
      dispatch(addFilter(datasetInfo.datasetId, 'map'));
      setTimeout(() => {
        dispatch(setFilter(1, 'fieldIdx', [datasetInfo.subtypeFieldIndex], 'map'));
        dispatch(setFilter(1, 'name', [SUBTYPE_FIELD_NAME], 'map'));
        dispatch(setFilter(1, 'type', 'multiSelect', 'map'));
        dispatch(setFilter(1, 'value', filterValues, 'map'));
        dispatch(setFilter(1, 'enabled', true, 'map'));
      }, 100);
    }, 300);
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

  const options = [
    { value: 'All Subtypes', label: `All Subtypes (${availableSubtypes.reduce((sum, s) => sum + (subtypeCounts[s] || 0), 0)})` },
    ...availableSubtypes.map(subtype => ({
      value: subtype,
      label: `${subtype} (${subtypeCounts[subtype] || 0})`
    }))
  ];

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
          Event Sub Types
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
        Event Sub-Types
      </h4>
      <Dropdown
        options={options}
        selected={selectedSubtypes}
        onSelect={handleSubtypeSelect}
        clearable={true}
        onClear={handleClearSelection}
        placeholder="All Subtypes"
        width="100%"
        renderSelected={(selected) => {
          if (!selected || selected.includes('All Subtypes')) return 'All Subtypes';
          if (selected.length === 1) return selected[0];
          if (selected.length <= 3) return selected.join(', ');
          return `${selected.length} subtypes selected`;
        }}
        renderOption={option => option.label}
        disabled={false}
      />
    </div>
  );
};

export default SubtypeDropdown;
