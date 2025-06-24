import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector }   from 'react-redux';
import { setDateFilter }              from '../store';

export const DATE_FIELD_NAME = 'signal_lan';

export default function DateRangeSelector() {
  const dispatch = useDispatch();
  const { startDate, endDate } = useSelector(s => s.csvProcessing);

  const [from, setFrom] = useState(startDate||'');
  const [to,   setTo]   = useState(endDate  ||'');

  const apply = useCallback(e=>{
    e.preventDefault();
    if (!from||!to||new Date(from)>new Date(to)) return alert('Invalid range');
    
    // Update the date filter in store
    dispatch(setDateFilter({ startDate:from, endDate:to }));
    
    // Trigger filtered CSV processing
    dispatch({type:'FETCH_CSV_DATA_FILTERED', payload: { startDate: from, endDate: to }});
  },[from,to,dispatch]);

  const clear = useCallback(()=>{
    // Clear the date filter
    dispatch(setDateFilter({ startDate:null, endDate:null }));
    
    // Clear form inputs
    setFrom('');
    setTo('');
    
    // Load full dataset
    dispatch({type:'FETCH_CSV_DATA_INITIAL'});
  },[dispatch]);

  return (
    <form
      onSubmit={apply}
      style={{
        position: 'static',
        background: 'rgba(255,255,255,0.95)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '220px'
      }}
    >
     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
       <label style={{ fontSize: '12px', color: '#666', minWidth: '40px' }}>From:</label>
       <input 
         type="date" 
         value={from} 
         onChange={e=>setFrom(e.target.value)}
         style={{
           flex: 1,
           padding: '6px',
           border: '1px solid #ddd',
           borderRadius: '4px',
           fontSize: '12px'
         }}
       />
     </div>
     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
       <label style={{ fontSize: '12px', color: '#666', minWidth: '40px' }}>To:</label>
       <input 
         type="date" 
         value={to} 
         onChange={e=>setTo(e.target.value)}
         style={{
           flex: 1,
           padding: '6px',
           border: '1px solid #ddd',
           borderRadius: '4px',
           fontSize: '12px'
         }}
       />
     </div>
     <div style={{ display: 'flex', gap: '8px' }}>
       <button 
         type="submit"
         style={{
           flex: 1,
           padding: '8px',
           backgroundColor: '#1EBBD6',
           color: 'white',
           border: 'none',
           borderRadius: '4px',
           fontSize: '12px',
           cursor: 'pointer'
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
           backgroundColor: '#666',
           color: 'white',
           border: 'none',
           borderRadius: '4px',
           fontSize: '12px',
           cursor: 'pointer'
         }}
       >
         Show All
       </button>
     </div>
    </form>
  );
}