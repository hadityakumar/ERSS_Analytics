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
    
    dispatch(setDateFilter({ startDate:from, endDate:to }));
    dispatch({type:'FETCH_CSV_DATA_FILTERED', payload: { startDate: from, endDate: to }});
  },[from,to,dispatch]);

  const clear = useCallback(()=>{
    dispatch(setDateFilter({ startDate:null, endDate:null }));
    setFrom('');
    setTo('');
    dispatch({type:'FETCH_CSV_DATA_INITIAL'});
  },[dispatch]);

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
        width: '220px'
      }}
    >
     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
       <label style={{ fontSize: '12px', color: '#ffffff', minWidth: '40px', fontWeight: '500' }}>From:</label>
       <input 
         type="date" 
         value={from} 
         onChange={e=>setFrom(e.target.value)}
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
     </div>
     <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
       <label style={{ fontSize: '12px', color: '#ffffff', minWidth: '40px', fontWeight: '500' }}>To:</label>
       <input 
         type="date" 
         value={to} 
         onChange={e=>setTo(e.target.value)}
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
     </div>
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