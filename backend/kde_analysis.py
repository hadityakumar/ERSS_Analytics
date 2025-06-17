import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, Polygon
import numpy as np
from scipy.stats import gaussian_kde
import argparse
import sys
import os

def perform_kde_analysis(start_date=None, end_date=None):
    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, 'ps_removed_dt.csv')
        output_path = os.path.join(script_dir, 'kde_analysis_results.csv')
        
        print(f"Script directory: {script_dir}")
        print(f"Looking for CSV at: {csv_path}")
        print(f"Will save results to: {output_path}")
        
        # Check if input file exists
        if not os.path.exists(csv_path):
            print(f"Error: Input CSV file not found at {csv_path}")
            return False
        
        # Read the CSV file
        df = pd.read_csv(csv_path)
        print(f"Loaded {len(df)} rows from CSV")
        
        # Filter by date range if provided
        if start_date and end_date:
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                df = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
                print(f"Filtered data: {len(df)} records between {start_date} and {end_date}")
        
        if len(df) == 0:
            print("No data available for the specified date range")
            return False
        
        print("Loading data...")
        geometry = [Point(xy) for xy in zip(df['longitude'], df['latitude'])]
        gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326")
        
        # Transform to projected CRS for accurate distance calculations
        gdf = gdf.to_crs("EPSG:32643")
        
        coords = np.vstack([gdf.geometry.x, gdf.geometry.y])
        
        minx, miny, maxx, maxy = gdf.total_bounds
        print(f"Study area bounds: {minx}, {miny}, {maxx}, {maxy}")
        
        # Use smaller cell size for finer resolution
        cell_size = 200  # Smaller cells for better detail
        
        x_range = np.arange(minx, maxx + cell_size, cell_size)
        y_range = np.arange(miny, maxy + cell_size, cell_size)
        x_grid, y_grid = np.meshgrid(x_range, y_range)
        
        print("Performing Kernel Density Estimation...")
        positions = np.vstack([x_grid.ravel(), y_grid.ravel()])
        
        # Use weights if available, otherwise use simple count-based KDE
        try:
            weights = gdf['ahp_weighted_event_types_nor_weight'].values
            kde = gaussian_kde(coords, weights=weights)
            print("Using weighted KDE")
        except (KeyError, AttributeError):
            kde = gaussian_kde(coords)
            print("Using unweighted KDE")
        
        # Calculate KDE values for all grid points
        z = kde(positions)
        
        # Reshape the result to match the grid
        z = z.reshape(x_grid.shape)
        
        print(f"KDE values range: {z.min()} to {z.max()}")
        
        # Use a more selective threshold - only top 10% of values
        threshold_percentile = 90  # Only keep top 10% of density values
        threshold = np.percentile(z, threshold_percentile)
        
        print(f"Using threshold: {threshold} (top {100-threshold_percentile}% of values)")
        
        # Create output data only for cells above threshold
        output_data = []
        
        for i in range(len(x_range)-1):
            for j in range(len(y_range)-1):
                kde_value = z[j, i]  # Note: j, i order matches y, x
                
                # Only include cells above threshold
                if kde_value > threshold:
                    # Calculate cell center coordinates
                    center_x = (x_range[i] + x_range[i+1]) / 2
                    center_y = (y_range[j] + y_range[j+1]) / 2
                    
                    output_data.append({
                        'x_projected': center_x,
                        'y_projected': center_y,
                        'kde_value': kde_value
                    })
        
        if len(output_data) == 0:
            print("No significant density areas found above threshold")
            return False
        
        print(f"Found {len(output_data)} significant density cells out of {len(x_range)*len(y_range)} total cells")
        
        # Create DataFrame with the filtered results
        result_df = pd.DataFrame(output_data)
        
        # Create a more discriminating weight field using log transformation
        # This will amplify differences between high and low density areas
        min_val = result_df['kde_value'].min()
        max_val = result_df['kde_value'].max()
        
        # Log transform to spread out the values more
        result_df['kde_log'] = np.log10(result_df['kde_value'] + 1e-10)  # Add small value to avoid log(0)
        
        # Normalize the log values
        log_min = result_df['kde_log'].min()
        log_max = result_df['kde_log'].max()
        result_df['kde_log_normalized'] = (result_df['kde_log'] - log_min) / (log_max - log_min)
        
        # Create an exponential weight that emphasizes high-density areas
        result_df['kde_weight'] = np.power(result_df['kde_log_normalized'], 2) * 100  # Square for more contrast
        
        # Regular normalized version
        result_df['kde_normalized'] = (result_df['kde_value'] - min_val) / (max_val - min_val)
        
        # Add percentile ranks within the filtered data
        result_df['percentile'] = result_df['kde_value'].rank(pct=True) * 100
        
        # Create more distinct categories based on percentiles
        conditions = [
            (result_df['percentile'] >= 95),   # Top 5%
            (result_df['percentile'] >= 80) & (result_df['percentile'] < 95),   # Next 15%
            (result_df['percentile'] >= 60) & (result_df['percentile'] < 80),   # Next 20%
            (result_df['percentile'] >= 40) & (result_df['percentile'] < 60),   # Next 20%
            (result_df['percentile'] < 40)    # Bottom 40%
        ]
        categories = [
            'Extreme High Density',
            'Very High Density',
            'High Density',
            'Medium Density',
            'Low Density'
        ]
        result_df['density_category'] = np.select(conditions, categories, default='Low Density')
        
        # Convert projected coordinates back to WGS84
        print("Converting to WGS84 for Kepler.gl...")
        
        # Create points for coordinate transformation
        projected_points = [Point(xy) for xy in zip(result_df['x_projected'], result_df['y_projected'])]
        temp_gdf = gpd.GeoDataFrame(result_df, geometry=projected_points, crs="EPSG:32643")
        
        # Transform to WGS84
        temp_gdf_wgs84 = temp_gdf.to_crs("EPSG:4326")
        
        # Extract lat/lng coordinates
        result_df['longitude'] = temp_gdf_wgs84.geometry.x
        result_df['latitude'] = temp_gdf_wgs84.geometry.y
        
        # Create final output CSV with the new weight field
        output_columns = ['latitude', 'longitude', 'kde_value', 'kde_normalized', 'kde_weight', 'percentile', 'density_category']
        output_df = result_df[output_columns]
        
        # Save results to the backend directory
        output_df.to_csv(output_path, index=False)
        
        print(f"KDE analysis complete. Results saved to {output_path}")
        print(f"File size: {os.path.getsize(output_path)} bytes")
        print(f"Total density cells: {len(output_df)}")
        print(f"Raw KDE value range: {output_df['kde_value'].min():.8f} to {output_df['kde_value'].max():.8f}")
        print(f"Weight field range: {output_df['kde_weight'].min():.2f} to {output_df['kde_weight'].max():.2f}")
        
        # Show distribution of density categories
        print("\nDensity category distribution:")
        print(output_df['density_category'].value_counts())
        
        # Show weight distribution
        print(f"\nWeight statistics:")
        print(f"Min weight: {output_df['kde_weight'].min():.2f}")
        print(f"Max weight: {output_df['kde_weight'].max():.2f}") 
        print(f"Mean weight: {output_df['kde_weight'].mean():.2f}")
        print(f"Std weight: {output_df['kde_weight'].std():.2f}")
        
        # Show first few rows
        print("\nFirst few rows of output:")
        print(output_df.head())
        
        # Verify file was created and has content
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            print("Output file created successfully")
            return True
        else:
            print("Error: Output file was not created or is empty")
            return False
        
    except Exception as e:
        print(f"Error in KDE analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Perform KDE analysis')
    parser.add_argument('--start-date', type=str, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, help='End date (YYYY-MM-DD)')
    
    args = parser.parse_args()
    
    success = perform_kde_analysis(args.start_date, args.end_date)
    sys.exit(0 if success else 1)