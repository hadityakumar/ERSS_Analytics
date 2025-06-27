import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const ChartPanel = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  // Sample data for different charts
  const sampleData = {
    crime_trends: [
      { month: 'Jan', crimes: 120, solved: 85 },
      { month: 'Feb', crimes: 98, solved: 72 },
      { month: 'Mar', crimes: 145, solved: 101 },
      { month: 'Apr', crimes: 132, solved: 95 },
      { month: 'May', crimes: 165, solved: 118 },
      { month: 'Jun', crimes: 178, solved: 134 }
    ],
    crime_types: [
      { type: 'Theft', count: 245, color: '#8884d8' },
      { type: 'Assault', count: 156, color: '#82ca9d' },
      { type: 'Fraud', count: 89, color: '#ffc658' },
      { type: 'Burglary', count: 123, color: '#ff7300' },
      { type: 'Others', count: 67, color: '#8dd1e1' }
    ],
    severity_distribution: [
      { severity: 'High', count: 89 },
      { severity: 'Medium', count: 234 },
      { severity: 'Low', count: 156 }
    ],
    temporal_analysis: [
      { hour: '00', incidents: 12 },
      { hour: '04', incidents: 8 },
      { hour: '08', incidents: 25 },
      { hour: '12', incidents: 45 },
      { hour: '16', incidents: 38 },
      { hour: '20', incidents: 52 },
      { hour: '24', incidents: 18 }
    ],
    district_comparison: [
      { district: 'Trivandrum', crimes: 234, population: 1200000 },
      { district: 'Kollam', crimes: 145, population: 950000 },
      { district: 'Kochi', crimes: 298, population: 1800000 },
      { district: 'Calicut', crimes: 187, population: 1300000 }
    ]
  };

  const charts = [
    {
      id: 1,
      title: "Crime Trends Analysis",
      description: "Monthly crime incidents and resolution rates showing patterns over the last 6 months. The data indicates seasonal variations and enforcement effectiveness.",
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sampleData.crime_trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="crimes" stroke="#8884d8" strokeWidth={3} />
            <Line type="monotone" dataKey="solved" stroke="#82ca9d" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      ),
      legend: [
        { color: '#8884d8', label: 'Total Crimes' },
        { color: '#82ca9d', label: 'Solved Cases' }
      ]
    },
    {
      id: 2,
      title: "Crime Type Distribution",
      description: "Breakdown of different crime categories showing the most prevalent types of incidents reported in the selected region and time period.",
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sampleData.crime_types}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
            >
              {sampleData.crime_types.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ),
      legend: sampleData.crime_types.map(item => ({ color: item.color, label: `${item.type} (${item.count})` }))
    },
    {
      id: 3,
      title: "Severity Level Analysis",
      description: "Distribution of crime incidents by severity levels, helping prioritize resource allocation and response strategies.",
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sampleData.severity_distribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="severity" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ),
      legend: [
        { color: '#8884d8', label: 'Incident Count' }
      ]
    },
    {
      id: 4,
      title: "Temporal Pattern Analysis",
      description: "24-hour incident distribution showing peak crime hours and patterns, essential for patrol scheduling and resource deployment.",
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sampleData.temporal_analysis}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="incidents" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      ),
      legend: [
        { color: '#8884d8', label: 'Hourly Incidents' }
      ]
    },
    {
      id: 5,
      title: "District Comparison",
      description: "Comparative analysis of crime rates across different districts, normalized by population density for accurate assessment.",
      component: (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sampleData.district_comparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="district" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="crimes" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      ),
      legend: [
        { color: '#82ca9d', label: 'Crime Count' }
      ]
    }
  ];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const currentChart = charts[currentPage - 1];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      position: 'relative'
    }}>
      {/* Main content area */}
      <div style={{
        flex: '1',
        height: '100%',
        padding: '16px',
        paddingRight: '60px', // Space for pagination
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {currentChart.title}
          </h2>
          <div style={{
            height: '2px',
            backgroundColor: '#1EBBD6',
            marginBottom: '8px'
          }}></div>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: '#666',
            lineHeight: '1.4'
          }}>
            {currentChart.description}
          </p>
        </div>

        {/* Chart and Legend container */}
        <div style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'row',
          gap: '12px'
        }}>
          {/* Chart area */}
          <div style={{
            flex: '1',
            minHeight: '200px',
            backgroundColor: '#fafafa',
            borderRadius: '4px',
            padding: '8px'
          }}>
            {currentChart.component}
          </div>

          {/* Legend area - Now on the right side */}
          <div style={{
            width: '180px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
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

      {/* Vertical Pagination */}
      <div style={{
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 4px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: currentPage === index + 1 ? '#1EBBD6' : '#f0f0f0',
              color: currentPage === index + 1 ? 'white' : '#666',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== index + 1) {
                e.target.style.backgroundColor = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== index + 1) {
                e.target.style.backgroundColor = '#f0f0f0';
              }
            }}
          >
            {index + 1}
          </button>
        ))}
        
        {/* Page indicator */}
        <div style={{
          marginTop: '8px',
          fontSize: '10px',
          color: '#999',
          textAlign: 'center'
        }}>
          {currentPage} of {totalPages}
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;