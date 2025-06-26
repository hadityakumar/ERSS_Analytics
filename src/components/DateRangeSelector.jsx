import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDateFilter } from '../store';

export const DATE_FIELD_NAME = 'signal_lan';

export default function DateRangeSelector({ onDateRangeChange }) {
  const dispatch = useDispatch();
  const { startDate, endDate } = useSelector(s => s.csvProcessing);

  const [fromDate, setFromDate] = useState(startDate ? startDate.split(' ')[0] : '');
  const [fromTime, setFromTime] = useState(startDate ? startDate.split(' ')[1] || '00:00' : '00:00');
  const [toDate, setToDate] = useState(endDate ? endDate.split(' ')[0] : '');
  const [toTime, setToTime] = useState(endDate ? endDate.split(' ')[1] || '23:59' : '23:59');

  // Notify parent component when date range changes
  useEffect(() => {
    const dateRange = {
      fromDate,
      fromTime,
      toDate,
      toTime,
      hasDateRange: fromDate && toDate
    };
    onDateRangeChange?.(dateRange);
  }, [fromDate, fromTime, toDate, toTime, onDateRangeChange]);

  const clear = useCallback(() => {
    dispatch(setDateFilter({ startDate: null, endDate: null }));
    setFromDate('');
    setFromTime('00:00');
    setToDate('');
    setToTime('23:59');
    dispatch({ type: 'FETCH_CSV_DATA_INITIAL' });
  }, [dispatch]);

  const hasDateRange = fromDate && toDate;

  return (
    <div
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

      {/* Clear button only */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          type="button" 
          onClick={clear}
          style={{
            width: '100%',
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
          Clear Date Range
        </button>
      </div>

      {/* Status indicator */}
      {hasDateRange && (
        <div style={{
          fontSize: '11px',
          color: '#4CAF50',
          textAlign: 'center',
          marginTop: '4px'
        }}>
          Date range selected
        </div>
      )}
    </div>
  );
}