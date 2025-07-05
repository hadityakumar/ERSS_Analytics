import React from 'react';

const ChartHeader = ({ title, description }) => (
  <div style={{ marginBottom: '12px', flexShrink: 0, backgroundColor: '#fff' }}>
    <div style={{ height: '1px', backgroundColor: '#ddd', marginBottom: '4px' }} />
    <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
      {title}
    </h2>
    <div style={{ height: '1px', backgroundColor: '#ddd', marginBottom: '4px' }} />
    <h3 style={{
      margin: '0 0 4px 0',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#555',
      borderBottom: '1px solid #333',
      paddingBottom: '2px',
      display: 'inline-block'
    }}>
      Summary
    </h3>
    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
      {description}
    </p>
  </div>
);

export default ChartHeader;