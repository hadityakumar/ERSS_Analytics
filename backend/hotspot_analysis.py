import pandas as pd
import geopandas as gpd
import numpy as np
from shapely.geometry import Point, Polygon
from esda.getisord import G_Local
from libpysal.weights import DistanceBand
import argparse
import sys
import os

def perform_hotspot_analysis(start_date=None, end_date=None):
    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, 'filtered_data.csv')
        output_path = os.path.join(script_dir, 'hotspot_analysis_results.csv')
        
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
        
        # Create geometry and GeoDataFrame
        geometry = [Point(xy) for xy in zip(df['longitude'], df['latitude'])]
        gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326")
        
        # Transform to projected CRS
        gdf = gdf.to_crs("EPSG:32643")
        
        # Get study area bounds
        minx, miny, maxx, maxy = gdf.total_bounds
        print(f"Study area bounds: {minx}, {miny}, {maxx}, {maxy}")
        
        # Create grid
        cell_size = 200
        nx = int((maxx - minx) / cell_size)
        ny = int((maxy - miny) / cell_size)
        
        grid_cells = []
        for i in range(nx):
            for j in range(ny):
                x0 = minx + i * cell_size
                y0 = miny + j * cell_size
                x1 = minx + (i + 1) * cell_size
                y1 = miny + (j + 1) * cell_size
                grid_cells.append(Polygon([(x0, y0), (x1, y0), (x1, y1), (x0, y1)]))
        
        grid = gpd.GeoDataFrame({'geometry': grid_cells}, crs=gdf.crs)
        grid['cell_id'] = range(len(grid))
        
        # Spatial join
        spatial_join = gpd.sjoin(grid, gdf, how="left", predicate="contains")
        
        # Aggregate weights
        try:
            grid_stats = spatial_join.groupby('index_left')['ahp_weighted_event_types_nor_weight'].sum().fillna(0)
        except KeyError:
            try:
                grid_stats = spatial_join.groupby('cell_id')['ahp_weighted_event_types_nor_weight'].sum().fillna(0)
            except KeyError:
                grid_stats = spatial_join.groupby(level=0)['ahp_weighted_event_types_nor_weight'].sum().fillna(0)
        
        # Add weights to grid
        grid['weight_sum'] = 0
        for idx, weight in grid_stats.items():
            if isinstance(idx, tuple):
                idx = idx[0]
            if idx in grid.index:
                grid.loc[idx, 'weight_sum'] = weight
            elif 'cell_id' in grid.columns and idx in grid['cell_id'].values:
                grid.loc[grid['cell_id'] == idx, 'weight_sum'] = weight
        
        # Filter populated cells
        grid_populated = grid[grid['weight_sum'] > 0].copy()
        print(f"Number of populated grid cells: {len(grid_populated)}")
        
        if len(grid_populated) < 3:
            print("Not enough populated cells for hotspot analysis")
            return False
        
        # Create centroids for spatial weights
        grid_populated['centroid'] = grid_populated.geometry.centroid
        grid_populated_pts = grid_populated.copy()
        grid_populated_pts.geometry = grid_populated_pts.centroid
        
        # Calculate spatial weights
        weights = DistanceBand.from_dataframe(
            grid_populated_pts, 
            threshold=500, 
            binary=False,
            alpha=-2.0,
            silence_warnings=True
        )
        
        # Perform Getis-Ord analysis
        y = grid_populated['weight_sum'].values
        g_local = G_Local(y, weights)
        
        grid_populated['gi_star'] = g_local.Zs
        grid_populated['p_value'] = g_local.p_sim
        grid_populated['hotspot'] = np.nan
        
        # Classify hotspots
        alpha = 0.05
        grid_populated.loc[grid_populated['p_value'] <= alpha, 'hotspot'] = np.sign(
            grid_populated.loc[grid_populated['p_value'] <= alpha, 'gi_star']
        )
        
        # Create categories
        conditions = [
            (grid_populated['hotspot'] == 1) & (grid_populated['p_value'] <= 0.01),
            (grid_populated['hotspot'] == 1) & (grid_populated['p_value'] <= 0.05),
            (grid_populated['hotspot'] == 1) & (grid_populated['p_value'] <= 0.1),
            (grid_populated['hotspot'] == -1) & (grid_populated['p_value'] <= 0.01),
            (grid_populated['hotspot'] == -1) & (grid_populated['p_value'] <= 0.05),
            (grid_populated['hotspot'] == -1) & (grid_populated['p_value'] <= 0.1),
            (grid_populated['p_value'] > 0.1)
        ]
        
        categories = [
            'Hot Spot (99% Confidence)',
            'Hot Spot (95% Confidence)',
            'Hot Spot (90% Confidence)',
            'Cold Spot (99% Confidence)',
            'Cold Spot (95% Confidence)',
            'Cold Spot (90% Confidence)',
            'Not Significant'
        ]
        
        grid_populated['hotspot_category'] = np.select(conditions, categories, default='Not Significant')
        
        # Transform back to WGS84
        grid_populated = grid_populated.to_crs("EPSG:4326")
        
        # Calculate centroids and extract lat/lng for heatmap
        centroids = grid_populated.geometry.centroid
        grid_populated['longitude'] = centroids.x
        grid_populated['latitude'] = centroids.y
        
        # Create output CSV with latitude/longitude columns for direct heatmap use
        output_df = grid_populated[['latitude', 'longitude', 'gi_star', 'p_value', 'hotspot_category', 'weight_sum']]
        
        # Save results to the backend directory
        output_df.to_csv(output_path, index=False)
        
        print(f"Hotspot analysis complete. Results saved to {output_path}")
        print(f"File size: {os.path.getsize(output_path)} bytes")
        print(f"Total hotspots found: {len(grid_populated[grid_populated['hotspot'] == 1])}")
        print(f"Total coldspots found: {len(grid_populated[grid_populated['hotspot'] == -1])}")
        
        # Show first few rows
        print("First few rows of output:")
        print(output_df.head())
        
        # Verify file was created and has content
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            print("Output file created successfully")
            return True
        else:
            print("Error: Output file was not created or is empty")
            return False
        
    except Exception as e:
        print(f"Error in hotspot analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Perform hotspot analysis')
    parser.add_argument('--start-date', type=str, help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, help='End date (YYYY-MM-DD)')
    
    args = parser.parse_args()
    
    success = perform_hotspot_analysis(args.start_date, args.end_date)
    sys.exit(0 if success else 1)