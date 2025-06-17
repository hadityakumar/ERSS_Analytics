import React from 'react';
import { useDispatch } from 'react-redux';

const ErrorState = ({ error }) => {
  const dispatch = useDispatch();

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ color: '#ff4444' }}>Error Processing Data</h2>
        <p style={{ margin: '20px 0', color: '#666' }}>{error}</p>
        <button 
          onClick={() => dispatch({ type: 'FETCH_CSV_DATA' })}
          style={{
            padding: '10px 20px',
            background: '#1EBBD6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default ErrorState;