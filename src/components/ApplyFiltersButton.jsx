import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { processingStarted, processingComplete, processingError, setDateFilter } from '../store';
import './ApplyFiltersButton.css';

const ApplyFiltersButton = ({ 
  selectedSeverities, 
  selectedPartOfDay, 
  selectedCityLocation,
  selectedDateRange,
  selectedMainTypes,
  selectedSubtypes
}) => {
  const dispatch = useDispatch();
  const [isApplying, setIsApplying] = useState(false);

  const validateDateRange = (dateRange) => {
    if (!dateRange || !dateRange.fromDate || !dateRange.toDate) {
      return { isValid: true };
    }

    const startDateTime = `${dateRange.fromDate} ${dateRange.fromTime}:00`;
    const endDateTime = `${dateRange.toDate} ${dateRange.toTime}:59`;
    
    if (new Date(startDateTime) > new Date(endDateTime)) {
      return { 
        isValid: false, 
        error: 'Start date/time must be before end date/time' 
      };
    }

    return { 
      isValid: true, 
      startDateTime, 
      endDateTime 
    };
  };

  const handleApplyFilters = async () => {
    setIsApplying(true);

    try {
      // Validate date range if provided
      const dateValidation = validateDateRange(selectedDateRange);
      if (!dateValidation.isValid) {
        alert(dateValidation.error);
        setIsApplying(false);
        return;
      }

      // Check what filters we have
      const hasDateRange = selectedDateRange?.hasDateRange;
      const hasOtherFilters = !selectedSeverities.includes('All Levels') || 
                             !selectedPartOfDay.includes('All Times') || 
                             selectedCityLocation !== 'all' ||
                             !selectedMainTypes.includes('All Types') ||
                             !selectedSubtypes.includes('All Subtypes');

      if (hasDateRange && hasOtherFilters) {
        // Apply both date range and other filters together
        dispatch(setDateFilter({ 
          startDate: dateValidation.startDateTime, 
          endDate: dateValidation.endDateTime 
        }));

        const filterPayload = {
          startDate: dateValidation.startDateTime,
          endDate: dateValidation.endDateTime,
          severities: selectedSeverities.includes('All Levels') ? [] : selectedSeverities,
          partOfDay: selectedPartOfDay.includes('All Times') ? [] : selectedPartOfDay,
          cityLocation: selectedCityLocation,
          mainTypes: selectedMainTypes.includes('All Types') ? [] : selectedMainTypes,
          subtypes: selectedSubtypes.includes('All Subtypes') ? [] : selectedSubtypes,
          isFiltered: true,
          combinedFiltering: true // Flag to indicate both datetime and other filters
        };

        console.log('Applying combined filters with payload:', filterPayload);
        
        dispatch({ 
          type: 'FETCH_FILTERED_CSV_DATA',
          payload: filterPayload
        });

      } else if (hasDateRange) {
        // Apply only date range filtering
        dispatch(setDateFilter({ 
          startDate: dateValidation.startDateTime, 
          endDate: dateValidation.endDateTime 
        }));

        dispatch({
          type: 'FETCH_CSV_DATA_FILTERED', 
          payload: { 
            startDate: dateValidation.startDateTime, 
            endDate: dateValidation.endDateTime 
          }
        });

      } else if (hasOtherFilters) {
        // Apply only other filters
        const filterPayload = {
          severities: selectedSeverities.includes('All Levels') ? [] : selectedSeverities,
          partOfDay: selectedPartOfDay.includes('All Times') ? [] : selectedPartOfDay,
          cityLocation: selectedCityLocation,
          mainTypes: selectedMainTypes.includes('All Types') ? [] : selectedMainTypes,
          subtypes: selectedSubtypes.includes('All Subtypes') ? [] : selectedSubtypes,
          isFiltered: true
        };

        console.log('Applying other filters with payload:', filterPayload);
        
        dispatch({ 
          type: 'FETCH_FILTERED_CSV_DATA',
          payload: filterPayload
        });

      } else {
        // No filters applied, show all data
        dispatch({ type: 'FETCH_CSV_DATA_INITIAL' });
      }
      
      // Reset applying state after a delay
      setTimeout(() => {
        setIsApplying(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error applying filters:', error);
      dispatch(processingError(error.message));
      setIsApplying(false);
    }
  };

  const hasActiveFilters = () => {
    const hasOtherFilters = !selectedSeverities.includes('All Levels') || 
                           !selectedPartOfDay.includes('All Times') || 
                           selectedCityLocation !== 'all' ||
                           !selectedMainTypes.includes('All Types') ||
                           !selectedSubtypes.includes('All Subtypes');
    
    const hasDateRange = selectedDateRange?.hasDateRange;
    
    return hasOtherFilters || hasDateRange;
  };

  const getButtonText = () => {
    if (isApplying) return 'Applying...';
    
    const hasDateRange = selectedDateRange?.hasDateRange;
    const hasOtherFilters = !selectedSeverities.includes('All Levels') || 
                           !selectedPartOfDay.includes('All Times') || 
                           selectedCityLocation !== 'all' ||
                           !selectedMainTypes.includes('All Types') ||
                           !selectedSubtypes.includes('All Subtypes');
    
    if (hasDateRange && hasOtherFilters) {
      return 'Apply Date & Filters';
    } else if (hasDateRange) {
      return 'Apply Date Range';
    } else if (hasOtherFilters) {
      return 'Apply Filters';
    } else {
      return 'Apply Filters';
    }
  };

  const getStatusText = () => {
    const hasDateRange = selectedDateRange?.hasDateRange;
    const hasOtherFilters = !selectedSeverities.includes('All Levels') || 
                           !selectedPartOfDay.includes('All Times') || 
                           selectedCityLocation !== 'all' ||
                           !selectedMainTypes.includes('All Types') ||
                           !selectedSubtypes.includes('All Subtypes');
    
    const activeFilters = [];
    if (hasDateRange) activeFilters.push('Date Range');
    if (hasOtherFilters) activeFilters.push('Filters');
    
    if (activeFilters.length > 0) {
      return `Active: ${activeFilters.join(' & ')}`;
    }
    return '';
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
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        )}
        {getButtonText()}
      </button>
      
      {hasActiveFilters() && (
        <div style={{
          fontSize: '11px',
          color: '#666',
          marginTop: '4px',
          textAlign: 'center'
        }}>
          {getStatusText()}
        </div>
      )}
    </div>
  );
};

export default ApplyFiltersButton;