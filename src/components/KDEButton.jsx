import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const KDEButton = () => {
  const dispatch = useDispatch();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const csvProcessing = useSelector(state => state.csvProcessing || {});
  
  const handleKDEAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/kde-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: csvProcessing.startDate || null,
          endDate: csvProcessing.endDate || null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('KDE analysis completed:', result.details);
        dispatch({ type: 'LOAD_KDE_DATA' });
        alert('KDE analysis completed successfully! The density layer has been added to the map.');
      } else {
        console.error('KDE analysis failed:', result.error);
        alert('KDE analysis failed. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error during KDE analysis:', error);
      alert('Error during KDE analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const spinnerStyle = {
    width: '12px',
    height: '12px',
    border: '2px solid #ffffff',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <button
        onClick={handleKDEAnalysis}
        disabled={isAnalyzing}
        style={{
          width: '100%',
          padding: '8px 4px',
          backgroundColor: isAnalyzing ? '#555' : '#000',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '4px',
          cursor: isAnalyzing ? 'not-allowed' : 'pointer',
          fontSize: '10px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}
        onMouseOver={(e) => {
          if (!isAnalyzing) {
            e.target.style.backgroundColor = '#333';
          }
        }}
        onMouseOut={(e) => {
          if (!isAnalyzing) {
            e.target.style.backgroundColor = '#000';
          }
        }}
        title="Generate Kernel Density Estimation"
      >
        {isAnalyzing ? (
          <>
            <div style={spinnerStyle} />
            ...
          </>
        ) : (
          'KDE'
        )}
      </button>
    </>
  );
};

export default KDEButton;