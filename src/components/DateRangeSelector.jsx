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

  const clearFromFields = useCallback(() => {
    setFromDate('');
    setFromTime('00:00');
  }, []);

  const clearToFields = useCallback(() => {
    setToDate('');
    setToTime('23:59');
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '100%'
    }}>
      {/* From Date and Time */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <label style={{ fontSize: '11px', color: '#333', minWidth: '30px', fontWeight: '500' }}>
          From:
        </label>
        <input 
          type="date" 
          value={fromDate} 
          onChange={e => setFromDate(e.target.value)}
          style={{
            flex: 1,
            padding: '2px 6px',
            border: '1px solid #000',
            borderRadius: '3px',
            fontSize: '11px',
            backgroundColor: '#fff',
            color: '#000',
            height: '24px',
            width: '52px'
          }}
        />
        <input 
          type="time" 
          value={fromTime} 
          onChange={e => setFromTime(e.target.value)}
          style={{
            padding: '4px 6px',
            border: '1px solid #000',
            borderRadius: '3px',
            fontSize: '11px',
            backgroundColor: '#fff',
            color: '#000',
            width: '70px',
            height: '24px'
          }}
        />
        {/* Clear from fields button */}
        <button
          onClick={clearFromFields}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '2px'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#f0f0f0';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
          title="Clear from date and time"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* To Date and Time */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <label style={{ fontSize: '11px', color: '#333', minWidth: '30px', fontWeight: '500' }}>
          To:
        </label>
        <input 
          type="date" 
          value={toDate} 
          onChange={e => setToDate(e.target.value)}
          style={{
            flex: 1,
            padding: '4px 6px',
            border: '1px solid #000',
            borderRadius: '3px',
            fontSize: '11px',
            backgroundColor: '#fff',
            color: '#000',
            height: '24px',
            width: '52px'
          }}
        />
        <input 
          type="time" 
          value={toTime} 
          onChange={e => setToTime(e.target.value)}
          style={{
            padding: '4px 6px',
            border: '1px solid #000',
            borderRadius: '3px',
            fontSize: '11px',
            backgroundColor: '#fff',
            color: '#000',
            width: '70px',
            height: '24px'
          }}
        />
        {/* Clear to fields button */}
        <button
          onClick={clearToFields}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '2px'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#f0f0f0';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
          title="Clear to date and time"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}