import pandas as pd
import geopandas as gpd
import numpy as np
from shapely.geometry import Point
from libpysal.weights import DistanceBand
from esda.getisord import G_Local
from pymannkendall import original_test
import warnings
import argparse
import json
from datetime import datetime

warnings.filterwarnings("ignore")

def valid_date(s):
    try:
        if ' ' in s:
            return datetime.strptime(s.split(' ')[0], "%Y-%m-%d")
        return datetime.strptime(s, "%Y-%m-%d")
    except ValueError:
        return datetime.fromisoformat(s.replace('Z', '')).replace(tzinfo=None)

def create_space_time_cube(gdf, time_interval='2W', cell_size=500):
    date_range = pd.date_range(start=gdf['date'].min(), end=gdf['date'].max(), freq=time_interval)
    gdf['time_bin'] = pd.cut(gdf['date'], bins=date_range, include_lowest=True)
    gdf = gdf.dropna(subset=['time_bin'])
    
    # Create spatial grid
    minx, miny, maxx, maxy = gdf.total_bounds
    x_coords = np.arange(minx, maxx, cell_size)
    y_coords = np.arange(miny, maxy, cell_size)
    
    grid_cells = [Point(x + cell_size/2, y + cell_size/2).buffer(cell_size/2, cap_style=3) 
                  for x in x_coords for y in y_coords]
    
    grid = gpd.GeoDataFrame(geometry=grid_cells, crs=gdf.crs)
    grid['cell_id'] = grid.index
    
    # Spatiotemporal aggregation
    joined = gpd.sjoin(gdf, grid, how='left', predicate='within').dropna(subset=['index_right'])
    cube = joined.groupby(['index_right', 'time_bin'], observed=True).size().unstack(fill_value=0)
    
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
    results = []
    time_bins = cube.columns.tolist()
    
    for t in range(time_step, len(time_bins)):
        time_window = time_bins[t-time_step:t]
        data = cube[time_window].sum(axis=1).reset_index(name='crime_count')
        
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
        except:
            merged['gi_score'] = 0
            merged['p_value'] = 1.0
        
        merged['time_bin'] = str(time_bins[t])
        merged['mk_trend'] = merged['grid_index'].map(
            lambda x: mk_results.get(x).trend if mk_results.get(x) and hasattr(mk_results.get(x), 'trend') else 'no trend'
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
        merged.loc[(merged['hotspot_type'].str.contains('Hot')) & (merged['mk_trend'] == 'increasing'), 'emerging_type'] = 'Intensifying'
        merged.loc[(merged['hotspot_type'].str.contains('Hot')) & (merged['mk_trend'] == 'decreasing'), 'emerging_type'] = 'Diminishing'
        merged.loc[(merged['hotspot_type'].str.contains('Cold')) & (merged['mk_trend'] == 'decreasing'), 'emerging_type'] = 'Cooling'
        
        significant = merged[merged['hotspot_type'] != 'Not Significant'].copy()
        if len(significant) > 0:
            results.append(significant)
    
    return gpd.GeoDataFrame(pd.concat(results, ignore_index=True), crs=grid.crs) if results else None

def main():
    parser = argparse.ArgumentParser(description='Emerging Hotspot Analysis')
    parser.add_argument('--input_file', default='ps_removed_dt.csv')
    parser.add_argument('--start_date', type=valid_date)
    parser.add_argument('--end_date', type=valid_date)
    parser.add_argument('--time_interval', default='2W')
    parser.add_argument('--time_step', type=int, default=4)
    parser.add_argument('--distance', type=int, default=500)
    parser.add_argument('--cell_size', type=int, default=500)
    
    args = parser.parse_args()
    
    try:
        df = pd.read_csv(args.input_file)
        
        # Handle date column
        if 'signal_lan' in df.columns:
            df['date'] = pd.to_datetime(df['signal_lan'], errors='coerce')
        elif 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
        
        df = df.dropna(subset=['date'])
        
        # Apply date filtering
        if args.start_date or args.end_date:
            start = args.start_date or df['date'].min()
            end = args.end_date or df['date'].max()
            df = df[(df['date'] >= start) & (df['date'] <= end)]
        
        # Create spatial data
        df = df.dropna(subset=['longitude', 'latitude'])
        df = df[(df['longitude'] != 0) & (df['latitude'] != 0)]
        
        gdf = gpd.GeoDataFrame(
            df, geometry=gpd.points_from_xy(df['longitude'], df['latitude']), crs="EPSG:4326"
        ).to_crs("EPSG:32643")
        
        cube, grid, mk_results = create_space_time_cube(gdf, args.time_interval, args.cell_size)
        hotspots = detect_emerging_hotspots(cube, grid, mk_results, args.time_step, args.distance)
        
        if hotspots is not None and len(hotspots) > 0:
            hotspots = hotspots[hotspots['crime_count'] > 0].to_crs("EPSG:4326")
            
            centroids = hotspots.geometry.centroid
            hotspots['latitude'] = centroids.y
            hotspots['longitude'] = centroids.x
            
            keep_columns = ['geometry', 'time_bin', 'crime_count', 'gi_score', 'p_value', 
                          'hotspot_type', 'emerging_type', 'latitude', 'longitude']
            hotspots = hotspots[[col for col in keep_columns if col in hotspots.columns]]
            
            hotspots.to_file('emerging_hotspots.geojson', driver='GeoJSON')
        else:
            with open('emerging_hotspots.geojson', 'w') as f:
                json.dump({"type": "FeatureCollection", "features": []}, f)
            
    except Exception as e:
        with open('emerging_hotspots.geojson', 'w') as f:
            json.dump({"type": "FeatureCollection", "features": []}, f)
        raise e

if __name__ == "__main__":
    main()