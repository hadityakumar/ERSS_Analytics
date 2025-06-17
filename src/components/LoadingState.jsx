import React from 'react';

const LoadingState = ({ startDate, endDate }) => {
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
        <h2 style={{ marginBottom: '20px', color: '#1EBBD6' }}>Processing Crime Data</h2>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          margin: '0 auto',
          border: '5px solid #f3f3f3', 
          borderTop: '5px solid #1EBBD6', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite' 
        }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>
          {startDate && endDate ? 
            `Filtering crime data between ${startDate} and ${endDate}...` : 
            'Filtering crime data near police stations...'}
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LoadingState;