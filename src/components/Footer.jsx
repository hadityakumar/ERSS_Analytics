import React, { useState, useEffect } from 'react';

const Footer = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [loginTime] = useState(new Date()); // Capture login time when component mounts

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatLoginTime = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}-${month}-${year}_${hours}:${minutes}:${seconds}`;
  };

  return (
    <div style={{ 
      position: 'absolute',
      bottom: '0px',
      left: '0px',
      width: '100%', 
      height: '32px',
      backgroundColor: '#000000',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      padding: '0 20px',
      zIndex: 1000,
      boxSizing: 'border-box',
      borderTop: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      {/* Left Component */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }}>

        <img src="white_clock.svg" alt="Clock Icon" style={{ position: 'relative', top: '2px', marginRight: '5px' }}/>

        <span style={{
          fontSize: '12px',
          fontWeight: '400',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Login Time : {formatLoginTime(loginTime)} &nbsp; &nbsp; &nbsp;| &nbsp; &nbsp; &nbsp;  
        </span>

        <img src="computer.svg" alt="Computer Icon" style={{ position: 'relative', top: '2px', marginLeft: '5px' }}/>
        <img src="green_dot.svg" alt="Status Icon" style={{ position: 'relative', top: '2px', marginLeft: '5px' }}/>
        <img src="telephone.svg" alt="Phone Icon" style={{ position: 'relative', top: '2px', marginLeft: '5px' }}/>
        <img src="green_dot.svg" alt="Status Icon" style={{ position: 'relative', top: '2px', marginLeft: '5px' }}/>
        <img src="video.svg" alt="Video Icon" style={{ position: 'relative', top: '2px', marginLeft: '5px' }}/>
        <img src="red_dot.svg" alt="Status Icon" style={{ position: 'relative', top: '2px', marginLeft: '5px' }}/>
        <img src="internet.svg" alt="Internet Icon" style={{ position: 'relative', top: '2px', marginLeft: '5px' }}/>
        <img src="green_dot.svg" alt="Status Icon" style={{ position: 'relative', top: '2px', marginLeft: '5px' }}/>
      </div>

      {/* Middle Component - Main Footer Text */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: '13px', 
          fontWeight: '400',
          letterSpacing: '0.5px',
          color: 'rgba(255, 255, 255, 0.8)',
          textAlign: 'center'
        }}>
          Kerala ERSS | Powered by C-DAC Thiruvananthapuram
        </p>
      </div>

      {/* Right Component - Version and DateTime */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '10px'
      }}>
        <span style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          NG112 - v1.5.4b
        </span>
        
        <span style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px'
        }}>
          |
        </span>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px'
          }}>
            <img src="clock.svg" alt="Clock Icon" style={{ position: 'relative', top: '2px' }}/>
          </span>
          <span style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {formatDateTime(currentDateTime)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Footer;