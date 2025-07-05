import React from 'react';

const ChartPagination = ({ currentPage, totalPages, onPageChange, onDownload }) => (
  <div style={{
    position: 'absolute',
    right: 0,
    top: '15px',
    width: '60px',
    height: 'calc(100% - 20px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff'
  }}>
    <div style={{
      position: 'absolute',
      left: '12px',
      top: 0,
      bottom: 0,
      width: '3px',
      backgroundColor: 'black'
    }} />
    
    {/* Pagination buttons */}
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0px',
      padding: '0px 8px',
      marginTop: '0px'
    }}>
      {Array.from({ length: totalPages }, (_, index) => (
        <React.Fragment key={index + 1}>
          <button
            onClick={() => onPageChange(index + 1)}
            style={{
              width: '33px',
              height: '34px',
              border: 'none',
              backgroundColor: currentPage === index + 1 ? '#000' : 'transparent',
              color: currentPage === index + 1 ? '#fff' : '#000',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {index + 1}
          </button>
          {index < totalPages - 1 && (
            <div style={{ width: '30px', height: '1px', backgroundColor: '#ddd' }} />
          )}
        </React.Fragment>
      ))}
    </div>

    {/* Download button */}
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0px 8px',
      marginBottom: '65px'
    }}>
      <div style={{ width: '30px', height: '1px', backgroundColor: '#ddd', marginBottom: '0px' }} />
      <button
        onClick={onDownload}
        style={{
          width: '33px',
          height: '34px',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#000',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        title="Download chart data"
      >
        <img src="download_button.svg" alt="Download" />
      </button>
      <div style={{ width: '30px', height: '1px', backgroundColor: '#ddd', marginTop: '0px' }} />
    </div>
  </div>
);

export default ChartPagination;