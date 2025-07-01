import pandas as pd
import geopandas as gpd
import numpy as np
from shapely.geometry import Point
from libpysal.weights import DistanceBand
from esda.getisord import G_Local
from pymannkendall import original_test
import warnings
import argparse
import sys
import json
from datetime import datetime
from tqdm import tqdm

# Suppress specific warnings for cleaner output
warnings.filterwarnings("ignore", category=RuntimeWarning, module="scipy.sparse")
warnings.filterwarnings("ignore", category=UserWarning, module="libpysal")

def valid_date(s):
    """Validate and parse date format (supports both YYYY-MM-DD and YYYY-MM-DD HH:MM:SS)"""
    try:
        # Try parsing datetime format first
        if ' ' in s:
            return datetime.strptime(s.split(' ')[0], "%Y-%m-%d")
        else:
            return datetime.strptime(s, "%Y-%m-%d")
    except ValueError:
        try:
            # Try ISO format
            return datetime.fromisoformat(s.replace('Z', '')).replace(tzinfo=None)
        except ValueError:
            msg = f"Not a valid date: '{s}'. Expected format YYYY-MM-DD or YYYY-MM-DD HH:MM:SS"
            raise argparse.ArgumentTypeError(msg)

def create_space_time_cube(gdf, time_interval='2W', cell_size=500):
    """Create space-time cube with Mann-Kendall trends and larger grid cells"""
    print(f"Creating space-time cube with {len(gdf)} incidents")
    
    # Temporal binning
    date_range = pd.date_range(
        start=gdf['date'].min(),
        end=gdf['date'].max(),
        freq=time_interval
    )
    
    if len(date_range) < 2:
        raise ValueError(f"Insufficient time range for analysis. Need at least 2 time periods, got {len(date_range)}")
    
    gdf['time_bin'] = pd.cut(gdf['date'], bins=date_range, include_lowest=True)
    
    # Remove rows with NaT time_bin
    gdf = gdf.dropna(subset=['time_bin'])
    
    if len(gdf) == 0:
        raise ValueError("No data remaining after temporal binning")
    
    # Spatial grid
    minx, miny, maxx, maxy = gdf.total_bounds
    print(f"Spatial bounds: {minx:.2f}, {miny:.2f}, {maxx:.2f}, {maxy:.2f}")
    
    x_coords = np.arange(minx, maxx, cell_size)
    y_coords = np.arange(miny, maxy, cell_size)
    
    grid_cells = []
    for x in x_coords:
        for y in y_coords:
            cell = Point(x + cell_size/2, y + cell_size/2).buffer(cell_size/2, cap_style=3)
            grid_cells.append(cell)
    
    grid = gpd.GeoDataFrame(geometry=grid_cells, crs=gdf.crs)
    grid['cell_id'] = grid.index
    print(f"Created {len(grid)} grid cells")
    
    # Spatiotemporal aggregation
    joined = gpd.sjoin(gdf, grid, how='left', predicate='within')
    
    # Drop rows that don't fall within any grid cell
    joined = joined.dropna(subset=['index_right'])
    
    if len(joined) == 0:
        raise ValueError("No crimes fall within the grid cells")
    
    cube = joined.groupby(['index_right', 'time_bin'], observed=True).size().unstack(fill_value=0)
    print(f"Space-time cube dimensions: {cube.shape}")
    
    # Mann-Kendall for each grid cell
    mk_results = {}
    for cell_id, row in cube.iterrows():
        if row.sum() > 0:
            try:
                mk_results[cell_id] = original_test(row.values)
            except Exception as e:
                print(f"Mann-Kendall test failed for cell {cell_id}: {e}")
                mk_results[cell_id] = None
    
    return cube, grid, mk_results

def detect_emerging_hotspots(cube, grid, mk_results, time_step=4, distance=500):
    """Sliding window hotspot detection with classification"""
    print(f"Detecting hotspots with {time_step}-period sliding window")
    
    results = []
    time_bins = cube.columns.tolist()
    
    if len(time_bins) < time_step:
        raise ValueError(f"Not enough time periods for analysis. Need at least {time_step}, got {len(time_bins)}")
    
    for t in tqdm(range(time_step, len(time_bins)), desc="Processing time bins"):
        time_window = time_bins[t-time_step:t]
        data = cube[time_window].sum(axis=1).reset_index(name='crime_count')
        
        # Merge with grid using the correct index column
        merged = grid.reset_index().rename(columns={'index': 'grid_index'})
        merged = merged.merge(data, left_on='grid_index', right_on='index_right', how='left')
        merged['crime_count'] = merged['crime_count'].fillna(0)
        
        if merged['crime_count'].sum() == 0:
            continue
        
        centroids = merged.geometry.centroid
        coords = list(zip(centroids.x, centroids.y))
        
        try:
            w = DistanceBand(coords, threshold=distance, binary=True)
            gi = G_Local(merged['crime_count'].values, w, transform='B')
            merged['gi_score'] = gi.Zs
            merged['p_value'] = np.nan_to_num(gi.p_sim, nan=1.0, posinf=1.0, neginf=1.0)
        except Exception as e:
            print(f"Spatial analysis failed for time period {t}: {str(e)}")
            merged['gi_score'] = 0
            merged['p_value'] = 1.0
        
        merged['time_bin'] = str(time_bins[t])
        
        def get_trend(x):
            if x and hasattr(x, 'trend'):
                return x.trend
            return 'no trend'
        
        merged['mk_trend'] = merged['grid_index'].map(
            lambda x: get_trend(mk_results.get(x))
        )
        
        # Hotspot classification
        conditions = [
            (merged['p_value'] <= 0.01) & (merged['gi_score'] > 2.58),
            (merged['p_value'] <= 0.05) & (merged['gi_score'] > 1.96),
            (merged['p_value'] <= 0.1) & (merged['gi_score'] > 1.65),
            (merged['p_value'] <= 0.01) & (merged['gi_score'] < -2.58),
            (merged['p_value'] <= 0.05) & (merged['gi_score'] < -1.96),
            (merged['p_value'] <= 0.1) & (merged['gi_score'] < -1.65)
        ]
        choices = [
            'Hot Spot (99% Conf)', 'Hot Spot (95% Conf)', 'Hot Spot (90% Conf)',
            'Cold Spot (99% Conf)', 'Cold Spot (95% Conf)', 'Cold Spot (90% Conf)'
        ]
        merged['hotspot_type'] = np.select(conditions, choices, default='Not Significant')
        
        # Emerging hotspot classification
        merged['emerging_type'] = 'Neutral'
        merged.loc[
            (merged['hotspot_type'].str.contains('Hot')) & 
            (merged['mk_trend'] == 'increasing'),
            'emerging_type'
        ] = 'Intensifying'
        merged.loc[
            (merged['hotspot_type'].str.contains('Hot')) & 
            (merged['mk_trend'] == 'decreasing'),
            'emerging_type'
        ] = 'Diminishing'
        merged.loc[
            (merged['hotspot_type'].str.contains('Cold')) & 
            (merged['mk_trend'] == 'decreasing'),
            'emerging_type'
        ] = 'Cooling'
        
        # Only keep significant results
        significant = merged[merged['hotspot_type'] != 'Not Significant'].copy()
        if len(significant) > 0:
            results.append(significant)
    
    if results:
        hotspots = gpd.GeoDataFrame(pd.concat(results, ignore_index=True), crs=grid.crs)
        hotspots['time_bin'] = hotspots['time_bin'].astype(str)
        return hotspots
    else:
        return None

def main():
    parser = argparse.ArgumentParser(description='Emerging Hotspot Analysis')
    
    # Add arguments matching your React API call
    parser.add_argument('--input_file', default='ps_removed_dt.csv',
                        help='Input CSV file path (default: ps_removed_dt.csv)')
    parser.add_argument('--start_date', type=valid_date, 
                        help='Start date in YYYY-MM-DD format')
    parser.add_argument('--end_date', type=valid_date, 
                        help='End date in YYYY-MM-DD format')
    parser.add_argument('--time_interval', default='2W',
                        help='Time interval for binning (e.g., 1W, 2W, 1M)')
    parser.add_argument('--time_step', type=int, default=4,
                        help='Temporal window size in time bins')
    parser.add_argument('--distance', type=int, default=500,
                        help='Spatial neighborhood distance in meters')
    parser.add_argument('--cell_size', type=int, default=500,
                        help='Grid cell size in meters')
    
    args = parser.parse_args()
    
    try:
        print("Starting Emerging Hotspots Analysis")
        print(f"Input file: {args.input_file}")
        print(f"Parameters: time_interval={args.time_interval}, time_step={args.time_step}, distance={args.distance}")
        
        print("Loading data...")
        df = pd.read_csv(args.input_file)
        
        # Handle different possible date column names
        if 'signal_lan' in df.columns:
            df['date'] = pd.to_datetime(df['signal_lan'], errors='coerce')
        elif 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
        else:
            raise ValueError("No date column found. Expected 'signal_lan' or 'date'")
        
        # Drop rows with invalid dates
        df = df.dropna(subset=['date'])
        
        print(f"Loaded {len(df)} crime incidents")
        
        # Apply date filtering if provided
        if args.start_date or args.end_date:
            start = args.start_date or df['date'].min()
            end = args.end_date or df['date'].max()
            
            print(f"Filtering data from {start} to {end}")
            df = df[(df['date'] >= start) & (df['date'] <= end)]
            print(f"Filtered to {len(df)} incidents for date range")
        
        if len(df) == 0:
            raise ValueError("No data available for the specified date range")
        
        print("Creating spatial data...")
        # Remove rows with invalid coordinates
        df = df.dropna(subset=['longitude', 'latitude'])
        df = df[(df['longitude'] != 0) & (df['latitude'] != 0)]
        
        if len(df) == 0:
            raise ValueError("No valid coordinates found in the data")
        
        gdf = gpd.GeoDataFrame(
            df,
            geometry=gpd.points_from_xy(df['longitude'], df['latitude']),
            crs="EPSG:4326"
        ).to_crs("EPSG:32643")  # UTM Zone 43N for India
        
        print("Creating space-time cube...")
        cube, grid, mk_results = create_space_time_cube(
            gdf, 
            time_interval=args.time_interval, 
            cell_size=args.cell_size
        )
        
        print("Detecting emerging hotspots...")
        hotspots = detect_emerging_hotspots(
            cube, 
            grid,
            mk_results,
            time_step=args.time_step,
            distance=args.distance
        )
        
        if hotspots is not None and len(hotspots) > 0:
            # Filter and prepare output
            hotspots = hotspots[hotspots['crime_count'] > 0]
            hotspots = hotspots.to_crs("EPSG:4326")
            
            # Add centroid coordinates for point visualization
            centroids = hotspots.geometry.centroid
            hotspots['latitude'] = centroids.y
            hotspots['longitude'] = centroids.x
            
            keep_columns = [
                'geometry', 'time_bin', 'crime_count',
                'gi_score', 'p_value', 'hotspot_type', 'emerging_type',
                'latitude', 'longitude'
            ]
            
            # Only keep columns that exist
            available_columns = [col for col in keep_columns if col in hotspots.columns]
            hotspots = hotspots[available_columns]
            
            print("Saving GeoJSON...")
            hotspots.to_file('emerging_hotspots.geojson', driver='GeoJSON')
            
            print("Analysis complete. Results saved to emerging_hotspots.geojson")
            print(f"Output contains {len(hotspots)} features")
            print(f"Hot spots: {len(hotspots[hotspots['hotspot_type'].str.contains('Hot', na=False)])}")
            print(f"Cold spots: {len(hotspots[hotspots['hotspot_type'].str.contains('Cold', na=False)])}")
            print(f"Intensifying patterns: {len(hotspots[hotspots['emerging_type'] == 'Intensifying'])}")
        else:
            print("No significant hotspots detected in the analysis period")
            # Create empty GeoJSON
            empty_geojson = {
                "type": "FeatureCollection",
                "features": []
            }
            with open('emerging_hotspots.geojson', 'w') as f:
                json.dump(empty_geojson, f)
            print("Created empty results file")
            
    except Exception as e:
        print(f"Error during analysis: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        # Create empty GeoJSON on error
        empty_geojson = {
            "type": "FeatureCollection", 
            "features": []
        }
        with open('emerging_hotspots.geojson', 'w') as f:
            json.dump(empty_geojson, f)
        sys.exit(1)

if __name__ == "__main__":
    main()
