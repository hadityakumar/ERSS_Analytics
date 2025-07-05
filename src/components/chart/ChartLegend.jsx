import React from 'react';

const ChartLegend = ({ legend }) => (
  <div style={{
    width: '180px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
    border: '1px solid #ddd'
  }}>
    <div style={{
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '4px',
      borderBottom: '1px solid #ddd',
      paddingBottom: '4px'
    }}>
      Legend
    </div>
    {legend.map((item, index) => (
      <div key={index} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 0'
      }}>
        <div style={{
          width: '14px',
          height: '14px',
          backgroundColor: item.color,
          borderRadius: '3px',
          flexShrink: 0
        }} />
        <span style={{
          fontSize: '11px',
          color: '#666',
          fontWeight: '500',
          lineHeight: '1.3'
        }}>
          {item.label}
        </span>
      </div>
    ))}
  </div>
);

export default ChartLegend;