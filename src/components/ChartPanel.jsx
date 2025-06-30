import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import ReactLoading from "react-loading";

const API_BASE_URL = 'http://localhost:5000/api/charts';

// Define consistent colors for chart elements
const CHART_COLORS = [
  '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#20c997', 
  '#fd7e14', '#e83e8c', '#6c757d', '#17a2b8', '#6610f2', '#ff69b4', 
  '#00bfff', '#adff2f', '#ff4500', '#8a2be2', '#7fff00', '#d2691e', 
  '#ff7f50', '#6495ed'
];

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
  const totalPages = 5;

  // Chart data states
  const [kpiData, setKpiData] = useState({
    total_incidents: 0,
    most_common_main_event: 'N/A',
    emergency_incidents_count: 0,
    average_daily_incidents: 0
  });
  const [temporalChartData, setTemporalChartData] = useState([]);
  const [mainEventTypeDistributionData, setMainEventTypeDistributionData] = useState([]);
  const [severityDistributionData, setSeverityDistributionData] = useState([]);
  const [topMainEventTypesData, setTopMainEventTypesData] = useState([]);

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

  // Fetch data from backend - SIMPLIFIED to prevent infinite loops
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
        `${API_BASE_URL}/severity-distribution?${queryParams.toString()}`,
        `${API_BASE_URL}/top-main-events?top_n=5&${queryParams.toString()}`
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

      const [kpiResult, temporalResult, mainEventResult, severityResult, topEventsResult] = results;

      // Update states with more defensive checks
      if (kpiResult && !kpiResult.error) {
        console.log('Setting KPI data:', kpiResult);
        setKpiData(kpiResult);
      } else {
        console.log('KPI error or no data:', kpiResult);
      }
      
      if (temporalResult && !temporalResult.error && temporalResult.current_trend) {
        console.log('Setting temporal data:', temporalResult.current_trend);
        setTemporalChartData(Array.isArray(temporalResult.current_trend) ? temporalResult.current_trend : []);
      } else {
        console.log('Temporal error or no data:', temporalResult);
      }
      
      if (mainEventResult && !mainEventResult.error && mainEventResult.data) {
        console.log('Setting main event data:', mainEventResult.data);
        setMainEventTypeDistributionData(Array.isArray(mainEventResult.data) ? mainEventResult.data : []);
      } else {
        console.log('Main event error or no data:', mainEventResult);
      }
      
      if (severityResult && !severityResult.error && severityResult.data) {
        console.log('Setting severity data:', severityResult.data);
        setSeverityDistributionData(Array.isArray(severityResult.data) ? severityResult.data : []);
      } else {
        console.log('Severity error or no data:', severityResult);
      }
      
      if (topEventsResult && !topEventsResult.error && topEventsResult.data) {
        console.log('Setting top events data:', topEventsResult.data);
        setTopMainEventTypesData(Array.isArray(topEventsResult.data) ? topEventsResult.data : []);
      } else {
        console.log('Top events error or no data:', topEventsResult);
      }

    } catch (err) {
      const errorMessage = err.message || "Failed to fetch chart data";
      console.error("Chart data fetch error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [queryParams, selectedTemporalTrend]); // FIXED dependencies

  // Fetch data when component mounts and when dependencies change
  useEffect(() => {
    console.log('ChartPanel useEffect triggered');
    fetchChartData();
  }, [fetchChartData]); // SIMPLIFIED dependencies

  // Get trend chart description
  const getTrendChartDescription = () => {
    const descriptions = {
      'Hourly': 'Hourly pattern analysis showing incident distribution throughout the day for optimal resource deployment.',
      'Daily': 'Weekly pattern analysis showing incident distribution by day of the week to optimize patrol schedules.',
      'Weekly': 'Weekly trend analysis showing incident patterns over time for strategic planning.',
      'Monthly': 'Monthly trend analysis showing seasonal patterns and long-term crime trends.',
      'Yearly': 'Yearly trend analysis showing annual crime statistics and multi-year patterns.'
    };
    return descriptions[selectedTemporalTrend] || 'Temporal pattern analysis showing incident distribution over time.';
  };

  // Chart configurations
  const charts = [
    {
      id: 1,
      title: "Key Performance Indicators",
      description: "Overview of critical crime statistics and metrics for operational decision-making and resource allocation based on current filters.",
      component: (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Total Incidents</h4>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'black' }}>
                {kpiData.total_incidents || 0}
              </p>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Emergency Incidents</h4>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'black' }}>
                {kpiData.emergency_incidents_count || 0}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Most Common Event</h4>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'black' }}>
                {kpiData.most_common_main_event || 'N/A'}
              </p>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Avg Daily Incidents</h4>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'black' }}>
                {kpiData.average_daily_incidents ? kpiData.average_daily_incidents.toFixed(1) : '0.0'}
              </p>
            </div>
          </div>
        </div>
      ),
      legend: []
    },
    {
      id: 2,
      title: `${selectedTemporalTrend} Trend Analysis`,
      description: getTrendChartDescription(),
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={temporalChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={selectedTemporalTrend === 'Hourly' ? 'Hour of Day (24-hour)' : 
                       selectedTemporalTrend === 'Daily' ? 'Day of Week' :
                       selectedTemporalTrend === 'Monthly' ? 'Month' : 
                       selectedTemporalTrend === 'Yearly' ? 'Year' : 'Period'} 
              angle={selectedTemporalTrend === 'Daily' ? -45 : 0}
              textAnchor={selectedTemporalTrend === 'Daily' ? 'end' : 'middle'}
              height={selectedTemporalTrend === 'Daily' ? 80 : 60}
            />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="Count" stroke="#8884d8" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      ),
      legend: [
        { color: '#8884d8', label: `${selectedTemporalTrend} Incidents` }
      ]
    },
    {
      id: 3,
      title: "Incident Type Distribution",
      description: "Breakdown of incident categories showing the most prevalent types of crimes reported in the selected timeframe and filters.",
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mainEventTypeDistributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="MainEventType" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      ),
      legend: [
        { color: '#82ca9d', label: 'Incident Count' }
      ]
    },
    {
      id: 4,
      title: "Severity Level Distribution",
      description: "Distribution of incidents by severity levels based on current filters, crucial for understanding threat levels and response prioritization.",
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={severityDistributionData.map((item, index) => ({
                ...item,
                name: item.Severity,
                value: item.Count,
                fill: CHART_COLORS[index % CHART_COLORS.length]
              }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ),
      legend: severityDistributionData.map((item, index) => ({ 
        color: CHART_COLORS[index % CHART_COLORS.length], 
        label: `${item.Severity} (${item.Count})` 
      }))
    },
    {
      id: 5,
      title: "Top Incident Types Ranking",
      description: "Ranking of the most frequently reported incident types based on current filters, providing insights for targeted prevention strategies.",
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topMainEventTypesData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="MainEventType" type="category" width={120} />
            <Tooltip />
            <Bar dataKey="Count" fill="#ff7300" />
          </BarChart>
        </ResponsiveContainer>
      ),
      legend: [
        { color: '#ff7300', label: 'Event Count' }
      ]
    }
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const currentChart = charts[currentPage - 1];

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
        {/* Loading overlay - only covers the main content area */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 1)',
            zIndex: 10,
            borderRadius: '5px'
          }}>
            <ReactLoading
              type={"bars"}
              color={"black"}
              height={60}
              width={60}
            />
            <div style={{
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ 
                color: 'black', 
                marginBottom: '8px',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                Loading Chart Data
              </h3>
              <p style={{ 
                color: '#666',
                fontSize: '12px',
                fontWeight: '400',
                margin: 0
              }}>
                Fetching analytics from server...
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: '12px', flexShrink: 0, backgroundColor: '#fff' }}>
          {/* Top border line */}
          <div style={{
            height: '1px',
            backgroundColor: '#ddd',
            marginBottom: '8px'
          }}></div>
          
          {/* Main plot title */}
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {currentChart.title}
          </h2>
          
          {/* Bottom border line */}
          <div style={{
            height: '1px',
            backgroundColor: '#ddd',
            marginBottom: '8px'
          }}></div>
          
          {/* Summary subheading */}
          <h3 style={{
            margin: '0 0 4px 0',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#555',
            borderBottom: '1px solid #333',
            paddingBottom: '2px',
            display: 'inline-block'
          }}>
            Summary
          </h3>
          
          {/* Description text */}
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '12px',
            color: '#666',
            lineHeight: '1.4'
          }}>
            {currentChart.description}
          </p>
        </div>

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

          {/* Legend area */}
          <div style={{
            width: '180px',
            backgroundColor: '#fff',
            borderRadius: '4px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
            border: '1px solid #ddd'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '4px',
              borderBottom: '1px solid #ddd',
              paddingBottom: '4px'
            }}>
              Legend
            </div>
            {currentChart.legend.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0'
              }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  backgroundColor: item.color,
                  borderRadius: '3px',
                  flexShrink: 0
                }}></div>
                <span style={{
                  fontSize: '11px',
                  color: '#666',
                  fontWeight: '500',
                  lineHeight: '1.3'
                }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vertical Pagination - Right Side */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: '15px',
        width: '60px',
        height: 'calc(100% - 20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff'
      }}>
        {/* Left border*/}
        <div style={{
          position: 'absolute',
          left: '12px',
          top: 0,
          bottom: 0,
          width: '3px',
          backgroundColor: 'black'
        }}></div>
        
        {/* Pagination buttons - Top */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0px',
          padding: '0px 8px',
          marginTop: '0px'
        }}>
          {Array.from({ length: totalPages }, (_, index) => (
            <React.Fragment key={index + 1}>
              <button
                onClick={() => handlePageChange(index + 1)}
                style={{
                  width: '33px',
                  height: '34px',
                  border: 'none',
                  backgroundColor: currentPage === index + 1 ? '#000' : 'transparent',
                  color: currentPage === index + 1 ? '#fff' : '#000',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {index + 1}
              </button>
              {index < totalPages - 1 && (
                <div style={{
                  width: '30px',
                  height: '1px',
                  backgroundColor: '#ddd'
                }}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Download button - Bottom */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0px 8px',
          marginBottom: '20px'
        }}>
          {/* Top line */}
          <div style={{
            width: '30px',
            height: '1px',
            backgroundColor: '#ddd',
            marginBottom: '0px'
          }}></div>
          
          <button
            onClick={() => {
              // Handle download functionality here
              console.log('Download chart data for page:', currentPage);
              // You can implement CSV download, image export, etc.
            }}
            style={{
              width: '33px',
              height: '34px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#000',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
            title="Download chart data"
          >
           <img src="download_button.svg" alt="" />
            
          </button>
          
          {/* Bottom line */}
          <div style={{
            width: '30px',
            height: '1px',
            backgroundColor: '#ddd',
            marginTop: '0px'
          }}></div>
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;