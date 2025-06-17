import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setDateFilter } from '../store';

const DateRangeSelector = () => {
  const dispatch = useDispatch();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(true);

  const handleProcessWithDateRange = useCallback((e) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    console.log(`Processing with date range: ${startDate} to ${endDate}`);
    
    dispatch(setDateFilter(startDate, endDate));
    dispatch({ 
      type: 'FETCH_CSV_DATA', 
      payload: { startDate, endDate } 
    });
    
    setDatePickerVisible(false);
  }, [dispatch, startDate, endDate]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: datePickerVisible ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
      borderRadius: datePickerVisible ? '8px' : '20px',
      boxShadow: datePickerVisible ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
      padding: datePickerVisible ? '20px' : '0px',
      transition: 'all 0.3s ease',
      width: datePickerVisible ? '300px' : '35px',
      height: datePickerVisible ? 'auto' : '35px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {datePickerVisible ? (
        <form onSubmit={handleProcessWithDateRange}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1EBBD6', fontSize: '16px' }}>
            Filter by Date Range
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
              Start Date:
            </label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>
              End Date:
            </label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button 
              type="submit"
              style={{
                padding: '8px 15px',
                background: '#1EBBD6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                flex: '1 0 auto',
                marginRight: '8px'
              }}
            >
              Process
            </button>
            
            <button 
              type="button"
              onClick={() => setDatePickerVisible(false)}
              style={{
                padding: '8px 15px',
                background: '#f5f5f5',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                flex: '0 0 auto'
              }}
            >
              X
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setDatePickerVisible(true)}
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '17.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(4px)',
            padding: '0'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = 'rgba(30, 187, 214, 0.9)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.target.style.transform = 'scale(1)';
          }}
          title="Open date filter"
        >
          <img 
            src="/calender-svgrepo-com.svg" 
            alt="Calendar" 
            style={{
              width: '22px',
              height: '22px',
              filter: 'invert(0.2)',
              pointerEvents: 'none',
              marginLeft: '-5px',
              display: 'block'
            }}
          />
        </button>
      )}
    </div>
  );
};

export default DateRangeSelector;