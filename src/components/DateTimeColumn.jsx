import React from 'react';
import DateRangeSelector from './DateRangeSelector';
import FilterDropdown from './FilterDropdown';
import SubtypeDropdown from './SubtypeDropdown';
import SeverityRadio from './SeverityRadio';
import PartOfDayRadio from './PartOfDayRadio';
import ApplyFiltersButton from './ApplyFiltersButton';
import DistrictDropdown from './DistrictDropdown';
import TemporalTrendDropdown from './TemporalTrendDropdown';
import RangeDropdown from './RangeDropdown';

const ControlPanel = ({
  selectedMainTypes, setSelectedMainTypes,
  selectedSubtypes, setSelectedSubtypes,
  selectedSeverities, setSelectedSeverities,
  selectedPartOfDay, setSelectedPartOfDay,
  selectedCityLocation, selectedDateRange, setSelectedDateRange,
  selectedDistrict, setSelectedDistrict,
  selectedTemporalTrend, setSelectedTemporalTrend
}) => {
  // Responsive: no fixed height, fills flex container
  const panelStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '5px',
    padding: '15px',
    boxShadow: '0 4px 20px black',
    border: '1px solid black',
    overflow: 'auto',
    width: '100%',
    boxSizing: 'border-box'
  };

  // Responsive grid: percentages for columns, 1px for separators, 1fr for actions
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '15% 1px 21% 1px 25% 1px 20% 1px 1fr',
    gap: '0',
    height: '100%',
    alignItems: 'start',
    width: '100%'
  };

  const columnStyle = (paddingLeft = '0px', paddingRight = '8px') => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingLeft,
    paddingRight,
    minWidth: 0 // allow shrinking
  });

  const headerStyle = {
    margin: '0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#3C00FF',
    borderBottom: '2px solid #3C00FF',
    paddingBottom: '4px'
  };

  const separatorStyle = {
    width: '1px',
    backgroundColor: '#ddd',
    alignSelf: 'stretch',
    height: 'auto',
    margin: 0,
    padding: 0
  };

  const lineStyle = {
    height: '1px',
    backgroundColor: '#ddd',
    margin: '8px 0'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#333',
    minWidth: '60px'
  };

  const InputRow = ({ label, placeholder, type = "text", step, unit }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={labelStyle}>{label}:</label>
      <input
        className="cp-input"
        type={type}
        step={step}
        placeholder={placeholder}
      />
      {unit && <span style={{ fontSize: '10px', color: '#666' }}>{unit}</span>}
    </div>
  );

  return (
    <div style={panelStyle}>
      {/* --- Input box style to match dropdown --- */}
      <style>{`
        .cp-input {
          flex: 1;
          padding: 7px 10px;
          font-size: 12px;
          background: #fff;
          border: 2px solid #000;
          border-radius: 0;
          outline: none;
          min-width: 0;
          box-sizing: border-box;
          transition: border 0.16s;
        }
        .cp-input:focus {
          border: 2.5px solid #111;
        }
      `}</style>
      <div style={gridStyle}>
        {/* Column 1: Date Range */}
        <div style={columnStyle('0px')}>
          <h3 style={headerStyle}>Date Range & Time</h3>
          <DateRangeSelector onDateRangeChange={setSelectedDateRange} />
          <div style={lineStyle}></div>
        </div>

        <div style={separatorStyle}></div>

        {/* Column 2: Event Details */}
        <div style={columnStyle('8px')}>
          <h3 style={headerStyle}>Event Details</h3>
          <FilterDropdown onSelectionChange={setSelectedMainTypes} />
          <SubtypeDropdown
            selectedMainTypes={selectedMainTypes}
            onSelectionChange={setSelectedSubtypes}
          />
          <RangeDropdown/>
          <div style={lineStyle}></div>
          <TemporalTrendDropdown onSelectionChange={setSelectedTemporalTrend} />
        </div>

        <div style={separatorStyle}></div>

        {/* Column 3: Place Details */}
        <div style={columnStyle('8px')}>
          <h3 style={headerStyle}>Place Details</h3>
          <DistrictDropdown onSelectionChange={setSelectedDistrict} />
          <div style={lineStyle}></div>
          <SeverityRadio
            selectedMainTypes={selectedMainTypes}
            selectedSubtypes={selectedSubtypes}
            onSelectionChange={setSelectedSeverities}
          />
          <div style={lineStyle}></div>
          <PartOfDayRadio
            selectedMainTypes={selectedMainTypes}
            selectedSubtypes={selectedSubtypes}
            selectedSeverities={selectedSeverities}
            onSelectionChange={setSelectedPartOfDay}
          />
        </div>

        <div style={separatorStyle}></div>

        {/* Column 4: Location */}
        <div style={columnStyle('8px')}>
          <h3 style={headerStyle}>Location</h3>
          <InputRow label="Landmark" placeholder="Search landmark..." />
          <div style={{ height: '1px', backgroundColor: '#ddd', margin: '4px 0' }}></div>
          <InputRow label="Latitude" placeholder="40.7128" type="number" step="any" />
          <InputRow label="Longitude" placeholder="-74.0060" type="number" step="any" />
          <div style={{ height: '1px', backgroundColor: '#ddd', margin: '4px 0' }}></div>
          <InputRow label="Range" placeholder="1.0" type="number" step="0.1" unit="km" />
        </div>

        <div style={separatorStyle}></div>

        {/* Column 5: Actions */}
        <div style={{
          ...columnStyle('8px', '0px'),
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}>
          <h3 style={{ ...headerStyle, textAlign: 'center', width: '100%' }}>Actions</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            flex: '1',
            width: '100%'
          }}>
            <ApplyFiltersButton
              selectedSeverities={selectedSeverities}
              selectedPartOfDay={selectedPartOfDay}
              selectedCityLocation={selectedCityLocation}
              selectedDateRange={selectedDateRange}
              selectedMainTypes={selectedMainTypes}
              selectedSubtypes={selectedSubtypes}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
