import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

// Define consistent colors for chart elements
const CHART_COLORS = [
    '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#20c997', '#fd7e14', '#e83e8c', '#6c757d', '#17a2b8',
    '#6610f2', '#ff69b4', '#00bfff', '#adff2f', '#ff4500', '#8a2be2', '#7fff00', '#d2691e', '#ff7f50', '#6495ed'
];

const BASELINE_COLORS = {
    'Mean_Overall': '#8884d8', // Light Purple
    'Last_Period': '#ff7300',  // Orange
    'Previous_Year': '#00c49f' // Teal
};

function App() {
    const [trendType, setTrendType] = useState('hourly');
    const [startDate, setStartDate] = useState(null); // Initialize as null
    const [endDate, setEndDate] = useState(null);     // Initialize as null
    const [selectedDatePreset, setSelectedDatePreset] = useState(null); // Initialize as null for controlled flow
    const [selectedPartsOfDay, setSelectedPartsOfDay] = useState([]);
    const [selectedMainEventTypes, setSelectedMainEventTypes] = useState([]);
    const [selectedSubEventTypes, setSelectedSubEventTypes] = useState([]);
    const [selectedSeverityLabels, setSelectedSeverityLabels] = useState([]);
    const [selectedBaselineOptions, setSelectedBaselineOptions] = useState([]);

    // State for Last Period custom date range
    const [lastPeriodStartDate, setLastPeriodStartDate] = useState(null);
    const [lastPeriodEndDate, setLastPeriodEndDate] = useState(null);

    // NEW: State for Mean Overall custom date range
    const [meanOverallStartDate, setMeanOverallStartDate] = useState(null);
    const [meanOverallEndDate, setMeanOverallEndDate] = useState(null);

    // NEW: State for selected charts to display
    const [selectedCharts, setSelectedCharts] = useState([
        'kpis', 'temporalTrend', 'mainEventTypeDistribution', 'severityDistribution',
        'eventByPartOfDay', 'topMainEventTypes'
    ]); // Default: all charts selected

    const [metadata, setMetadata] = useState({
        main_event_types: [],
        sub_event_types: [],
        severity_labels: ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'], // Static, can be fetched if dynamic
        parts_of_day: ['Morning', 'Afternoon', 'Evening', 'Night'], // Static, can be fetched if dynamic
        min_date: null,
        max_date: null,
    });

    const [filteredSubEventTypesOptions, setFilteredSubEventTypesOptions] = useState([]);

    const [kpiData, setKpiData] = useState({
        total_incidents: 0,
        most_common_main_event: 'N/A',
        emergency_incidents_count: 0,
        average_daily_incidents: 0
    });
    const [topMainEventTypesData, setTopMainEventTypesData] = useState([]);

    const [temporalChartData, setTemporalChartData] = useState([]);
    const [temporalChartBaselines, setTemporalChartBaselines] = useState({});
    const [temporalChartTitle, setTemporalChartTitle] = useState("Incident Trends");
    const [temporalXAxisLabel, setTemporalXAxisLabel] = useState("");
    const [temporalYAxisLabel, setTemporalYAxisLabel] = useState("Number of Incidents");
    const [currentPeriodRangeDisplay, setCurrentPeriodRangeDisplay] = useState('N/A'); // New state for current period range

    const [mainEventTypeDistributionData, setMainEventTypeDistributionData] = useState([]);
    const [severityDistributionData, setSeverityDistributionData] = useState([]);
    // === FIX START ===
    const [eventByPartOfDayData, setEventByPartOfDayData] = useState([]);
    // === FIX END ===
    const [eventByPartOfDayKeys, setEventByPartOfDayKeys] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // === NEW: LLM Insight States for ALL Charts ===
    const [kpiInsight, setKpiInsight] = useState('');
    const [mainEventTypeDistributionInsight, setMainEventTypeDistributionInsight] = useState('');
    const [severityDistributionInsight, setSeverityDistributionInsight] = useState('');
    const [eventByPartOfDayInsight, setEventByPartOfDayInsight] = useState('');
    const [topMainEventTypesInsight, setTopMainEventTypesInsight] = useState('');
    const [temporalTrendInsight, setTemporalTrendInsight] = useState('');
    
    const [loadingInsight, setLoadingInsight] = useState(false); // Unified loading state for insight fetching
    const [insightError, setInsightError] = useState(null);
    // =======================================================


    // --- NEW: Function to Fetch Insight from Flask API ---
    // This function is made generic to update any insight state
    const fetchChartInsight = useCallback(async (chartData, chartTitle, chartType, filters, setTargetInsightState) => {
        setLoadingInsight(true);
        setInsightError(null);
        setTargetInsightState('Generating insights...'); // Set loading message for the specific chart

        const INSIGHT_API_ENDPOINT = `${API_BASE_URL}/generate-insight`; // Now points to your Express LLM endpoint

        if (!chartData || chartData.length === 0) {
            setTargetInsightState('No data available to generate insight.');
            setLoadingInsight(false);
            return;
        }

        try {
            const response = await fetch(INSIGHT_API_ENDPOINT, { // Use the updated endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chart_title: chartTitle,
                    chart_type: chartType,
                    data: chartData,
                    filters: filters
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            if (result.insight) {
                setTargetInsightState(result.insight);
            } else {
                setInsightError(result.error || 'No insight generated.');
                setTargetInsightState('Failed to generate insight: No insight in response.');
            }
        } catch (err) {
            console.error(`Error fetching LLM insight for "${chartTitle}":`, err);
            setInsightError(err.message);
            setTargetInsightState(`Failed to generate insight: ${err.message}`);
        } finally {
            setLoadingInsight(false);
        }
    }, [API_BASE_URL]);


    // --- Core Data Fetcher for Charts and KPIs ---
    const fetchDataForCharts = useCallback(async () => {
        // IMPORTANT: Only proceed if startDate and endDate are valid Date objects
        if (!startDate || !endDate || !(startDate instanceof Date) || !(endDate instanceof Date)) {
            console.log("Waiting for valid start and end dates to fetch chart data.");
            return;
        }

        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        // Ensure dates are correctly formatted before appending to URL
        queryParams.append('start_date', startDate.toISOString().split('T')[0]);
        queryParams.append('end_date', endDate.toISOString().split('T')[0]);
        if (selectedPartsOfDay.length > 0) queryParams.append('part_of_day', selectedPartsOfDay.join(','));
        if (selectedMainEventTypes.length > 0) queryParams.append('main_event_type', selectedMainEventTypes.join(','));
        if (selectedSubEventTypes.length > 0) queryParams.append('sub_event_type', selectedSubEventTypes.join(','));
        if (selectedSeverityLabels.length > 0) queryParams.append('severity_label', selectedSeverityLabels.join(','));
        // Add selected baselines to query params (as a comma-separated string for backend)
        if (selectedBaselineOptions.length > 0) queryParams.append('baseline_options', selectedBaselineOptions.join(','));

        // Add last_period_start_date and last_period_end_date if 'last_period' baseline is selected
        if (selectedBaselineOptions.includes('last_period') && lastPeriodStartDate) {
            queryParams.append('last_period_start_date', lastPeriodStartDate.toISOString().split('T')[0]);
        }
        if (selectedBaselineOptions.includes('last_period') && lastPeriodEndDate) {
            queryParams.append('last_period_end_date', lastPeriodEndDate.toISOString().split('T')[0]);
        }

        // NEW: Add mean_overall_start_date and mean_overall_end_date if 'mean_overall' baseline is selected
        if (selectedBaselineOptions.includes('mean_overall') && meanOverallStartDate) {
            queryParams.append('mean_overall_start_date', meanOverallStartDate.toISOString().split('T')[0]);
        }
        if (selectedBaselineOptions.includes('mean_overall') && meanOverallEndDate) {
            queryParams.append('mean_overall_end_date', meanOverallEndDate.toISOString().split('T')[0]);
        }

        try {
            // Fetch KPI Data (only if selected)
            if (selectedCharts.includes('kpis')) {
                const kpiResponse = await fetch(`${API_BASE_URL}/kpis?${queryParams.toString()}`);
                const kpiResult = await kpiResponse.json();
                if (kpiResponse.ok && !kpiResult.error) {
                    setKpiData(kpiResult);
                    // --- NEW: Call fetchChartInsight for KPIs ---
                    fetchChartInsight(
                        [kpiResult], // KPIs are single object, wrap in array for consistency with other chart data
                        "Key Performance Indicators",
                        "KPIs", // Custom type for KPIs
                        {
                            'Date Range': `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
                            'Total Incidents': kpiResult.total_incidents,
                            'Most Common Event': kpiResult.most_common_main_event,
                            'Emergency Incidents': kpiResult.emergency_incidents_count,
                            'Average Daily Incidents': kpiResult.average_daily_incidents.toFixed(2)
                        },
                        setKpiInsight
                    );
                    // --- END NEW ---
                } else {
                    throw new Error(kpiResult.error || "Failed to fetch KPI data.");
                }
            } else {
                setKpiData({ total_incidents: 0, most_common_main_event: 'N/A', emergency_incidents_count: 0, average_daily_incidents: 0 }); // Clear if not selected
                setKpiInsight(''); // Clear insight if chart not selected
            }


            // Fetch Top Main Event Types (only if selected)
            if (selectedCharts.includes('topMainEventTypes')) {
                const topEventsResponse = await fetch(`${API_BASE_URL}/top-main-events?top_n=5&${queryParams.toString()}`);
                const topEventsResult = await topEventsResponse.json();
                if (topEventsResponse.ok && !topEventsResult.error) {
                    setTopMainEventTypesData(Array.isArray(topEventsResult.data) ? topEventsResult.data : []);
                    // --- NEW: Call fetchChartInsight for Top Main Event Types ---
                    fetchChartInsight(
                        Array.isArray(topEventsResult.data) ? topEventsResult.data : [],
                        "Top 5 Most Common Main Event Types",
                        "Bar Chart",
                        {
                            'Date Range': `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
                        },
                        setTopMainEventTypesInsight
                    );
                    // --- END NEW ---
                } else {
                    throw new Error(topEventsResult.error || "Failed to fetch top main event types.");
                }
            } else {
                setTopMainEventTypesData([]); // Clear if not selected
                setTopMainEventTypesInsight(''); // Clear insight if chart not selected
            }


            // Fetch Temporal Trend Data and Baselines (only if selected)
            if (selectedCharts.includes('temporalTrend')) {
                const trendResponse = await fetch(`${API_BASE_URL}/trends?trend_type=${trendType}&${queryParams.toString()}`);
                const trendResult = await trendResponse.json();
                if (trendResponse.ok && !trendResult.error) {
                    setTemporalChartData(Array.isArray(trendResult.current_trend) ? trendResult.current_trend : []);

                    // Correctly process baselines to handle both direct arrays and objects with 'data'
                    const processedBaselines = {};
                    if (trendResult.baselines) {
                        for (const key in trendResult.baselines) {
                            if (Object.prototype.hasOwnProperty.call(trendResult.baselines, key)) {
                                const baselineValue = trendResult.baselines[key];
                                if (Array.isArray(baselineValue)) {
                                    // If baselineValue is directly an array (older backend format)
                                    processedBaselines[key] = { data: baselineValue, period_range: 'N/A' }; // Default period_range
                                } else if (typeof baselineValue === 'object' && baselineValue !== null && Array.isArray(baselineValue.data)) {
                                    // If baselineValue is an object with 'data' and 'period_range' (newer backend format)
                                    processedBaselines[key] = {
                                        data: baselineValue.data,
                                        period_range: baselineValue.period_range || 'N/A'
                                    };
                                } else {
                                    console.warn(`Baseline object for key "${key}" is not correctly structured, defaulting to empty:`, trendResult.baselines[key]);
                                    processedBaselines[key] = { data: [], period_range: 'N/A' };
                                }
                            }
                        }
                    }
                    setTemporalChartBaselines(processedBaselines);

                    setTemporalChartTitle(trendResult.title);
                    setTemporalXAxisLabel(trendResult.x_axis_label);
                    setTemporalYAxisLabel(trendResult.y_axis_label);
                    // Set the current period range display if provided by backend
                    setCurrentPeriodRangeDisplay(trendResult.current_period_range || 'N/A'); // Assuming backend provides this

                    // --- Call fetchChartInsight for Temporal Trend ---
                    fetchChartInsight(
                        trendResult.current_trend, // Use the raw current trend data for insight
                        trendResult.title,
                        'line', // 'line' is appropriate for temporal trends for insight generation
                        {
                            'Date Range': `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
                            'Granularity': trendType.charAt(0).toUpperCase() + trendType.slice(1) // Capitalize first letter
                        },
                        setTemporalTrendInsight
                    );
                } else {
                    throw new Error(trendResult.error || "Failed to fetch temporal trend data.");
                }
            } else {
                setTemporalChartData([]);
                setTemporalChartBaselines({});
                setCurrentPeriodRangeDisplay('N/A');
                setTemporalTrendInsight(''); // Clear insight if chart not selected
            }


            // Fetch Main Event Distribution (only if selected)
            if (selectedCharts.includes('mainEventTypeDistribution')) {
                const mainEventResponse = await fetch(`${API_BASE_URL}/main-event-distribution?${queryParams.toString()}`);
                const mainEventResult = await mainEventResponse.json();
                if (mainEventResponse.ok && !mainEventResult.error) {
                    setMainEventTypeDistributionData(Array.isArray(mainEventResult.data) ? mainEventResult.data : []);
                    // --- NEW: Call fetchChartInsight for Main Event Distribution ---
                    fetchChartInsight(
                        Array.isArray(mainEventResult.data) ? mainEventResult.data : [],
                        mainEventResult.title, // Use title from backend
                        "Bar Chart",
                        {
                            'Date Range': `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
                        },
                        setMainEventTypeDistributionInsight
                    );
                    // --- END NEW ---
                } else {
                    throw new Error(mainEventResult.error || "Failed to fetch main event distribution data.");
                }
            } else {
                setMainEventTypeDistributionData([]); // Clear if not selected
                setMainEventTypeDistributionInsight(''); // Clear insight if chart not selected
            }


            // Fetch Severity Distribution (only if selected)
            if (selectedCharts.includes('severityDistribution')) {
                const severityResponse = await fetch(`${API_BASE_URL}/severity-distribution?${queryParams.toString()}`);
                const severityResult = await severityResponse.json();
                if (severityResponse.ok && !severityResult.error) {
                    setSeverityDistributionData(Array.isArray(severityResult.data) ? severityResult.data : []);
                    // --- NEW: Call fetchChartInsight for Severity Distribution ---
                    fetchChartInsight(
                        Array.isArray(severityResult.data) ? severityResult.data : [],
                        "Incident Severity Distribution", // Hardcoded title as per your example
                        "Pie Chart", // Assuming it's always a Pie chart
                        {
                            'Date Range': `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
                        },
                        setSeverityDistributionInsight
                    );
                    // --- END NEW ---
                } else {
                    throw new Error(severityResult.error || "Failed to fetch severity distribution data.");
                }
            } else {
                setSeverityDistributionData([]); // Clear if not selected
                setSeverityDistributionInsight(''); // Clear insight if chart not selected
            }


            // Fetch Event by Part of Day (only if selected)
            if (selectedCharts.includes('eventByPartOfDay')) {
                const eventByPartOfDayResponse = await fetch(`${API_BASE_URL}/event-by-part-of-day?${queryParams.toString()}`);
                const eventByPartOfDayResult = await eventByPartOfDayResponse.json();
                if (eventByPartOfDayResponse.ok && !eventByPartOfDayResult.error) {
                    setEventByPartOfDayData(Array.isArray(eventByPartOfDayResult.data) ? eventByPartOfDayResult.data : []);
                    setEventByPartOfDayKeys(Array.isArray(eventByPartOfDayResult.keys) ? eventByPartOfDayResult.keys : []);
                    // --- NEW: Call fetchChartInsight for Event by Part of Day ---
                    fetchChartInsight(
                        Array.isArray(eventByPartOfDayResult.data) ? eventByPartOfDayResult.data : [],
                        "Trends of Top Main Event Types by Part of Day", // Hardcoded title as per your example
                        "Line Chart", // Assuming it's always a Line chart
                        {
                            'Date Range': `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
                            'Main Event Types Displayed': eventByPartOfDayResult.keys ? eventByPartOfDayResult.keys.join(', ') : 'N/A'
                        },
                        setEventByPartOfDayInsight
                    );
                    // --- END NEW ---
                } else {
                    throw new Error(eventByPartOfDayResult.error || "Failed to fetch event by part of day data.");
                }
            } else {
                setEventByPartOfDayData([]); // Clear if not selected
                setEventByPartOfDayKeys([]); // Clear if not selected
                setEventByPartOfDayInsight(''); // Clear insight if chart not selected
            }


        } catch (err) {
            setError(err.message || "Network error or API is unreachable. Please check console for more details.");
            console.error("Fetch error:", err);
            // Reset all data states on error to clear charts
            setKpiData({ total_incidents: 0, most_common_main_event: 'N/A', emergency_incidents_count: 0, average_daily_incidents: 0 });
            setTopMainEventTypesData([]);
            setTemporalChartData([]);
            setTemporalChartBaselines({});
            setMainEventTypeDistributionData([]);
            setSeverityDistributionData([]);
            setEventByPartOfDayData([]);
            setEventByPartOfDayKeys([]);
            setCurrentPeriodRangeDisplay('N/A'); // Reset current period display on error
            // Also reset insight states on error
            setKpiInsight('');
            setMainEventTypeDistributionInsight('');
            setSeverityDistributionInsight('');
            setEventByPartOfDayInsight('');
            setTopMainEventTypesInsight('');
            setTemporalTrendInsight('');
            setInsightError(null);
            setLoadingInsight(false);
        } finally {
            setLoading(false);
        }
    }, [
        trendType, startDate, endDate, selectedPartsOfDay,
        selectedMainEventTypes, selectedSubEventTypes, selectedSeverityLabels,
        selectedBaselineOptions, lastPeriodStartDate, lastPeriodEndDate,
        meanOverallStartDate, meanOverallEndDate, selectedCharts,
        fetchChartInsight, // Add fetchChartInsight to dependencies
        // Add all insight setter functions to dependencies for useCallback stability
        setKpiInsight, setMainEventTypeDistributionInsight, setSeverityDistributionInsight,
        setEventByPartOfDayInsight, setTopMainEventTypesInsight, setTemporalTrendInsight
    ]);

    // --- Fetch Metadata (on initial load only) and trigger initial data fetch ---
    useEffect(() => {
        const fetchMetadataAndInitialData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/metadata`);
                const meta = await response.json();
                if (!meta.error) {
                    const fetchedMinDate = meta.min_date ? new Date(meta.min_date) : null;
                    const fetchedMaxDate = meta.max_date ? new Date(meta.max_date) : null;

                    setMetadata(prev => ({
                        ...prev,
                        main_event_types: meta.main_event_types || [],
                        sub_event_types: meta.sub_event_types || [],
                        severity_labels: meta.severity_labels || ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'], // Ensure default if not from backend
                        parts_of_day: meta.parts_of_day || ['Morning', 'Afternoon', 'Evening', 'Night'], // Ensure default if not from backend
                        min_date: fetchedMinDate,
                        max_date: fetchedMaxDate,
                    }));

                    setFilteredSubEventTypesOptions(meta.sub_event_types || []);

                    // Only set initial dates and preset if they haven't been set by user interaction
                    if (startDate === null && endDate === null && fetchedMinDate && fetchedMaxDate) {
                        setStartDate(fetchedMinDate);
                        setEndDate(fetchedMaxDate);
                        setSelectedDatePreset('all_time'); // This will trigger the fetchDataForCharts useEffect
                    }
                } else {
                    console.error("Metadata API error:", meta.error);
                    setError("Failed to load initial metadata: " + meta.error);
                }
            } catch (err) {
                console.error("Error fetching metadata:", err);
                setError("Network error fetching metadata or API is unreachable.");
            }
        };
        fetchMetadataAndInitialData();
    }, []); // Empty dependency array ensures this runs only once on mount

    // This useEffect will react to changes in fetchDataForCharts (due to its dependencies)
    // and implements debouncing for filter changes.
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchDataForCharts();
        }, 300); // Debounce time

        return () => {
            clearTimeout(handler);
        };
    }, [fetchDataForCharts]); // fetchDataForCharts is a useCallback, its dependencies ensure reruns

    const resetFilters = useCallback(() => {
        setTrendType('hourly');
        // Reset to metadata dates for 'all_time'
        setStartDate(metadata.min_date);
        setEndDate(metadata.max_date);
        setSelectedDatePreset('all_time'); // This will trigger a re-fetch via the useEffect
        setSelectedPartsOfDay([]);
        setSelectedMainEventTypes([]);
        setSelectedSubEventTypes([]);
        setSelectedSeverityLabels([]);
        setSelectedBaselineOptions([]);
        setLastPeriodStartDate(null); // Reset last period custom dates
        setLastPeriodEndDate(null);   // Reset last period custom dates
        setMeanOverallStartDate(null); // NEW: Reset mean overall custom dates
        setMeanOverallEndDate(null);   // NEW: Reset mean overall custom dates
        setSelectedCharts([
            'kpis', 'temporalTrend', 'mainEventTypeDistribution', 'severityDistribution',
            'eventByPartOfDay', 'topMainEventTypes'
        ]); // Reset chart selections
        setError(null);
        // Reset insight states on filter reset
        setKpiInsight('');
        setMainEventTypeDistributionInsight('');
        setSeverityDistributionInsight('');
        setEventByPartOfDayInsight('');
        setTopMainEventTypesInsight('');
        setTemporalTrendInsight('');
        setInsightError(null);
        setLoadingInsight(false);
    }, [metadata.min_date, metadata.max_date]); // Dependencies for useCallback

    const handleDatePresetChange = (preset) => {
        setSelectedDatePreset(preset);
        const today = new Date();
        let newStartDate = null;
        let newEndDate = today;

        switch (preset) {
            case 'last_7_days':
                newStartDate = new Date(today);
                newStartDate.setDate(today.getDate() - 7);
                break;
            case 'last_30_days':
                newStartDate = new Date(today);
                newStartDate.setDate(today.getDate() - 30);
                break;
            case 'this_month':
                newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'last_month':
                newStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                newEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'this_year':
                newStartDate = new Date(today.getFullYear(), 0, 1);
                break;
            case 'last_year':
                newStartDate = new Date(today.getFullYear() - 1, 0, 1);
                newEndDate = new Date(today.getFullYear() - 1, 11, 31);
                break;
            case 'all_time':
                newStartDate = metadata.min_date; // Use metadata dates
                newEndDate = metadata.max_date;   // Use metadata dates
                break;
            default:
                break;
        }
        setStartDate(newStartDate);
        setEndDate(newEndDate);
    };

    const downloadFilteredDataAsCsv = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('start_date', startDate.toISOString().split('T')[0]);
            if (endDate) queryParams.append('end_date', endDate.toISOString().split('T')[0]);
            if (selectedPartsOfDay.length > 0) queryParams.append('part_of_day', selectedPartsOfDay.join(','));
            if (selectedMainEventTypes.length > 0) queryParams.append('main_event_type', selectedMainEventTypes.join(','));
            if (selectedSubEventTypes.length > 0) queryParams.append('sub_event_type', selectedSubEventTypes.join(','));
            if (selectedSeverityLabels.length > 0) queryParams.append('severity_label', selectedSeverityLabels.join(','));

            const response = await fetch(`${API_BASE_URL}/filtered-raw-data?${queryParams.toString()}`);
            const result = await response.json();

            if (response.ok && !result.error && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data;
                const header = Object.keys(data[0]).join(',');
                const rows = data.map(obj => Object.values(obj).map(val => {
                    if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                        return `"${val.replace(/"/g, '""')}"`;
                    }
                    return val;
                }).join(','));

                const csvContent = [header, ...rows].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', 'filtered_incident_data.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert(result.error || "No data to download or an error occurred.");
            }
        } catch (err) {
            console.error("Error downloading data:", err);
            alert("Failed to download data: " + (err.message || "Network error."));
        }
    };

    const CustomRechartsTooltip = ({ active, payload, label, xAxisLabelDynamic }) => {
        if (active && payload && payload.length) {
            let formattedLabel = label;
            let displayLabel = xAxisLabelDynamic;

            if (displayLabel === 'Hour of Day (24-hour)') displayLabel = 'Hour of Day (24-hour)';
            else if (displayLabel === 'Day of Week') displayLabel = 'Day of Week';
            else if (displayLabel === 'Month') displayLabel = 'Month';
            else if (displayLabel === 'Year') displayLabel = 'Year';

            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{`${displayLabel}: ${formattedLabel}`}</p>
                    {payload.map((p, index) => (
                        <p key={index} className="tooltip-value" style={{ color: p.stroke || p.fill }}>
                            {`${p.name || p.dataKey || 'Value'}: ${p.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const ChartRenderer = ({
        data,
        chartType,
        dataKey,
        yAxisLabel,
        xAxisLabel,
        title,
        bars = [],
        lines = [],
        pieSlices = [],
        keys = [],
        isTemporalChart = false,
        // No insight props here, insights are rendered outside this generic component
    }) => {
        const defaultChartMargin = { top: 20, right: 30, left: 20, bottom: 30 };

        const commonAxisProps = {
            fontSize: 12,
            tickLine: false,
            axisLine: { stroke: '#ddd' },
            fill: '#555',
            angle: 0,
            textAnchor: 'middle',
            height: 30,
        };

        const xAxisProps = {
            ...commonAxisProps,
            ...(chartType === 'bar' || chartType === 'stackedBar' || (isTemporalChart && (trendType === 'daily' || trendType === 'monthly' || trendType === 'yearly'))) && {
                angle: -45,
                textAnchor: 'end',
                height: 80,
                interval: 0,
            }
        };

        const yAxisProps = {
            ...commonAxisProps,
            label: { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: -10, dy: 10 },
        };

        if (!data || data.length === 0) {
            return (
                <div className="chart-card">
                    <h3 className="chart-card-title">{title}</h3>
                    <div className="chart-message">
                        No data available for this chart with selected filters.
                    </div>
                </div>
            );
        }

        let chartComponent;
        if (chartType === 'line') {
            chartComponent = (
                <LineChart data={data} margin={defaultChartMargin}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey={dataKey} {...xAxisProps} label={{ value: xAxisLabel, position: 'bottom', offset: 0 }} />
                    <YAxis {...yAxisProps} />
                    <Tooltip content={<CustomRechartsTooltip xAxisLabelDynamic={xAxisLabel} />} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    {lines.map((line, idx) => (
                        <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            stroke={line.stroke || CHART_COLORS[idx % CHART_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name={line.name || line.key}
                            strokeDasharray={line.dash ? "5 5" : undefined}
                        />
                    ))}
                </LineChart>
            );
        } else if (chartType === 'bar') {
            chartComponent = (
                <BarChart data={data} margin={defaultChartMargin}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey={dataKey} {...xAxisProps} label={{ value: xAxisLabel, position: 'bottom', offset: 0 }} />
                    <YAxis {...yAxisProps} />
                    <Tooltip content={<CustomRechartsTooltip xAxisLabelDynamic={xAxisLabel} />} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    {bars.map((bar, idx) => (
                        <Bar
                            key={bar.key}
                            dataKey={bar.key}
                            fill={bar.fill || CHART_COLORS[idx % CHART_COLORS.length]}
                            name={bar.name || bar.key}
                        />
                    ))}
                </BarChart>
            );
        } else if (chartType === 'stackedBar') {
            chartComponent = (
                <BarChart data={data} layout="vertical" margin={defaultChartMargin}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" {...commonAxisProps} label={{ value: yAxisLabel, position: 'bottom', offset: 0 }} />
                    <YAxis dataKey={dataKey} type="category" {...xAxisProps} label={{ value: xAxisLabel, angle: -90, position: 'insideLeft', offset: -10 }} />
                    <Tooltip content={<CustomRechartsTooltip xAxisLabelDynamic={xAxisLabel} />} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    {keys.map((key, idx) => (
                        <Bar
                            key={key}
                            dataKey={key}
                            stackId="a"
                            fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            name={key}
                        />
                    ))}
                </BarChart>
            );
        } else if (chartType === 'pie') {
            chartComponent = (
                <PieChart margin={defaultChartMargin}>
                    <Pie
                        data={data}
                        dataKey={pieSlices[0]?.dataKey || 'Count'}
                        nameKey={pieSlices[0]?.nameKey || 'Name'}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                </PieChart>
            );
        }

        return (
            <div className="chart-card">
                <h3 className="chart-card-title">{title}</h3>
                <ResponsiveContainer width="100%" height="100%">
                    {chartComponent}
                </ResponsiveContainer>
            </div>
        );
    };

    const handleBaselineChange = (e) => {
        const { value, checked } = e.target;
        setSelectedBaselineOptions(prev => {
            const newOptions = checked ? [...prev, value] : prev.filter(option => option !== value);
            if (value === 'last_period' && !checked) {
                setLastPeriodStartDate(null);
                setLastPeriodEndDate(null);
            }
            if (value === 'mean_overall' && !checked) {
                setMeanOverallStartDate(null);
                setMeanOverallEndDate(null);
            }
            return newOptions;
        });
    };

    const handleChartSelectionChange = (e) => {
        setSelectedCharts(
            Array.from(e.target.selectedOptions, (option) => option.value)
        );
    };

    // --- REVISED: renderTemporalTrendChart useMemo (includes insight display) ---
    const renderTemporalTrendChart = useMemo(() => {
        if (loading) return <div className="chart-message">Loading temporal trend data...</div>;

        let dataKey;
        if (trendType === 'hourly') dataKey = 'Hour of Day (24-hour)';
        else if (trendType === 'daily') dataKey = 'Day of Week';
        else if (trendType === 'monthly') dataKey = 'Month';
        else if (trendType === 'yearly') dataKey = 'Year';
        else dataKey = 'Date';

        const combinedDataMap = new Map();
        if (Array.isArray(temporalChartData)) {
            temporalChartData.forEach(item => {
                combinedDataMap.set(String(item[dataKey]), { ...item });
            });
        }

        Object.keys(temporalChartBaselines).forEach(baselineKey => {
            const baselineObj = temporalChartBaselines[baselineKey];
            const baselineData = Array.isArray(baselineObj.data) ? baselineObj.data : [];
            baselineData.forEach(baselinePoint => {
                const keyValue = String(baselinePoint[dataKey]);
                if (combinedDataMap.has(keyValue)) {
                    const existingPoint = combinedDataMap.get(keyValue);
                    existingPoint[baselineKey] = baselinePoint[baselineKey];
                } else {
                    const newPoint = { [dataKey]: baselinePoint[dataKey], Count: 0 };
                    newPoint[baselineKey] = baselinePoint[baselineKey];
                    combinedDataMap.set(keyValue, newPoint);
                }
            });
        });

        let combinedData = Array.from(combinedDataMap.values());

        if (trendType === 'hourly') {
            combinedData.sort((a, b) => parseInt(a[dataKey]) - parseInt(b[dataKey]));
        } else if (trendType === 'daily') {
            const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            combinedData.sort((a, b) => dayOrder.indexOf(a[dataKey]) - dayOrder.indexOf(b[dataKey]));
        } else if (trendType === 'monthly') {
             const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
             combinedData.sort((a, b) => monthOrder.indexOf(a[dataKey]) - monthOrder.indexOf(b[dataKey]));
        } else if (trendType === 'yearly') {
            combinedData.sort((a, b) => parseInt(a[dataKey]) - parseInt(b[dataKey]));
        } else {
            combinedData.sort((a, b) => new Date(a[dataKey]) - new Date(b[dataKey]));
        }

        const linesConfig = [{ key: 'Count', name: 'Incidents' }];
        selectedBaselineOptions.forEach(option => {
            const displayKey = option.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
            linesConfig.push({
                key: displayKey,
                name: displayKey.replace(/_/g, ' '),
                stroke: BASELINE_COLORS[displayKey] || '#ccc',
                dash: true
            });
        });

        const hasData = combinedData && combinedData.length > 0;

        return (
            <div className="chart-card">
                <h3 className="chart-card-title">{temporalChartTitle}</h3>
                {/* Insight Display for Temporal Trend */}
                {loadingInsight ? (
                    <p className="chart-insight-text">Generating insights...</p>
                ) : insightError ? (
                    <p className="chart-insight-text error-message-small">Insight Error: {insightError}</p>
                ) : (
                    <p className="chart-insight-text">{temporalTrendInsight}</p>
                )}
                {/* End Insight Display */}

                {loading ? (
                    <div className="chart-message">Loading temporal trend data...</div>
                ) : !hasData ? (
                    <div className="chart-message">No temporal trend data available for selected filters.</div>
                ) : (
                    <>
                        <p className="chart-subtitle" style={{ paddingLeft: '20px', paddingTop: '10px' }}>
                            Current Period: {currentPeriodRangeDisplay}
                            {Object.entries(temporalChartBaselines).map(([key, baselineObj]) => (
                                baselineObj && baselineObj.period_range && baselineObj.period_range !== 'N/A' && (
                                    <span key={key} style={{ marginLeft: '15px', color: BASELINE_COLORS[key] }}>
                                        | {key.replace(/_/g, ' ')} Baseline: {baselineObj.period_range}
                                    </span>
                                )
                            ))}
                        </p>
                        <ResponsiveContainer width="100%" height="100%">
                            {
                                (selectedBaselineOptions.length > 0 || trendType === 'hourly' || trendType === 'monthly' || trendType === 'yearly') ? (
                                    <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey={dataKey}
                                            angle={['daily', 'monthly', 'yearly'].includes(trendType) ? -45 : 0}
                                            textAnchor={['daily', 'monthly', 'yearly'].includes(trendType) ? 'end' : 'middle'}
                                            height={['daily', 'monthly', 'yearly'].includes(trendType) ? 80 : 30}
                                            interval={0}
                                        />
                                        <YAxis label={{ value: temporalYAxisLabel, angle: -90, position: 'insideLeft', offset: -10, dy: 10 }} />
                                        <Tooltip content={<CustomRechartsTooltip xAxisLabelDynamic={temporalXAxisLabel} />} />
                                        <Legend />
                                        {linesConfig.map((line, idx) => (
                                            <Line
                                                key={line.key}
                                                type="monotone"
                                                dataKey={line.key}
                                                stroke={line.stroke || CHART_COLORS[idx % CHART_COLORS.length]}
                                                strokeWidth={2}
                                                dot={line.key === 'Count' ? { r: 4 } : false}
                                                activeDot={line.key === 'Count' ? { r: 6 } : false}
                                                name={line.name || line.key}
                                                strokeDasharray={line.dash ? "5 5" : undefined}
                                            />
                                        ))}
                                    </LineChart>
                                ) : (
                                    <BarChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey={dataKey}
                                            angle={['daily', 'monthly', 'yearly'].includes(trendType) ? -45 : 0}
                                            textAnchor={['daily', 'monthly', 'yearly'].includes(trendType) ? 'end' : 'middle'}
                                            height={['daily', 'monthly', 'yearly'].includes(trendType) ? 80 : 30}
                                            interval={0}
                                        />
                                        <YAxis label={{ value: temporalYAxisLabel, angle: -90, position: 'insideLeft', offset: -10, dy: 10 }} />
                                        <Tooltip content={<CustomRechartsTooltip xAxisLabelDynamic={temporalXAxisLabel} />} />
                                        <Legend />
                                        <Bar dataKey="Count" fill={CHART_COLORS[0]} name="Incidents" />
                                    </BarChart>
                                )
                            }
                        </ResponsiveContainer>
                    </>
                )}
            </div>
        );
    }, [loading, temporalChartData, temporalChartBaselines, temporalChartTitle, temporalXAxisLabel, temporalYAxisLabel, trendType, selectedBaselineOptions, currentPeriodRangeDisplay, loadingInsight, insightError, temporalTrendInsight]);


    // --- REVISED: renderMainEventTypeDistributionChart useMemo (includes insight display) ---
    const renderMainEventTypeDistributionChart = useMemo(() => {
        if (loading) return <div className="chart-message">Loading event type data...</div>;

        const hasData = mainEventTypeDistributionData && mainEventTypeDistributionData.length > 0;

        return (
            <div className="chart-card">
                <h3 className="chart-card-title">Distribution of Main Event Types</h3>
                 {/* Insight Display for Main Event Type Distribution */}
                {loadingInsight ? (
                    <p className="chart-insight-text">Generating insights...</p>
                ) : insightError ? (
                    <p className="chart-insight-text error-message-small">Insight Error: {insightError}</p>
                ) : (
                    <p className="chart-insight-text">{mainEventTypeDistributionInsight}</p>
                )}
                {/* End Insight Display */}

                {loading ? (
                    <div className="chart-message">Loading main event type data...</div>
                ) : !hasData ? (
                    <div className="chart-message">No main event type data available for selected filters.</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mainEventTypeDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="MainEventType"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                interval={0}
                                label={{ value: "Main Event Type", position: 'bottom', offset: 0 }}
                            />
                            <YAxis label={{ value: "Number of Incidents", angle: -90, position: 'insideLeft', offset: -10, dy: 10 }} />
                            <Tooltip content={<CustomRechartsTooltip xAxisLabelDynamic="Main Event Type" />} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="Count" name="Incidents" fill={CHART_COLORS[0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        );
    }, [loading, mainEventTypeDistributionData, loadingInsight, insightError, mainEventTypeDistributionInsight]);


    // --- REVISED: renderSeverityDistributionChart useMemo (includes insight display) ---
    const renderSeverityDistributionChart = useMemo(() => {
        if (loading) return <div className="chart-message">Loading severity data...</div>;

        const severityColors = {
            'EMERGENCY': CHART_COLORS[3],
            'HIGH': CHART_COLORS[6],
            'MEDIUM': CHART_COLORS[2],
            'LOW': CHART_COLORS[1],
        };

        const pieChartData = severityDistributionData.map(entry => ({
            name: entry.Severity,
            value: entry.Count,
            fill: severityColors[entry.Severity] || CHART_COLORS[0]
        }));

        const renderCustomizedLabel = ({ name, percent }) => {
            return `${name} (${(percent * 100).toFixed(0)}%)`;
        };

        const hasData = pieChartData && pieChartData.length > 0 && pieChartData.some(d => d.value > 0);

        return (
            <div className="chart-card">
                <h3 className="chart-card-title">Incident Severity Distribution</h3>
                {/* Insight Display for Severity Distribution */}
                {loadingInsight ? (
                    <p className="chart-insight-text">Generating insights...</p>
                ) : insightError ? (
                    <p className="chart-insight-text error-message-small">Insight Error: {insightError}</p>
                ) : (
                    <p className="chart-insight-text">{severityDistributionInsight}</p>
                )}
                {/* End Insight Display */}

                {loading ? (
                    <div className="chart-message">Loading severity data...</div>
                ) : !hasData ? (
                    <div className="chart-message">No severity data available for selected filters.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                labelLine={false}
                                label={renderCustomizedLabel}
                            >
                                {
                                    pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))
                                }
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        );
    }, [loading, severityDistributionData, loadingInsight, insightError, severityDistributionInsight]);


    // --- REVISED: renderEventByPartOfDayChart useMemo (includes insight display) ---
    const renderEventByPartOfDayChart = useMemo(() => {
        if (loading) return <div className="chart-message">Loading part of day data...</div>;

        if (!eventByPartOfDayKeys || eventByPartOfDayKeys.length === 0 || !eventByPartOfDayData || eventByPartOfDayData.length === 0) {
            return (
                <div className="chart-card">
                    <h3 className="chart-card-title">Trends of Top Main Event Types by Part of Day</h3>
                    {/* Insight Display for Event by Part of Day */}
                    {loadingInsight ? (
                        <p className="chart-insight-text">Generating insights...</p>
                    ) : insightError ? (
                        <p className="chart-insight-text error-message-small">Insight Error: {insightError}</p>
                    ) : (
                        <p className="chart-insight-text">{eventByPartOfDayInsight}</p>
                    )}
                    {/* End Insight Display */}
                    <div className="chart-message">No event types data available for this period.</div>
                </div>
            );
        }

        const eventTypeTotals = {};
        eventByPartOfDayKeys.forEach(key => {
            eventTypeTotals[key] = eventByPartOfDayData.reduce((sum, entry) => sum + (entry[key] || 0), 0);
        });

        const sortedEventTypes = Object.entries(eventTypeTotals)
            .sort(([, countA], [, countB]) => countB - countA);

        const topEventTypes = sortedEventTypes.slice(0, 5).map(([key]) => key);

        return (
            <div className="chart-card">
                <h3 className="chart-card-title">Trends of Top Main Event Types by Part of Day</h3>
                {/* Insight Display for Event by Part of Day */}
                {loadingInsight ? (
                    <p className="chart-insight-text">Generating insights...</p>
                ) : insightError ? (
                    <p className="chart-insight-text error-message-small">Insight Error: {insightError}</p>
                ) : (
                    <p className="chart-insight-text">{eventByPartOfDayInsight}</p>
                )}
                {/* End Insight Display */}
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                        data={eventByPartOfDayData}
                        margin={{
                            top: 20, right: 30, left: 20, bottom: 60,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="Part of Day"
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            height={60}
                        />
                        <YAxis label={{ value: 'Number of Incidents', angle: -90, position: 'insideLeft', offset: -10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        {
                            topEventTypes.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 8 }}
                                />
                            ))
                        }
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }, [loading, eventByPartOfDayData, eventByPartOfDayKeys, loadingInsight, insightError, eventByPartOfDayInsight]);


    // --- REVISED: renderTopMainEventTypesChart useMemo (includes insight display) ---
    const renderTopMainEventTypesChart = useMemo(() => {
        if (loading) return <div className="chart-message">Loading top event types...</div>;

        const hasData = topMainEventTypesData && topMainEventTypesData.length > 0;

        return (
            <div className="chart-card">
                <h3 className="chart-card-title">Top 5 Most Common Main Event Types</h3>
                {/* Insight Display for Top Main Event Types */}
                {loadingInsight ? (
                    <p className="chart-insight-text">Generating insights...</p>
                ) : insightError ? (
                    <p className="chart-insight-text error-message-small">Insight Error: {insightError}</p>
                ) : (
                    <p className="chart-insight-text">{topMainEventTypesInsight}</p>
                )}
                {/* End Insight Display */}

                {loading ? (
                    <div className="chart-message">Loading top event types...</div>
                ) : !hasData ? (
                    <div className="chart-message">No top event types data available for selected filters.</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topMainEventTypesData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="MainEventType"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                interval={0}
                                label={{ value: "Main Event Type", position: 'bottom', offset: 0 }}
                            />
                            <YAxis label={{ value: "Number of Incidents", angle: -90, position: 'insideLeft', offset: -10, dy: 10 }} />
                            <Tooltip content={<CustomRechartsTooltip xAxisLabelDynamic="Main Event Type" />} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="Count" name="Incidents" fill={CHART_COLORS[4]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        );
    }, [loading, topMainEventTypesData, loadingInsight, insightError, topMainEventTypesInsight]);


    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">ERSS Incident Trend Analysis Dashboard</h1>
            <p className="dashboard-subtitle">Dynamic insights for police supervisors based on incident data.</p>

            {error && (
                <div className="error-message-banner">
                    Error: {error}
                </div>
            )}

            <div className="main-content-area">
                <div className="filters-section">
                    <h3>Filter Incident Data</h3>

                    <div className="action-buttons-group">
                        <button onClick={resetFilters} className="action-button reset-button">
                            Reset All Filters
                        </button>
                        <button onClick={downloadFilteredDataAsCsv} className="action-button download-button">
                            Download Filtered Data (CSV)
                        </button>
                    </div>

                    <div className="filter-group date-filter-group">
                        <label>Date Range:</label>
                        <div className="date-pickers">
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => { setStartDate(date); setSelectedDatePreset(null); }}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                minDate={metadata.min_date}
                                maxDate={metadata.max_date}
                                placeholderText="Start Date"
                                dateFormat="yyyy-MM-dd"
                                className="date-picker-input"
                            />
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => { setEndDate(date); setSelectedDatePreset(null); }}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate} // Should be minDate={startDate} for end date picker
                                placeholderText="End Date"
                                dateFormat="yyyy-MM-dd"
                                className="date-picker-input"
                            />
                        </div>
                        <div className="date-presets">
                            <button
                                className={selectedDatePreset === 'all_time' ? 'selected' : ''}
                                onClick={() => handleDatePresetChange('all_time')}
                            >
                                All Time
                            </button>
                            <button
                                className={selectedDatePreset === 'last_7_days' ? 'selected' : ''}
                                onClick={() => handleDatePresetChange('last_7_days')}
                            >
                                Last 7 Days
                            </button>
                            <button
                                className={selectedDatePreset === 'last_30_days' ? 'selected' : ''}
                                onClick={() => handleDatePresetChange('last_30_days')}
                            >
                                Last 30 Days
                            </button>
                            <button
                                className={selectedDatePreset === 'this_month' ? 'selected' : ''}
                                onClick={() => handleDatePresetChange('this_month')}
                            >
                                This Month
                            </button>
                            <button
                                className={selectedDatePreset === 'last_month' ? 'selected' : ''}
                                onClick={() => handleDatePresetChange('last_month')}
                            >
                                Last Month
                            </button>
                            <button
                                className={selectedDatePreset === 'this_year' ? 'selected' : ''}
                                onClick={() => handleDatePresetChange('this_year')}
                            >
                                This Year
                            </button>
                            <button
                                className={selectedDatePreset === 'last_year' ? 'selected' : ''}
                                onClick={() => handleDatePresetChange('last_year')}
                            >
                                Last Year
                            </button>
                        </div>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="trendType">Trend Granularity:</label>
                        <select id="trendType" value={trendType} onChange={(e) => setTrendType(e.target.value)}>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily (Day of Week)</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>

                    <div className="filter-group checkbox-group">
                        <label>Trend Baselines:</label>
                        <div>
                            <input
                                type="checkbox"
                                id="baseline_mean_overall"
                                value="mean_overall"
                                checked={selectedBaselineOptions.includes('mean_overall')}
                                onChange={handleBaselineChange}
                            />
                            <label htmlFor="baseline_mean_overall">Mean Overall</label>
                        </div>
                        <div>
                            <input
                                type="checkbox"
                                id="baseline_last_period"
                                value="last_period"
                                checked={selectedBaselineOptions.includes('last_period')}
                                onChange={handleBaselineChange}
                            />
                            <label htmlFor="baseline_last_period">Last Period</label>
                        </div>
                         <div>
                            <input
                                type="checkbox"
                                id="baseline_previous_year"
                                value="previous_year"
                                checked={selectedBaselineOptions.includes('previous_year')}
                                onChange={handleBaselineChange}
                            />
                            <label htmlFor="baseline_previous_year">Previous Year</label>
                        </div>
                    </div>

                    {/* Custom "Mean Overall" Date Range (conditionally rendered) */}
                    {selectedBaselineOptions.includes('mean_overall') && (
                        <div className="filter-group date-filter-group">
                            <label>Custom "Mean Overall" Range:</label>
                            <div className="date-pickers">
                                <DatePicker
                                    selected={meanOverallStartDate}
                                    onChange={(date) => setMeanOverallStartDate(date)}
                                    selectsStart
                                    startDate={meanOverallStartDate}
                                    endDate={meanOverallEndDate}
                                    placeholderText="Mean Overall Start"
                                    dateFormat="yyyy-MM-dd"
                                    className="date-picker-input"
                                />
                                <DatePicker
                                    selected={meanOverallEndDate}
                                    onChange={(date) => setMeanOverallEndDate(date)}
                                    selectsEnd
                                    startDate={meanOverallStartDate}
                                    endDate={meanOverallEndDate}
                                    minDate={meanOverallStartDate}
                                    placeholderText="Mean Overall End"
                                    dateFormat="yyyy-MM-dd"
                                    className="date-picker-input"
                                />
                            </div>
                        </div>
                    )}


                    {/* Custom Last Period Date Range (conditionally rendered) */}
                    {selectedBaselineOptions.includes('last_period') && (
                        <div className="filter-group date-filter-group">
                            <label>Custom "Last Period" Range:</label>
                            <div className="date-pickers">
                                <DatePicker
                                    selected={lastPeriodStartDate}
                                    onChange={(date) => setLastPeriodStartDate(date)}
                                    selectsStart
                                    startDate={lastPeriodStartDate}
                                    endDate={lastPeriodEndDate}
                                    placeholderText="Last Period Start"
                                    dateFormat="yyyy-MM-dd"
                                    className="date-picker-input"
                                />
                                <DatePicker
                                    selected={lastPeriodEndDate}
                                    onChange={(date) => setLastPeriodEndDate(date)}
                                    selectsEnd
                                    startDate={lastPeriodStartDate}
                                    endDate={lastPeriodEndDate}
                                    minDate={lastPeriodStartDate}
                                    placeholderText="Last Period End"
                                    dateFormat="yyyy-MM-dd"
                                    className="date-picker-input"
                                />
                            </div>
                        </div>
                    )}

                    <div className="filter-group">
                        <label htmlFor="mainEventType">Main Event Type:</label>
                        <select
                            id="mainEventType"
                            multiple
                            value={selectedMainEventTypes}
                            onChange={(e) =>
                                setSelectedMainEventTypes(
                                    Array.from(e.target.selectedOptions, (option) => option.value)
                                )
                            }
                            size={Math.min(metadata.main_event_types.length, 5)}
                        >
                            {metadata.main_event_types.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="subEventType">Sub Event Type:</label>
                        <select
                            id="subEventType"
                            multiple
                            value={selectedSubEventTypes}
                            onChange={(e) =>
                                setSelectedSubEventTypes(
                                    Array.from(e.target.selectedOptions, (option) => option.value)
                                )
                            }
                            size={Math.min(filteredSubEventTypesOptions.length, 5)}
                        >
                            {filteredSubEventTypesOptions.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="severityLabel">Severity Label:</label>
                        <select
                            id="severityLabel"
                            multiple
                            value={selectedSeverityLabels}
                            onChange={(e) =>
                                setSelectedSeverityLabels(
                                    Array.from(e.target.selectedOptions, (option) => option.value)
                                )
                            }
                            size={Math.min(metadata.severity_labels.length, 4)}
                        >
                            {metadata.severity_labels.map((label) => (
                                <option key={label} value={label}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="partOfDay">Part of Day:</label>
                        <select
                            id="partOfDay"
                            multiple
                            value={selectedPartsOfDay}
                            onChange={(e) =>
                                setSelectedPartsOfDay(
                                    Array.from(e.target.selectedOptions, (option) => option.value)
                                )
                            }
                            size={Math.min(metadata.parts_of_day.length, 4)}
                        >
                            {metadata.parts_of_day.map((part) => (
                                <option key={part} value={part}>
                                    {part}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* NEW: Chart Selection Dropdown */}
                    <div className="filter-group">
                        <label htmlFor="chartSelection">Select Charts:</label>
                        <select
                            id="chartSelection"
                            multiple
                            value={selectedCharts}
                            onChange={handleChartSelectionChange}
                            size={6}
                        >
                            <option value="kpis">Key Performance Indicators</option>
                            <option value="temporalTrend">Incident Trends (Temporal)</option>
                            <option value="mainEventTypeDistribution">Main Event Type Distribution</option>
                            <option value="severityDistribution">Incident Severity Distribution</option>
                            <option value="eventByPartOfDay">Main Event Types by Part of Day</option>
                            <option value="topMainEventTypes">Top 5 Main Event Types</option>
                        </select>
                    </div>

                </div>

                <div className="chart-grid-container">
                    {selectedCharts.includes('kpis') && (
                        <div className="chart-card kpi-card">
                            <h3 className="chart-card-title">Key Performance Indicators</h3>
                            {/* Insight Display for KPIs */}
                            {loadingInsight ? (
                                <p className="chart-insight-text">Generating insights...</p>
                            ) : insightError ? (
                                <p className="chart-insight-text error-message-small">Insight Error: {insightError}</p>
                            ) : (
                                <p className="chart-insight-text">{kpiInsight}</p>
                            )}
                            {/* End Insight Display */}
                            {loading ? (
                                <div className="chart-message">Loading KPIs...</div>
                            ) : (
                                <div className="kpi-values">
                                    <p><strong>Total Incidents:</strong> {kpiData.total_incidents}</p>
                                    <p><strong>Most Common Event:</strong> {kpiData.most_common_main_event}</p>
                                    <p><strong>Emergency Incidents:</strong> {kpiData.emergency_incidents_count}</p>
                                    <p><strong>Avg. Daily Incidents:</strong> {kpiData.average_daily_incidents.toFixed(2)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedCharts.includes('temporalTrend') && renderTemporalTrendChart}
                    {selectedCharts.includes('mainEventTypeDistribution') && renderMainEventTypeDistributionChart}
                    {selectedCharts.includes('severityDistribution') && renderSeverityDistributionChart}
                    {selectedCharts.includes('eventByPartOfDay') && renderEventByPartOfDayChart}
                    {selectedCharts.includes('topMainEventTypes') && renderTopMainEventTypesChart}

                </div>
            </div>
        </div>
    );
}

export default App;