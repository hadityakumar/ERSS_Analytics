import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const EmergingHotspotsButton = () => {
  const dispatch = useDispatch();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const csvProcessing = useSelector(state => state.csvProcessing || {});

  const handleEmergingHotspotsAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      console.log('Starting emerging hotspots analysis request...');
      console.log('Request data:', {
        startDate: csvProcessing.startDate || null,
        endDate: csvProcessing.endDate || null
      });

      const response = await fetch('http://localhost:5000/api/emerging-hotspots/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: csvProcessing.startDate || null,
          endDate: csvProcessing.endDate || null,
          timeInterval: '1W', // Weekly intervals
          timeStep: 3, // 3-week sliding window
          distance: 500 // 500m spatial distance
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error(`Expected JSON response, got: ${contentType}. Response: ${responseText.substring(0, 200)}...`);
      }

      const result = await response.json();
      console.log('Parsed JSON result:', result);
      
      if (result.success) {
        console.log('Emerging hotspots analysis completed:', result.details);
        
        dispatch({ 
          type: 'LOAD_EMERGING_HOTSPOTS_DATA',
          payload: result.data 
        });
        
        toast.success(
          `Emerging hotspots analysis completed successfully!\n`,
          {
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #333333',
              borderRadius: '8px',
              fontWeight: '500'
            },
            progressStyle: {
              background: '#4ade80'
            }
          }
        );
      } else {
        console.error('Emerging hotspots analysis failed:', result.error);
        toast.error(
          `Emerging hotspots analysis failed`,
          {
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              fontWeight: '500'
            },
            progressStyle: {
              background: '#ef4444'
            }
          }
        );
      }
    } catch (error) {
      console.error('Error during emerging hotspots analysis:', error);
      
      if (error.message.includes('fetch')) {
        toast.error(
          'Network error: Could not connect to server',
          {
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              fontWeight: '500'
            },
            progressStyle: {
              background: '#ef4444'
            }
          }
        );
      } else if (error.message.includes('JSON')) {
        toast.error(
          'Server returned invalid response',
          {
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              fontWeight: '500'
            },
            progressStyle: {
              background: '#ef4444'
            }
          }
        );
      } else {
        toast.error(
          `Error during emerging hotspots analysis`,
          {
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              fontWeight: '500'
            },
            progressStyle: {
              background: '#ef4444'
            }
          }
        );
      }
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
        onClick={handleEmergingHotspotsAnalysis}
        disabled={isAnalyzing}
        style={{
          width: '100%',
          padding: '8px 4px',
          backgroundColor: isAnalyzing ? '#555' : '#000',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '4px',
          cursor: isAnalyzing ? 'not-allowed' : 'pointer',
          fontSize: '9px',
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
        title="Generate Emerging Crime Hotspots Analysis"
      >
        {isAnalyzing ? (
          <>
            <div style={spinnerStyle} />
          </>
        ) : (
          'EMERGING'
        )}
      </button>
    </>
  );
};

export default EmergingHotspotsButton;