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
    width: '16px',
    height: '16px',
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
          position: 'static',
          padding: '12px 20px',
          backgroundColor: isAnalyzing ? '#cccccc' : '#2E86AB',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isAnalyzing ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '200px'
        }}
        onMouseOver={(e) => {
          if (!isAnalyzing) {
            e.target.style.backgroundColor = '#236B87';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseOut={(e) => {
          if (!isAnalyzing) {
            e.target.style.backgroundColor = '#2E86AB';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        {isAnalyzing ? (
          <>
            <div style={spinnerStyle} />
            Analyzing...
          </>
        ) : (
          <>
            Generate KDE
          </>
        )}
      </button>
    </>
  );
};

export default KDEButton;