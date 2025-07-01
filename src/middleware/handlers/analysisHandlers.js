import { processCsvData } from '@kepler.gl/processors';
import { addDataToMap } from '@kepler.gl/actions';
import { fetchHotspotData, fetchEmergingHotspotsData } from '../services/apiService';
import { centerMapToTrivandrum } from '../utils/mapUtils';
import { generateDatasetId, generateLayerId } from '../utils/mapUtils';

export const handleLoadHotspotData = async (store) => {
  try {
    const csvText = await fetchHotspotData();
    const parsedData = processCsvData(csvText);
    
    if (parsedData.rows.length === 0) {
      alert('No hotspot data found. Please run the analysis first.');
      return;
    }

    const datasetId = generateDatasetId('hotspot');
    store.dispatch(
      addDataToMap({
        datasets: [{
          info: { id: datasetId, label: 'Hotspot Analysis' },
          data: parsedData
        }],
        options: { centerMap: false, keepExistingConfig: true, readOnly: true },
        config: {
          visState: {
            layers: [{
              id: generateLayerId('hotspot'),
              type: 'heatmap',
              config: {
                dataId: datasetId,
                label: 'Hotspot Heatmap',
                color: [255, 107, 53],
                columns: { lat: 'latitude', lng: 'longitude' },
                isVisible: true,
                visConfig: {
                  opacity: 0.8,
                  colorRange: {
                    colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                  },
                  radius: 60,
                  intensity: 1,
                  threshold: 0.05
                },
                weightField: { name: 'gi_star', type: 'real' }
              }
            }]
          }
        }
      })
    );

    // Auto-center map after hotspot analysis
    setTimeout(() => {
      centerMapToTrivandrum(store);
    }, 500);
  } catch (error) {
    alert(`Failed to load hotspot data: ${error.message}`);
  }
};

export const handleLoadEmergingHotspotsData = async (store) => {
  try {
    console.log('Loading emerging hotspots data...');
    const response = await fetchEmergingHotspotsData();
    
    if (!response.success) {
      alert('No emerging hotspots data found. Please run the analysis first.');
      return;
    }

    // Parse the GeoJSON data
    let geojsonData;
    try {
      geojsonData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    } catch (parseError) {
      console.error('Failed to parse GeoJSON data:', parseError);
      alert('Invalid GeoJSON data format received.');
      return;
    }
    
    if (!geojsonData.features || geojsonData.features.length === 0) {
      alert('No emerging hotspots detected in the analysis period.');
      return;
    }

    console.log('Processing emerging hotspots GeoJSON data:', geojsonData);

    // Convert GeoJSON to CSV-like format that Kepler.gl can handle reliably
    const csvRows = [];
    const headers = ['latitude', 'longitude', 'gi_score', 'hotspot_type', 'incident_count', 'significance'];
    
    geojsonData.features.forEach(feature => {
      const props = feature.properties || {};
      const geometry = feature.geometry || {};
      
      // Extract coordinates
      let lat = props.latitude;
      let lng = props.longitude;
      
      // If coordinates are not in properties, extract from geometry
      if ((!lat || !lng) && geometry.coordinates) {
        if (geometry.type === 'Point') {
          lng = geometry.coordinates[0];
          lat = geometry.coordinates[1];
        } else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
          // For polygons, use centroid (simplified)
          const coords = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0];
          if (coords && coords.length > 0) {
            lng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
            lat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
          }
        }
      }
      
      csvRows.push([
        lat || 0,
        lng || 0,
        props.gi_score || 0,
        props.hotspot_type || 'Unknown',
        props.incident_count || 0,
        props.significance || 'Medium'
      ]);
    });

    // Create CSV string
    const csvString = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    
    console.log('Generated CSV data:', csvString);

    // Process using the same method as hotspot data
    const parsedData = processCsvData(csvString);
    
    if (parsedData.rows.length === 0) {
      alert('No valid emerging hotspots data after processing.');
      return;
    }

    console.log('Parsed CSV data:', parsedData);

    const datasetId = generateDatasetId('emerging_hotspots');
    
    // Add the data to the map using point layer (similar to hotspots)
    store.dispatch(
      addDataToMap({
        datasets: [{
          info: { 
            id: datasetId, 
            label: 'Emerging Hotspots Analysis'
          },
          data: parsedData
        }],
        options: { 
          centerMap: false, 
          keepExistingConfig: true, 
          readOnly: true 
        },
        config: {
          visState: {
            layers: [
              {
                id: generateLayerId('emerging_hotspots_points'),
                type: 'point',
                config: {
                  dataId: datasetId,
                  label: 'Emerging Hotspots',
                  color: [138, 43, 226], // Purple color
                  columns: {
                    lat: 'latitude',
                    lng: 'longitude'
                  },
                  isVisible: true,
                  visConfig: {
                    opacity: 0.8,
                    thickness: 2,
                    strokeColor: [75, 0, 130],
                    strokeOpacity: 0.8,
                    filled: true,
                    stroked: true,
                    outline: true,
                    radius: 15,
                    fixedRadius: false,
                    radiusRange: [5, 30],
                    colorRange: {
                      name: 'Global Warming',
                      type: 'sequential',
                      category: 'Uber',
                      colors: [
                        '#440154',
                        '#482878',
                        '#3e4989',
                        '#31688e',
                        '#26828e',
                        '#1f9e89',
                        '#35b779',
                        '#6ece58',
                        '#b5de2b',
                        '#fde725'
                      ]
                    }
                  },
                  colorField: {
                    name: 'gi_score',
                    type: 'real'
                  },
                  sizeField: {
                    name: 'incident_count',
                    type: 'integer'
                  }
                }
              }
            ]
          }
        }
      })
    );

    // Auto-center map after emerging hotspots analysis
    setTimeout(() => {
      centerMapToTrivandrum(store);
    }, 500);

    // Show analysis summary
    const features = geojsonData.features;
    const hotSpots = features.filter(f => f.properties?.hotspot_type === 'Hot Spot').length;
    const emergingHotSpots = features.filter(f => f.properties?.hotspot_type === 'Emerging Hot Spot').length;
    const coldSpots = features.filter(f => f.properties?.hotspot_type === 'Cold Spot').length;
    
    console.log(`Emerging hotspots analysis loaded successfully:
      - Total features: ${features.length}
      - Hot spots: ${hotSpots}
      - Emerging hot spots: ${emergingHotSpots}
      - Cold spots: ${coldSpots}`);

    // Success message
    alert(`Emerging hotspots analysis loaded: ${features.length} features detected`);

  } catch (error) {
    console.error('Failed to load emerging hotspots data:', error);
    alert(`Failed to load emerging hotspots data: ${error.message}`);
  }
};