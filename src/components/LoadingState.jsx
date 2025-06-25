import React from 'react';

const LoadingState = ({ startDate, endDate, mapOnly = false }) => {
  if (mapOnly) {
    // Loading overlay that covers only the map container
    return (
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        borderRadius: '5px'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            margin: '0 auto',
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #1EBBD6', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '15px'
          }}></div>
          <p style={{ 
            margin: '0', 
            color: '#666',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {startDate && endDate ? 
              `Loading filtered data...` : 
              'Loading crime data...'}
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  else{
    return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#000000' }}>
      <div style={{ 
        position: 'absolute', 
        zIndex: 1000,
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
          Initializing ERSS Crime Analytics Dashboard...
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
}
};

export default LoadingState;