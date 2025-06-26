import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector }   from 'react-redux';
import { setDateFilter }              from '../store';

export const DATE_FIELD_NAME = 'signal_lan';

export default function DateRangeSelector() {
  const dispatch = useDispatch();
  const { startDate, endDate } = useSelector(s => s.csvProcessing);

  const [fromDate, setFromDate] = useState(startDate ? startDate.split(' ')[0] : '');
  const [fromTime, setFromTime] = useState(startDate ? startDate.split(' ')[1] || '00:00' : '00:00');
  const [toDate, setToDate] = useState(endDate ? endDate.split(' ')[0] : '');
  const [toTime, setToTime] = useState(endDate ? endDate.split(' ')[1] || '23:59' : '23:59');

  const apply = useCallback(e => {
    e.preventDefault();
    
    if (!fromDate || !toDate) {
      return alert('Please select both start and end dates');
    }
    
    const startDateTime = `${fromDate} ${fromTime}:00`;
    const endDateTime = `${toDate} ${toTime}:59`;
    
    if (new Date(startDateTime) > new Date(endDateTime)) {
      return alert('Start date/time must be before end date/time');
    }
    
    dispatch(setDateFilter({ startDate: startDateTime, endDate: endDateTime }));
    dispatch({
      type: 'FETCH_CSV_DATA_FILTERED', 
      payload: { 
        startDate: startDateTime, 
        endDate: endDateTime 
      }
    });
  }, [fromDate, fromTime, toDate, toTime, dispatch]);

  const clear = useCallback(() => {
    dispatch(setDateFilter({ startDate: null, endDate: null }));
    setFromDate('');
    setFromTime('00:00');
    setToDate('');
    setToTime('23:59');
    dispatch({ type: 'FETCH_CSV_DATA_INITIAL' });
  }, [dispatch]);

  return (
    <form
      onSubmit={apply}
      style={{
        position: 'static',
        background: '#000000',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #333333',
        boxShadow: '0 2px 8px rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '280px'
      }}
    >
      {/* From Date and Time */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ fontSize: '12px', color: '#ffffff', minWidth: '40px', fontWeight: '500' }}>
          From:
        </label>
        <input 
          type="date" 
          value={fromDate} 
          onChange={e => setFromDate(e.target.value)}
          style={{
            flex: 1,
            padding: '6px',
            border: '1px solid #555555',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: '#222222',
            color: '#ffffff'
          }}
        />
        <input 
          type="time" 
          value={fromTime} 
          onChange={e => setFromTime(e.target.value)}
          style={{
            padding: '6px',
            border: '1px solid #555555',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: '#222222',
            color: '#ffffff',
            width: '80px'
          }}
        />
      </div>

      {/* To Date and Time */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ fontSize: '12px', color: '#ffffff', minWidth: '40px', fontWeight: '500' }}>
          To:
        </label>
        <input 
          type="date" 
          value={toDate} 
          onChange={e => setToDate(e.target.value)}
          style={{
            flex: 1,
            padding: '6px',
            border: '1px solid #555555',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: '#222222',
            color: '#ffffff'
          }}
        />
        <input 
          type="time" 
          value={toTime} 
          onChange={e => setToTime(e.target.value)}
          style={{
            padding: '6px',
            border: '1px solid #555555',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: '#222222',
            color: '#ffffff',
            width: '80px'
          }}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          type="submit"
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #ffffff',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#cccccc';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#ffffff';
          }}
        >
          Apply
        </button>
        <button 
          type="button" 
          onClick={clear}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#333333',
            color: '#ffffff',
            border: '1px solid #555555',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#555555';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#333333';
          }}
        >
          Show All
        </button>
      </div>
    </form>
  );
}