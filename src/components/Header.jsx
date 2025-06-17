import React from 'react';

const Header = () => {
  return (
    <div style={{ 
      position: 'absolute',
      top: '10px',
      left: '10px',
      width: 'calc(100% - 20px)', 
      height: '50px',
      backgroundColor: 'rgba(30, 187, 214, 0.7)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '0 10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: 1000,
      borderRadius: '25px',
      boxSizing: 'border-box',
      backdropFilter: 'blur(4px)'
    }}>
      <h1 style={{ 
        margin: 0, 
        fontSize: '28px', 
        fontWeight: 'bold',
        letterSpacing: '1.2px'
      }}>ERSS Crime Analytics</h1>
    </div>
  );
};

export default Header;