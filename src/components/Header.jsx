import React from 'react';

const Header = () => {
  return (
    <div style={{ 
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: '100%', 
      height: '40px',
      backgroundColor: '#000000',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      padding: '0 20px',
      zIndex: 1000,
      boxSizing: 'border-box',
      borderBottom: '1px solid #c0c0c0'
    }}>
      {/* Left Component */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }}>
        <span style={{
          fontSize: '17px',
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          ERSS Analytics
        </span>
      </div>

      {/* Middle Component - Title (Always Centered) */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '17px', 
          fontWeight: 'bold',
          letterSpacing: '1px',
          color: 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center'
        }}>
          Next Gen ERSS-112 Trivandrum
        </h1>
      </div>

      {/* Right Component - Text Links */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '20px'
      }}>
        <span style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'color 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.color = 'rgba(255, 255, 255, 1)';
        }}
        onMouseOut={(e) => {
          e.target.style.color = 'rgba(255, 255, 255, 0.7)';
        }}>
          Alpha_portal &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;| 
        </span>
        
        <span style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'color 0.2s ease',
          position: 'relative',
          display: 'inline-flex',
        }}
        onMouseOver={(e) => {
          e.target.style.color = 'rgba(255, 255, 255, 1)';
        }}
        onMouseOut={(e) => {
          e.target.style.color = 'rgba(255, 255, 255, 0.7)';
        }}>
          <img src="expand.svg" alt="" />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;|
        </span>

        <span style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'color 0.2s ease',
          position: 'relative',
          display: 'inline-flex',
        }}
        onMouseOver={(e) => {
          e.target.style.color = 'rgba(255, 255, 255, 1)';
        }}
        onMouseOut={(e) => {
          e.target.style.color = 'rgba(255, 255, 255, 0.7)';
        }}>
          <img src="call.svg" alt="" />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|
        </span>
        <span style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'color 0.2s ease',
          position: 'relative',
          display: 'inline-flex',
        }}
        onMouseOver={(e) => {
          e.target.style.color = 'rgba(255, 255, 255, 1)';
        }}
        onMouseOut={(e) => {
          e.target.style.color = 'rgba(255, 255, 255, 0.7)';
        }}>
          <img src="person.svg" alt="" />
        </span>
      </div>
    </div>
  );
};

export default Header;