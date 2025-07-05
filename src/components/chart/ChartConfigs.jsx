import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie } from 'recharts';

const CHART_COLORS = [
  '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#20c997',
  '#fd7e14', '#e83e8c', '#6c757d', '#17a2b8', '#6610f2', '#ff69b4'
];

export const createChartConfigs = (data, selectedTemporalTrend) => {
  const getTrendDescription = () => {
    const descriptions = {
      'Hourly': 'Hourly pattern analysis showing incident distribution throughout the day for optimal resource deployment.',
      'Daily': 'Weekly pattern analysis showing incident distribution by day of the week to optimize patrol schedules.',
      'Weekly': 'Weekly trend analysis showing incident patterns over time for strategic planning.',
      'Monthly': 'Monthly trend analysis showing seasonal patterns and long-term crime trends.',
      'Yearly': 'Yearly trend analysis showing annual crime statistics and multi-year patterns.'
    };
    return descriptions[selectedTemporalTrend] || 'Temporal pattern analysis showing incident distribution over time.';
  };

  const KPIGrid = ({ kpiData }) => (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#3C00FF' }}>Total Incidents</h4>
          <p style={{ margin: 0, fontSize: '30px', fontWeight: 'bold', color: 'black' }}>
            {kpiData.total_incidents || 0}
          </p>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#3C00FF' }}>Emergency Incidents</h4>
          <p style={{ margin: 0, fontSize: '30px', fontWeight: 'bold', color: 'black' }}>
            {kpiData.emergency_incidents_count || 0}
          </p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#3C00FF' }}>Most Common Event</h4>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'black' }}>
            {kpiData.most_common_main_event || 'N/A'}
          </p>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#3C00FF' }}>Avg Daily Incidents</h4>
          <p style={{ margin: 0, fontSize: '30px', fontWeight: 'bold', color: 'black' }}>
            {kpiData.average_daily_incidents ? kpiData.average_daily_incidents.toFixed(1) : '0.0'}
          </p>
        </div>
      </div>
    </div>
  );

  return [
    {
      id: 1,
      title: "Key Performance Indicators",
      description: "Overview of critical crime statistics and metrics for operational decision-making and resource allocation based on current filters.",
      component: <KPIGrid kpiData={data.kpi} />,
      legend: [] // Empty legend for KPI chart
    },
    {
      id: 2,
      title: `${selectedTemporalTrend} Trend Analysis`,
      description: getTrendDescription(),
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.temporal}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={selectedTemporalTrend === 'Hourly' ? 'Hour of Day (24-hour)' :
                selectedTemporalTrend === 'Daily' ? 'Day of Week' :
                  selectedTemporalTrend === 'Monthly' ? 'Month' :
                    selectedTemporalTrend === 'Yearly' ? 'Year' : 'Period'}
              height={selectedTemporalTrend === 'Daily' ? 80 : 60}
              tick={{ fontSize: 10 }}
              angle={selectedTemporalTrend === 'Daily' ? -45 : 0}
              textAnchor={selectedTemporalTrend === 'Daily' ? 'end' : 'middle'}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
            />
            <Tooltip />
            <Line type="monotone" dataKey="Count" stroke="#8884d8" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      ),
      legend: [{ color: '#8884d8', label: `${selectedTemporalTrend} Incidents` }]
    },
    {
      id: 3,
      title: "Incident Type Distribution",
      description: "Breakdown of incident categories showing the most prevalent types of crimes reported in the selected timeframe and filters.",
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.mainEvent}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="MainEventType" angle={-45} textAnchor="end" height={100}
              tick={{ fontSize: 10 }}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      ),
      legend: [{ color: '#82ca9d', label: 'Incident Count' }]
    },
    {
      id: 4,
      title: "Severity Level Distribution",
      description: "Distribution of incidents by severity levels based on current filters, crucial for understanding threat levels and response prioritization.",
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.severity.map((item, index) => ({
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
      legend: data.severity.map((item, index) => ({
        color: CHART_COLORS[index % CHART_COLORS.length],
        label: `${item.Severity} (${item.Count})`
      }))
    }
  ];
};