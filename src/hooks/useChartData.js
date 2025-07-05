import { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/charts';

export const useChartData = (filters) => {
  const [data, setData] = useState({
    kpi: { total_incidents: 0, most_common_main_event: 'N/A', emergency_incidents_count: 0, average_daily_incidents: 0 },
    temporal: [],
    mainEvent: [],
    severity: [],
    topEvents: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    const { selectedDateRange, selectedMainTypes, selectedSubtypes, selectedSeverities, selectedPartOfDay } = filters;

    // Date range
    if (selectedDateRange?.hasDateRange) {
      params.append('start_date', selectedDateRange.fromDate);
      params.append('end_date', selectedDateRange.toDate);
    } else {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);
      params.append('start_date', startDate.toISOString().split('T')[0]);
      params.append('end_date', endDate.toISOString().split('T')[0]);
    }

    // Filters
    if (selectedMainTypes?.length > 0 && !selectedMainTypes.includes('All Types')) {
      params.append('main_event_type', selectedMainTypes.join(','));
    }
    if (selectedSubtypes?.length > 0 && !selectedSubtypes.includes('All Subtypes')) {
      params.append('sub_event_type', selectedSubtypes.join(','));
    }
    if (selectedSeverities?.length > 0 && !selectedSeverities.includes('All Levels')) {
      params.append('severity_label', selectedSeverities.join(','));
    }
    if (selectedPartOfDay?.length > 0 && !selectedPartOfDay.includes('All Times')) {
      const partOfDayMapping = { 'MORNING': 'Morning', 'AFTERNOON': 'Afternoon', 'EVENING': 'Evening', 'NIGHT': 'Night' };
      const mappedParts = selectedPartOfDay.map(part => partOfDayMapping[part] || part);
      params.append('part_of_day', mappedParts.join(','));
    }

    return params;
  }, [filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const trendMapping = { 'Hourly': 'hourly', 'Daily': 'daily', 'Weekly': 'daily', 'Monthly': 'monthly', 'Yearly': 'yearly' };
      const trendType = trendMapping[filters.selectedTemporalTrend] || 'daily';
      
      const temporalParams = new URLSearchParams(queryParams.toString());
      temporalParams.append('trend_type', trendType);
      temporalParams.append('baseline_options', 'mean_overall');

      const endpoints = [
        `${API_BASE_URL}/kpis?${queryParams.toString()}`,
        `${API_BASE_URL}/trends?${temporalParams.toString()}`,
        `${API_BASE_URL}/main-event-distribution?${queryParams.toString()}`,
        `${API_BASE_URL}/severity-distribution?${queryParams.toString()}`,
        `${API_BASE_URL}/top-main-events?top_n=5&${queryParams.toString()}`
      ];

      const responses = await Promise.all(endpoints.map(url => fetch(url)));
      responses.forEach((response, index) => {
        if (!response.ok) throw new Error(`API ${index + 1} error: ${response.status}`);
      });

      const results = await Promise.all(responses.map(response => response.json()));
      const [kpiResult, temporalResult, mainEventResult, severityResult, topEventsResult] = results;

      setData({
        kpi: kpiResult?.error ? data.kpi : kpiResult,
        temporal: temporalResult?.current_trend || [],
        mainEvent: mainEventResult?.data || [],
        severity: severityResult?.data || [],
        topEvents: topEventsResult?.data || []
      });
    } catch (err) {
      setError(err.message || "Failed to fetch chart data");
    } finally {
      setLoading(false);
    }
  }, [queryParams, filters.selectedTemporalTrend]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};