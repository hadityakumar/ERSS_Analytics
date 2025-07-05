import React from 'react';
import ReactLoading from "react-loading";

const ChartLoadingOverlay = () => (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    zIndex: 10,
    borderRadius: '5px'
  }}>
    <ReactLoading type="bars" color="black" height={60} width={60} />
    <div style={{ marginTop: '20px', textAlign: 'center' }}>
      <h3 style={{ color: 'black', marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
        Loading Chart Data
      </h3>
      <p style={{ color: '#666', fontSize: '12px', fontWeight: '400', margin: 0 }}>
        Fetching analytics from server...
      </p>
    </div>
  </div>
);

export default ChartLoadingOverlay;