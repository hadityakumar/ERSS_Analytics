import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { processingStarted, processingComplete, processingError, setDateFilter } from '../store';

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

    // Ensure proper datetime format (YYYY-MM-DD HH:MM:SS)
    const fromTimeParts = dateRange.fromTime.split(':');
    const toTimeParts = dateRange.toTime.split(':');
    
    const startDateTime = `${dateRange.fromDate} ${fromTimeParts[0]}:${fromTimeParts[1]}:00`;
    const endDateTime = `${dateRange.toDate} ${toTimeParts[0]}:${toTimeParts[1]}:59`;
    
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
      const hasDateRange = selectedDateRange?.hasDateRange && 
                          selectedDateRange?.fromDate && 
                          selectedDateRange?.toDate &&
                          dateValidation.isValid;
                          
      console.log('=== DATE RANGE DETECTION ===');
      console.log('selectedDateRange?.hasDateRange:', selectedDateRange?.hasDateRange);
      console.log('selectedDateRange?.fromDate:', selectedDateRange?.fromDate);
      console.log('selectedDateRange?.toDate:', selectedDateRange?.toDate);
      console.log('dateValidation.isValid:', dateValidation.isValid);
      console.log('Final hasDateRange:', hasDateRange);
      
      const hasOtherFilters = (!selectedSeverities.includes('All Levels') && selectedSeverities.length > 0) || 
                             (!selectedPartOfDay.includes('All Times') && selectedPartOfDay.length > 0) || 
                             (selectedCityLocation && selectedCityLocation !== 'all') ||
                             (!selectedMainTypes.includes('All Types') && selectedMainTypes.length > 0) ||
                             (!selectedSubtypes.includes('All Subtypes') && selectedSubtypes.length > 0);

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
          combinedFiltering: true, // Flag to indicate both datetime and other filters
          twoStepFiltering: true // Flag to enable two-step filtering process
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

        console.log('=== APPLY FILTERS DEBUG ===');
        console.log('hasDateRange:', hasDateRange);
        console.log('hasOtherFilters:', hasOtherFilters);
        console.log('dateValidation:', dateValidation);
        console.log('selectedDateRange:', selectedDateRange);
        console.log('selectedSeverities:', selectedSeverities);
        console.log('selectedPartOfDay:', selectedPartOfDay);
        console.log('selectedCityLocation:', selectedCityLocation);
        console.log('selectedMainTypes:', selectedMainTypes);
        console.log('selectedSubtypes:', selectedSubtypes);

        // Ensure clean date-only payload with no filter contamination
        const dateOnlyPayload = {
          startDate: dateValidation.startDateTime,
          endDate: dateValidation.endDateTime,
          severities: [],
          partOfDay: [],
          cityLocation: 'all',
          mainTypes: [],
          subtypes: [],
          isFiltered: false,
          combinedFiltering: false,
          twoStepFiltering: false
        };

        console.log('Applying date-only filters with payload:', dateOnlyPayload);
        
        dispatch({ 
          type: 'FETCH_FILTERED_CSV_DATA',
          payload: dateOnlyPayload
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
    <div>
      <button
        onClick={handleApplyFilters}
        disabled={isApplying}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: hasActiveFilters() 
            ? (isApplying ? '#666' : '#000')
            : '#ccc',
          color: hasActiveFilters() ? '#fff' : '#666',
          border: '1px solid #000',
          borderRadius: '3px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: isApplying ? 'not-allowed' : (hasActiveFilters() ? 'pointer' : 'default'),
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          minHeight: '32px'
        }}
      >
        {isApplying && (
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid transparent',
            borderTop: '2px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
        {getButtonText()}
      </button>
      
      {hasActiveFilters() && (
        <div style={{
          fontSize: '10px',
          color: '#666',
          marginTop: '4px',
          textAlign: 'center'
        }}>
          {getStatusText()}
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ApplyFiltersButton;