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
      dataset,
    };
  }, [datasets]);

  useEffect(() => {
    setSelectedPartOfDay(['All Times']);
    onSelectionChange?.(['All Times']);
  }, [selectedMainTypes, selectedSubtypes, selectedSeverities, onSelectionChange]);

  const partOfDayCounts = useMemo(() => {
    const counts = {};
    PART_OF_DAY_CATEGORIES.forEach(time => (counts[time] = 0));
    if (!datasetInfo?.dataset?.getValue) return counts;

    for (let i = 0; i < datasetInfo.dataset.length; i++) {
      const partOfDayValue = datasetInfo.dataset.getValue(PART_OF_DAY_FIELD_NAME, i);
      const mainType = datasetInfo.dataset.getValue(MAIN_TYPE_FIELD_NAME, i);
      const subtype = datasetInfo.dataset.getValue(SUBTYPE_FIELD_NAME, i);
      const severity = datasetInfo.dataset.getValue(SEVERITY_FIELD_NAME, i);

      const matchesMainType = selectedMainTypes.includes('All Types') || selectedMainTypes.includes(mainType);
      const matchesSubtype = selectedSubtypes.includes('All Subtypes') || selectedSubtypes.includes(subtype);
      const matchesSeverity = selectedSeverities.includes('All Levels') || selectedSeverities.includes(severity);

      if (matchesMainType && matchesSubtype && matchesSeverity && PART_OF_DAY_CATEGORIES.includes(partOfDayValue)) {
        counts[partOfDayValue]++;
      }
    }
    return counts;
  }, [datasetInfo, selectedMainTypes, selectedSubtypes, selectedSeverities]);

  const totalCount = Object.values(partOfDayCounts).reduce((a, b) => a + b, 0);

  const handleChange = useCallback((value) => {
    let newSelection;
    if (value === 'All Times') {
      newSelection = ['All Times'];
    } else {
      if (selectedPartOfDay.includes('All Times')) {
        newSelection = [value];
      } else if (selectedPartOfDay.includes(value)) {
        newSelection = selectedPartOfDay.filter(v => v !== value);
        if (newSelection.length === 0) newSelection = ['All Times'];
      } else {
        newSelection = [...selectedPartOfDay, value];
      }
    }
    setSelectedPartOfDay(newSelection);
    onSelectionChange?.(newSelection);
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 70px',
          gridTemplateRows: 'repeat(2, 1fr) repeat(2, 1fr)',
          gap: '3px 12px',
          minWidth: '240px',
          alignItems: 'center',
          justifyItems: 'start'
        }}
      >
        {/* Row 1 & 2 */}
        <PartOfDayButton
          checked={selectedPartOfDay.includes('MORNING')}
          label={`Morning (${partOfDayCounts['MORNING'] || 0})`}
          onClick={() => handleChange('MORNING')}
        />
        <PartOfDayButton
          checked={selectedPartOfDay.includes('AFTERNOON')}
          label={`Afternoon (${partOfDayCounts['AFTERNOON'] || 0})`}
          onClick={() => handleChange('AFTERNOON')}
        />
        <PartOfDayButton
          checked={selectedPartOfDay.includes('EVENING')}
          label={`Evening (${partOfDayCounts['EVENING'] || 0})`}
          onClick={() => handleChange('EVENING')}
        />
        <PartOfDayButton
          checked={selectedPartOfDay.includes('NIGHT')}
          label={`Night (${partOfDayCounts['NIGHT'] || 0})`}
          onClick={() => handleChange('NIGHT')}
        />

        {/* All Times — spans vertically in 2nd column */}
        <PartOfDayButton
          checked={selectedPartOfDay.includes('All Times')}
          label={`All (${totalCount})`}
          onClick={() => handleChange('All Times')}
          style={{
            gridRow: '1 / span 4',
            gridColumn: 2,
            justifySelf: 'center'
          }}
        />
      </div>
    </div>
  );
};

const PartOfDayButton = ({ checked, label, onClick, style = {} }) => (
  <label
    style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: '11px',
      color: '#333',
      userSelect: 'none',
      gap: '7px',
      ...style
    }}
    onClick={onClick}
  >
    <span style={{
      width: 20,
      height: 20,
      minWidth: 20,
      minHeight: 20,
      border: checked ? 'none' : '2px solid #000',
      borderRadius: '3px',
      background: checked ? '#28a745' : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '14px',
      transition: 'background 0.15s, border 0.15s'
    }}>
      {checked && <span style={{ color: '#fff', fontSize: '14px', lineHeight: 1 }}>✓</span>}
    </span>
    <span>{label}</span>
  </label>
);

export default PartOfDayRadio;
