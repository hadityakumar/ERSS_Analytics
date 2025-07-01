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
from datetime import datetime
from tqdm import tqdm

# Suppress specific warnings for cleaner output
warnings.filterwarnings("ignore", category=RuntimeWarning, module="scipy.sparse")
warnings.filterwarnings("ignore", category=UserWarning, module="libpysal")

def valid_date(s):
    """Validate date format (YYYY-MM-DD)"""
    try:
        return datetime.strptime(s, "%Y-%m-%d")
    except ValueError:
        msg = f"Not a valid date: '{s}'. Expected format YYYY-MM-DD"
        raise argparse.ArgumentTypeError(msg)

def create_space_time_cube(gdf, time_interval='2W', cell_size=500):
    """Create space-time cube with Mann-Kendall trends and larger grid cells"""
    # Temporal binning
    date_range = pd.date_range(
        start=gdf['date'].min(),
        end=gdf['date'].max(),
        freq=time_interval
    )
    gdf['time_bin'] = pd.cut(gdf['date'], bins=date_range)
    
    # Spatial grid
    minx, miny, maxx, maxy = gdf.total_bounds
    x_coords = np.arange(minx, maxx, cell_size)
    y_coords = np.arange(miny, maxy, cell_size)
    grid_cells = [
        Point(x, y).buffer(cell_size/2, cap_style=3)
        for x in x_coords
        for y in y_coords
    ]
    grid = gpd.GeoDataFrame(geometry=grid_cells, crs=gdf.crs)
    grid['cell_id'] = grid.index
    
    # Spatiotemporal aggregation
    joined = gpd.sjoin(gdf, grid, how='left', predicate='within')
    cube = joined.groupby(['cell_id', 'time_bin'], observed=True).size().unstack(fill_value=0)
    
    # Mann-Kendall for each grid cell
    mk_results = {}
    for cell_id, row in cube.iterrows():
        if row.sum() > 0:
            try:
                mk_results[cell_id] = original_test(row.values)
            except:
                mk_results[cell_id] = None
    return cube, grid, mk_results

def detect_emerging_hotspots(cube, grid, mk_results, time_step=4, distance=500):
    """Sliding window hotspot detection with classification"""
    results = []
    time_bins = cube.columns.tolist()
    for t in tqdm(range(time_step, len(time_bins)), desc="Processing time bins"):
        time_window = time_bins[t-time_step:t]
        data = cube[time_window].sum(axis=1).reset_index(name='crime_count')
        merged = grid.merge(data, on='cell_id', how='left').fillna(0)
        if merged['crime_count'].sum() == 0:
            continue
        centroids = merged.geometry.centroid
        coords = list(zip(centroids.x, centroids.y))
        w = DistanceBand(coords, threshold=distance, binary=True)
        try:
            gi = G_Local(merged['crime_count'].values, w, transform='B')
            merged['gi_score'] = gi.Zs
            merged['p_value'] = np.nan_to_num(gi.p_sim, nan=1.0, posinf=1.0, neginf=1.0)
        except Exception as e:
            print(f"Spatial analysis failed: {str(e)}", file=sys.stderr)
            merged['gi_score'] = 0
            merged['p_value'] = 1.0
        merged['time_bin'] = str(time_bins[t])
        def get_trend(x):
            if x and hasattr(x, 'trend'):
                return x.trend
            return None
        merged['mk_trend'] = merged['cell_id'].map(
            lambda x: get_trend(mk_results.get(x))
        )
        # Hotspot classification
        conditions = [
            (merged['p_value'] <= 0.01) & (merged['gi_score'] > 0),
            (merged['p_value'] <= 0.05) & (merged['gi_score'] > 0),
            (merged['p_value'] <= 0.1) & (merged['gi_score'] > 0),
            (merged['p_value'] <= 0.01) & (merged['gi_score'] < 0),
            (merged['p_value'] <= 0.05) & (merged['gi_score'] < 0),
            (merged['p_value'] <= 0.1) & (merged['gi_score'] < 0)
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
        results.append(merged)
    if results:
        hotspots = gpd.GeoDataFrame(pd.concat(results), crs=grid.crs)
        hotspots['time_bin'] = hotspots['time_bin'].astype(str)
        return hotspots
    else:
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Emerging Hotspot Analysis')
    
    # Add arguments matching your React API call
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
    
    print("Loading data...")
    df = pd.read_csv('ps_removed_dt.csv', parse_dates=['signal_lan'])
    df = df.rename(columns={'signal_lan': 'date'})
    
    # Apply date filtering if provided
    if args.start_date or args.end_date:
        start = args.start_date or df['date'].min()
        end = args.end_date or df['date'].max()
        df = df[(df['date'] >= start) & (df['date'] <= end)]
    
    print("Creating spatial data...")
    gdf = gpd.GeoDataFrame(
        df,
        geometry=gpd.points_from_xy(df.longitude, df.latitude),
        crs="EPSG:4326"
    ).to_crs("EPSG:32643")
    
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
    
    if hotspots is not None:
        # Filter and prepare output
        hotspots = hotspots[hotspots['crime_count'] > 0]
        hotspots = hotspots[hotspots['p_value'] <= 0.1]
        hotspots = hotspots.to_crs("EPSG:4326")
        keep_columns = [
            'geometry', 'time_bin', 'crime_count',
            'gi_score', 'p_value', 'hotspot_type', 'emerging_type'
        ]
        hotspots = hotspots[keep_columns]
        
        print("Saving optimized GeoJSON...")
        hotspots.to_file('emerging_hotspots.geojson', driver='GeoJSON')
        print("Analysis complete. Results saved to emerging_hotspots.geojson")
        print(f"Output contains {len(hotspots)} features")
    else:
        print("Analysis produced no valid hotspots")
        sys.exit(1)  # Exit with error code for backend detection
