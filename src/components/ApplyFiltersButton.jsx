import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { processingStarted, processingComplete, processingError } from '../store';
import './ApplyFiltersButton.css';

const ApplyFiltersButton = ({ 
  selectedSeverities, 
  selectedPartOfDay, 
  selectedCityLocation 
}) => {
  const dispatch = useDispatch();
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyFilters = async () => {
    setIsApplying(true);

    try {
      const filterPayload = {
        severities: selectedSeverities.includes('All Levels') ? [] : selectedSeverities,
        partOfDay: selectedPartOfDay.includes('All Times') ? [] : selectedPartOfDay,
        cityLocation: selectedCityLocation,
        isFiltered: true // Add this line to indicate filtering should be applied
      };

      console.log('Applying filters with payload:', filterPayload);
      
      // Trigger the unified processing with filters
      dispatch({ 
        type: 'FETCH_FILTERED_CSV_DATA',
        payload: filterPayload
      });
      
    } catch (error) {
      console.error('Error applying filters:', error);
      dispatch(processingError(error.message));
      setIsApplying(false);
    }
  };

  const hasActiveFilters = () => {
    return !selectedSeverities.includes('All Levels') || 
           !selectedPartOfDay.includes('All Times') || 
           selectedCityLocation !== 'all';
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      <button
        onClick={handleApplyFilters}
        disabled={isApplying}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: hasActiveFilters() 
            ? (isApplying ? 'rgba(30, 187, 214, 0.7)' : 'rgba(30, 187, 214, 0.95)')
            : 'rgba(128, 128, 128, 0.7)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: isApplying ? 'not-allowed' : (hasActiveFilters() ? 'pointer' : 'default'),
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'all 0.2s ease',
          minWidth: '220px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {isApplying && (
          <div
            className="spinner"
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTop: '2px solid white',
              borderRadius: '50%'
            }}
          />
        )}
        {isApplying ? 'Applying Filters...' : 'Apply Filters'}
      </button>
      
      {hasActiveFilters() && (
        <div style={{
          fontSize: '11px',
          color: '#666',
          marginTop: '4px',
          textAlign: 'center'
        }}>
          Active filters detected
        </div>
      )}
    </div>
  );
};

export default ApplyFiltersButton;