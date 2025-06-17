# ERSS Crime Analytics Dashboard

A comprehensive geospatial analytics platform for crime data visualization and analysis, built with React, Kepler.gl, and Python-based spatial analysis tools.

## 🚀 Features

### Interactive Crime Data Visualization
- **Real-time Crime Mapping**: Interactive map visualization of crime incidents using Kepler.gl
- **Date Range Filtering**: Filter crime data by specific date ranges
- **Crime Type Filtering**: Dynamic dropdown to filter by specific crime types with occurrence counts
- **Multi-layer Support**: Overlay multiple analysis layers simultaneously

### Advanced Spatial Analysis
- **Hotspot Analysis**: Statistical hotspot detection using Getis-Ord Gi* statistic
- **Kernel Density Estimation (KDE)**: Crime density surface analysis with customizable parameters
- **Heatmap Visualizations**: Color-coded density maps for pattern identification

### Data Processing & Management
- **CSV Data Processing**: Automated data cleaning and preprocessing
- **Real-time Updates**: Dynamic data loading with progress indicators
- **Error Handling**: Comprehensive error states and user feedback

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Kepler.gl** - Advanced geospatial data visualization
- **Redux Toolkit** - State management with modern Redux patterns
- **Mapbox GL JS** - Interactive map rendering
- **Vite** - Fast build tool and development server

### Backend
- **Node.js & Express** - RESTful API server
- **Python** - Spatial analysis scripts
- **CORS** - Cross-origin resource sharing support

### Spatial Analysis Libraries
- **GeoPandas** - Geospatial data manipulation
- **Scikit-learn** - Machine learning for KDE analysis
- **PySAL** - Spatial analysis library for hotspot detection

## 📁 Project Structure

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8+
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gis_v3

    pip install pandas geopandas scikit-learn pysal esda libpysal splot mapclassify
    node server.js
    tileserver-gl --port 8080 --verbose