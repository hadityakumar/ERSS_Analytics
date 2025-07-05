import React from 'react';

const ContentPanel = ({ style, children }) => (
  <div
    style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '5px',
      border: '1px solid black',
      ...style,
    }}
  >
    {children}
  </div>
);

export default ContentPanel;