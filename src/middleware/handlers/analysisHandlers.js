import { processCsvData } from '@kepler.gl/processors';
import { addDataToMap } from '@kepler.gl/actions';
import { fetchHotspotData, fetchKdeData } from '../services/apiService';
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

export const handleLoadKdeData = async (store) => {
  try {
    const csvText = await fetchKdeData();
    const parsedData = processCsvData(csvText);
    
    if (parsedData.rows.length === 0) {
      alert('No KDE data found. Please run the analysis first.');
      return;
    }

    const datasetId = generateDatasetId('kde');
    store.dispatch(
      addDataToMap({
        datasets: [{
          info: { id: datasetId, label: 'KDE Analysis' },
          data: parsedData
        }],
        options: { centerMap: false, keepExistingConfig: true },
        config: {
          visState: {
            layers: [{
              id: generateLayerId('kde'),
              type: 'heatmap',
              config: {
                dataId: datasetId,
                label: 'KDE Heatmap',
                color: [46, 134, 171],
                columns: { lat: 'latitude', lng: 'longitude' },
                isVisible: true,
                visConfig: {
                  opacity: 0.8,
                  colorRange: {
                    colors: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b']
                  },
                  radius: 60,
                  intensity: 2,
                  threshold: 0.01
                },
                weightField: { name: 'kde_weight', type: 'real' }
              }
            }]
          }
        }
      })
    );

    // Auto-center map after KDE analysis
    setTimeout(() => {
      centerMapToTrivandrum(store);
    }, 500);
  } catch (error) {
    alert(`Failed to load KDE data: ${error.message}`);
  }
};