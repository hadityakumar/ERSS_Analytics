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
    const geojsonData = JSON.parse(response.data);
    
    if (!geojsonData.features || geojsonData.features.length === 0) {
      alert('No emerging hotspots detected in the analysis period.');
      return;
    }

    console.log('Processing emerging hotspots GeoJSON data:', geojsonData);

    const datasetId = generateDatasetId('emerging_hotspots');
    
    // Add the GeoJSON data to the map
    store.dispatch(
      addDataToMap({
        datasets: [{
          info: { 
            id: datasetId, 
            label: 'Emerging Hotspots Analysis',
            format: 'geojson'
          },
          data: geojsonData
        }],
        options: { centerMap: false, keepExistingConfig: true, readOnly: true },
        config: {
          visState: {
            layers: [
              {
                id: generateLayerId('emerging_hotspots_fill'),
                type: 'geojson',
                config: {
                  dataId: datasetId,
                  label: 'Emerging Hotspots (Fill)',
                  color: [138, 43, 226], // Purple color for emerging hotspots
                  columns: {
                    geojson: '_geojson'
                  },
                  isVisible: true,
                  visConfig: {
                    opacity: 0.6,
                    thickness: 2,
                    strokeColor: [75, 0, 130],
                    colorRange: {
                      colors: [
                        '#f1eef6', // Light purple for lower significance
                        '#d0d1e6', 
                        '#a6bddb',
                        '#74a9cf',
                        '#3690c0',
                        '#0570b0',
                        '#045a8d',
                        '#023858'  // Dark blue for highest significance
                      ]
                    },
                    strokeColorRange: {
                      colors: [
                        '#4a1486',
                        '#6a51a3', 
                        '#807dba',
                        '#9e9ac8',
                        '#bcbddc',
                        '#dadaeb',
                        '#efedf5',
                        '#fcfbfd'
                      ]
                    },
                    radius: 10,
                    sizeRange: [10, 50],
                    radiusRange: [10, 50],
                    heightRange: [0, 500],
                    elevationRange: [0, 500],
                    filled: true,
                    stroked: true,
                    extruded: false,
                    wireframe: false
                  },
                  colorField: {
                    name: 'gi_score',
                    type: 'real'
                  },
                  strokeColorField: {
                    name: 'hotspot_type',
                    type: 'string'
                  },
                  sizeField: {
                    name: 'incident_count',
                    type: 'integer'
                  }
                }
              },
              {
                id: generateLayerId('emerging_hotspots_points'),
                type: 'point',
                config: {
                  dataId: datasetId,
                  label: 'Emerging Hotspots (Points)',
                  color: [255, 0, 255], // Magenta for point visualization
                  columns: {
                    lat: 'latitude',
                    lng: 'longitude'
                  },
                  isVisible: false, // Hidden by default, can be toggled
                  visConfig: {
                    opacity: 0.8,
                    thickness: 2,
                    strokeColor: [128, 0, 128],
                    colorRange: {
                      colors: [
                        '#ffffcc',
                        '#fed976',
                        '#feb24c',
                        '#fd8d3c',
                        '#fc4e2a',
                        '#e31a1c',
                        '#bd0026',
                        '#800026'
                      ]
                    },
                    radius: 15,
                    radiusRange: [5, 30],
                    strokeColorRange: {
                      colors: [
                        '#4a1486',
                        '#6a51a3',
                        '#807dba',
                        '#9e9ac8'
                      ]
                    },
                    filled: true,
                    stroked: true,
                    outline: true
                  },
                  colorField: {
                    name: 'gi_score',
                    type: 'real'
                  },
                  strokeColorField: {
                    name: 'hotspot_type',
                    type: 'string'
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
    const hotSpots = features.filter(f => f.properties.hotspot_type === 'Hot Spot').length;
    const emergingHotSpots = features.filter(f => f.properties.hotspot_type === 'Emerging Hot Spot').length;
    const coldSpots = features.filter(f => f.properties.hotspot_type === 'Cold Spot').length;
    
    console.log(`Emerging hotspots analysis loaded successfully:
      - Total features: ${features.length}
      - Hot spots: ${hotSpots}
      - Emerging hot spots: ${emergingHotSpots}
      - Cold spots: ${coldSpots}`);

  } catch (error) {
    console.error('Failed to load emerging hotspots data:', error);
    alert(`Failed to load emerging hotspots data: ${error.message}`);
  }
};