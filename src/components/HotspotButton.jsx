import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const HotspotButton = () => {
  const dispatch = useDispatch();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const csvProcessing = useSelector(state => state.csvProcessing || {});

  const handleHotspotAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      console.log('Starting hotspot analysis request...');
      console.log('Request data:', {
        startDate: csvProcessing.startDate || null,
        endDate: csvProcessing.endDate || null
      });

      const response = await fetch('http://localhost:5000/api/hotspot/hotspot-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: csvProcessing.startDate || null,
          endDate: csvProcessing.endDate || null
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is ok and content type is JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error(`Expected JSON response, got: ${contentType}. Response: ${responseText.substring(0, 200)}...`);
      }

      const result = await response.json();
      console.log('Parsed JSON result:', result);
      
      if (result.success) {
        console.log('Hotspot analysis completed:', result.details);
        
        dispatch({ 
          type: 'LOAD_HOTSPOT_DATA',
          payload: result.data 
        });
        
        toast.success(
          `Hotspot analysis completed successfully!\nTotal cells: ${result.details.totalCells}\nHot spots: ${result.details.hotSpots}\nCold spots: ${result.details.coldSpots}`,
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
        console.error('Hotspot analysis failed:', result.error);
        toast.error(
          `Hotspot analysis failed: ${result.error}`,
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
      console.error('Error during hotspot analysis:', error);
      
      // More specific error messages
      if (error.message.includes('fetch')) {
        toast.error(
          'Network error: Could not connect to server. Please check if the backend is running on localhost:5000',
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
          'Server returned invalid response. This usually means the API endpoint is not properly configured. Check the browser console for details.',
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
          `Error during hotspot analysis: ${error.message}`,
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
        onClick={handleHotspotAnalysis}
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
        title="Generate Crime Hotspots"
      >
        {isAnalyzing ? (
          <>
            <div style={spinnerStyle} />
          </>
        ) : (
          'HOT'
        )}
      </button>
    </>
  );
};

export default HotspotButton;
