import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactLoading from "react-loading";
import { createChartConfigs } from './chart/ChartConfigs';
import ChartHeader from './chart/ChartHeader';
import ChartLegend from './chart/ChartLegend';
import ChartPagination from './chart/ChartPagination';
import ChartLoadingOverlay from './chart/ChartLoadingOverlay';

const API_BASE_URL = 'http://localhost:5000/api/charts';

const ChartPanel = ({
  selectedDateRange,
  selectedTemporalTrend = 'Daily',
  selectedMainTypes,
  selectedSubtypes,
  selectedSeverities,
  selectedPartOfDay,
  selectedDistrict,
  selectedCityLocation
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Chart data states
  const [chartData, setChartData] = useState({
    kpi: {
      total_incidents: 0,
      most_common_main_event: 'N/A',
      emergency_incidents_count: 0,
      average_daily_incidents: 0
    },
    temporal: [],
    mainEvent: [],
    severity: []
  });

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Convert temporal trend type to API format
  const getTrendTypeForAPI = (trendType) => {
    const mapping = {
      'Hourly': 'hourly',
      'Daily': 'daily',
      'Weekly': 'daily', // Weekly is handled as daily trend
      'Monthly': 'monthly',
      'Yearly': 'yearly'
    };
    return mapping[trendType] || 'daily';
  };

  // Build query parameters from current filters - MEMOIZED to prevent infinite loops
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    console.log('Building query params with:', {
      selectedDateRange,
      selectedMainTypes,
      selectedSubtypes,
      selectedSeverities,
      selectedPartOfDay,
      selectedTemporalTrend
    });

    // Date range parameters - Use a more reasonable default date range
    if (selectedDateRange?.hasDateRange) {
      params.append('start_date', selectedDateRange.fromDate);
      params.append('end_date', selectedDateRange.toDate);
      console.log('Using selected date range:', selectedDateRange.fromDate, 'to', selectedDateRange.toDate);
    } else {
      // Use a wider historical range that likely contains data
      const endDate = new Date(); // Today
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      params.append('start_date', startStr);
      params.append('end_date', endStr);
      console.log('Using default historical date range:', startStr, 'to', endStr);
    }

    // Only add filters if they have actual selections (not "All" options)
    if (selectedMainTypes && selectedMainTypes.length > 0 && !selectedMainTypes.includes('All Types')) {
      params.append('main_event_type', selectedMainTypes.join(','));
    }

    if (selectedSubtypes && selectedSubtypes.length > 0 && !selectedSubtypes.includes('All Subtypes')) {
      params.append('sub_event_type', selectedSubtypes.join(','));
    }

    if (selectedSeverities && selectedSeverities.length > 0 && !selectedSeverities.includes('All Levels')) {
      params.append('severity_label', selectedSeverities.join(','));
    }

    if (selectedPartOfDay && selectedPartOfDay.length > 0 && !selectedPartOfDay.includes('All Times')) {
      // Map frontend values to backend values
      const partOfDayMapping = {
        'MORNING': 'Morning',
        'AFTERNOON': 'Afternoon', 
        'EVENING': 'Evening',
        'NIGHT': 'Night'
      };
      const mappedParts = selectedPartOfDay.map(part => partOfDayMapping[part] || part);
      params.append('part_of_day', mappedParts.join(','));
    }

    const finalParams = params.toString();
    console.log('Final query params:', finalParams);
    return params;
  }, [selectedDateRange, selectedMainTypes, selectedSubtypes, selectedSeverities, selectedPartOfDay]);

  // Fetch data from backend
  const fetchChartData = useCallback(async () => {
    console.log('Starting chart data fetch...');
    setLoading(true);
    setError(null);

    try {
      const trendType = getTrendTypeForAPI(selectedTemporalTrend);

      // Add trend type and baseline options for temporal chart
      const temporalParams = new URLSearchParams(queryParams.toString());
      temporalParams.append('trend_type', trendType);
      temporalParams.append('baseline_options', 'mean_overall');

      console.log('Making API calls...');

      // Fetch all chart data with current filters
      const endpoints = [
        `${API_BASE_URL}/kpis?${queryParams.toString()}`,
        `${API_BASE_URL}/trends?${temporalParams.toString()}`,
        `${API_BASE_URL}/main-event-distribution?${queryParams.toString()}`,
        `${API_BASE_URL}/severity-distribution?${queryParams.toString()}`
      ];

      console.log('API endpoints:', endpoints);

      const responses = await Promise.all(endpoints.map(url => 
        fetch(url).then(response => {
          console.log(`Response from ${url}:`, response.status);
          return response;
        })
      ));

      // Check for HTTP errors
      responses.forEach((response, index) => {
        if (!response.ok) {
          throw new Error(`API ${index + 1} error: ${response.status} ${response.statusText}`);
        }
      });

      // Process responses
      const results = await Promise.all(responses.map(response => response.json()));
      
      console.log('API Results:', results);

      const [kpiResult, temporalResult, mainEventResult, severityResult] = results;

      // Update chart data state
      setChartData({
        kpi: (kpiResult && !kpiResult.error) ? kpiResult : {
          total_incidents: 0,
          most_common_main_event: 'N/A',
          emergency_incidents_count: 0,
          average_daily_incidents: 0
        },
        temporal: (temporalResult && !temporalResult.error && temporalResult.current_trend) 
          ? (Array.isArray(temporalResult.current_trend) ? temporalResult.current_trend : [])
          : [],
        mainEvent: (mainEventResult && !mainEventResult.error && mainEventResult.data)
          ? (Array.isArray(mainEventResult.data) ? mainEventResult.data : [])
          : [],
        severity: (severityResult && !severityResult.error && severityResult.data)
          ? (Array.isArray(severityResult.data) ? severityResult.data : [])
          : []
      });

    } catch (err) {
      const errorMessage = err.message || "Failed to fetch chart data";
      console.error("Chart data fetch error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [queryParams, selectedTemporalTrend]);

  // Fetch data when component mounts and when dependencies change
  useEffect(() => {
    console.log('ChartPanel useEffect triggered');
    fetchChartData();
  }, [fetchChartData]);

  // Generate chart configurations using the modular approach
  const charts = useMemo(() => {
    return createChartConfigs(chartData, selectedTemporalTrend);
  }, [chartData, selectedTemporalTrend]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const currentChart = charts[currentPage - 1];

  const handleDownload = () => {
    console.log('Download chart data for page:', currentPage);
    // Implement download functionality
  };

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '536px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#dc3545',
        fontSize: '16px',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#fff'
      }}>
        <p>Error loading chart data:</p>
        <p style={{ fontSize: '14px', color: '#666' }}>{error}</p>
        <button 
          onClick={fetchChartData}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '536px',
      display: 'flex',
      flexDirection: 'row',
      position: 'relative',
      backgroundColor: '#fff'
    }}>
      {/* Main content area */}
      <div style={{
        flex: '1',
        height: '100%',
        padding: '16px',
        paddingRight: '76px', 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#fff',
        position: 'relative'
      }}>
        {/* Loading overlay using ChartLoadingOverlay component */}
        {loading && <ChartLoadingOverlay />}

        <ChartHeader title={currentChart.title} description={currentChart.description} />
        
        {/* Chart and Legend container - Scrollable */}
        <div style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          overflow: 'auto',
          minHeight: 0,
          backgroundColor: '#fff'
        }}>
          {/* Chart area */}
          <div style={{
            flex: '1',
            minHeight: '200px',
            backgroundColor: '#fff',
            borderRadius: '4px',
            padding: '8px',
            border: '1px solid #ddd'
          }}>
            {currentChart.component}
          </div>
          <ChartLegend legend={currentChart.legend} />
        </div>
      </div>
      
      <ChartPagination
        currentPage={currentPage}
        totalPages={charts.length}
        onPageChange={setCurrentPage}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default ChartPanel;