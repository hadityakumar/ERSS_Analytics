import pandas as pd
import numpy as np
import argparse
import json
import sys
import os
from sklearn.neighbors import BallTree
from datetime import datetime
from shapely.geometry import Point, shape

def get_part_of_day(hour):
    """
    Categorize hour into part of day
    MORNING: 6-12, AFTERNOON: 12-18, EVENING: 18-24, NIGHT: 0-6
    """
    if 6 <= hour < 12:
        return 'MORNING'
    elif 12 <= hour < 18:
        return 'AFTERNOON'
    elif 18 <= hour < 24:
        return 'EVENING'
    else:  # 0 <= hour < 6
        return 'NIGHT'

def load_city_boundary(geojson_path):
    """
    Load city boundary from GeoJSON file and return shapely geometry objects
    """
    try:
        with open(geojson_path, 'r') as f:
            geojson_data = json.load(f)
        
        geometries = []
        for feature in geojson_data['features']:
            geom = shape(feature['geometry'])
            geometries.append(geom)
        
        return geometries
    
    except Exception as e:
        print(f"Error loading city boundary: {str(e)}")
        return []

def point_in_city(lat, lon, city_geometries):
    """
    Check if a point (lat, lon) is inside any of the city boundary geometries
    """
    point = Point(lon, lat)
    
    for geom in city_geometries:
        if geom.contains(point):
            return True
    
    return False

def apply_filters(df, severities=None, part_of_day=None, city_location='all', main_types=None, subtypes=None):
    """
    Apply filters to the processed data
    """
    filtered_df = df.copy()
    
    # Apply main type filter
    if main_types and len(main_types) > 0:
        if 'ahp_weighted_event_types_main_type' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['ahp_weighted_event_types_main_type'].isin(main_types)]
            print(f"Records after main type filtering: {len(filtered_df)}")
    
    # Apply subtype filter
    if subtypes and len(subtypes) > 0:
        if 'ahp_weighted_event_types_sub_type' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['ahp_weighted_event_types_sub_type'].isin(subtypes)]
            print(f"Records after subtype filtering: {len(filtered_df)}")
    
    # Apply severity filter
    if severities and len(severities) > 0:
        if 'ahp_weighted_event_types_label' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['ahp_weighted_event_types_label'].isin(severities)]
            print(f"Records after severity filtering: {len(filtered_df)}")
    
    # Apply part of day filter
    if part_of_day and len(part_of_day) > 0:
        if 'part_of_day' in filtered_df.columns:
            filtered_df = filtered_df[filtered_df['part_of_day'].isin(part_of_day)]
            print(f"Records after part of day filtering: {len(filtered_df)}")
    
    # Apply city location filter
    if city_location != 'all':
        if 'inside_trvcity' in filtered_df.columns:
            if city_location == 'inside':
                filtered_df = filtered_df[filtered_df['inside_trvcity'] == True]
            elif city_location == 'outside':
                filtered_df = filtered_df[filtered_df['inside_trvcity'] == False]
            print(f"Records after city location filtering: {len(filtered_df)}")
    
    return filtered_df

def parse_datetime_string(datetime_str):
    """
    Parse various datetime string formats
    """
    # Try different datetime formats
    formats = [
        '%Y-%m-%d %H:%M:%S',  # 2024-01-01 12:30:45
        '%Y-%m-%d %H:%M',     # 2024-01-01 12:30
        '%Y/%m/%d %H:%M:%S.%f',  # Original format
        '%Y/%m/%d %H:%M:%S',     # Without microseconds
        '%Y-%m-%d',           # Date only
    ]
    
    for fmt in formats:
        try:
            return pd.to_datetime(datetime_str, format=fmt)
        except:
            continue
    
    # If none of the formats work, try pandas auto-parsing
    try:
        return pd.to_datetime(datetime_str)
    except:
        return None

def main():
    parser = argparse.ArgumentParser(description='Process CSV data with optional datetime filtering and additional filters.')
    parser.add_argument('--start-date', type=str, help='Start datetime for filtering (YYYY-MM-DD HH:MM:SS)')
    parser.add_argument('--end-date', type=str, help='End datetime for filtering (YYYY-MM-DD HH:MM:SS)')
    parser.add_argument('--main-types', type=str, help='Comma-separated list of main types')
    parser.add_argument('--subtypes', type=str, help='Comma-separated list of subtypes')
    parser.add_argument('--severities', type=str, help='Comma-separated list of severity levels')
    parser.add_argument('--part-of-day', type=str, help='Comma-separated list of part of day values')
    parser.add_argument('--city-location', type=str, choices=['all', 'inside', 'outside'], 
                       default='all', help='City location filter')
    parser.add_argument('--combined-filtering', action='store_true', 
                       help='Apply both datetime and other filters together')
    
    args = parser.parse_args()
    
    # Parse comma-separated values for filters
    main_types = None
    if args.main_types:
        main_types = [s.strip() for s in args.main_types.split(',')]
    
    subtypes = None
    if args.subtypes:
        subtypes = [s.strip() for s in args.subtypes.split(',')]
    
    severities = None
    if args.severities:
        severities = [s.strip() for s in args.severities.split(',')]
    
    part_of_day = None
    if args.part_of_day:
        part_of_day = [p.strip() for p in args.part_of_day.split(',')]
    
    # Determine if this is a filtering operation
    has_datetime_filter = args.start_date and args.end_date
    has_other_filters = any([main_types, subtypes, severities, part_of_day, args.city_location != 'all'])
    is_filtering = has_other_filters or (has_datetime_filter and args.combined_filtering)

    try:
        # Load city boundary
        city_geometries = load_city_boundary('./data/trv_city.geojson')
        
        # Load data
        csv1 = pd.read_csv('input_data.csv')
        csv2 = pd.read_csv('police_station.csv')
        
        # Process datetime and add part_of_day column
        if 'signal_lan' in csv1.columns:
            csv1['signal_lan'] = csv1['signal_lan'].apply(parse_datetime_string)
            csv1 = csv1.dropna(subset=['signal_lan'])
            csv1['part_of_day'] = csv1['signal_lan'].dt.hour.apply(get_part_of_day)
        
        # Add inside_city column
        if city_geometries:
            csv1['inside_trvcity'] = csv1.apply(
                lambda row: point_in_city(row['latitude'], row['longitude'], city_geometries), 
                axis=1
            )
        else:
            csv1['inside_trvcity'] = False
        
        # Apply datetime filtering if provided
        if has_datetime_filter:
            try:
                start_datetime = parse_datetime_string(args.start_date)
                end_datetime = parse_datetime_string(args.end_date)
                
                if start_datetime is not None and end_datetime is not None:
                    print(f"Filtering data from {start_datetime} to {end_datetime}")
                    mask = (csv1['signal_lan'] >= start_datetime) & (csv1['signal_lan'] <= end_datetime)
                    csv1 = csv1[mask]
                    print(f"Records after datetime filtering: {len(csv1)}")
                else:
                    print("Warning: Could not parse start or end datetime")
            except Exception as e:
                print(f"Error in datetime filtering: {str(e)}")
        
        # Continue with spatial filtering (removing points near police stations)
        lat_col1, long_col1 = 'latitude', 'longitude'
        lat_col2, long_col2 = 'latitude', 'longitude'

        earth_radius = 6371000
        X2_radians = np.radians(csv2[[lat_col2, long_col2]].values)
        tree = BallTree(X2_radians, metric='haversine')

        X1_radians = np.radians(csv1[[lat_col1, long_col1]].values)

        radius_in_radians = 250 / earth_radius
        indices = tree.query_radius(X1_radians, r=radius_in_radians)

        mask = [len(idx) == 0 for idx in indices]

        processed_df = csv1[mask]
        
        print(f"Records after police station filtering: {len(processed_df)}")
        
        # Apply additional filters if this is a filtering request
        if is_filtering and has_other_filters:
            filtered_df = apply_filters(
                processed_df, 
                severities=severities, 
                part_of_day=part_of_day, 
                city_location=args.city_location,
                main_types=main_types,
                subtypes=subtypes
            )
            
            print(f"Records after all additional filtering: {len(filtered_df)}")
            
            # Save filtered data
            output_file = 'filtered_data.csv'
            filtered_df.to_csv(output_file, index=False, encoding='utf-8')
            
        else:
            # Save the base processed data (with datetime filter applied if provided)
            output_file = 'ps_removed_dt.csv'
            processed_df.to_csv(output_file, index=False)
        
        print(f"Data saved to {output_file}")
        
    except Exception as e:
        print(f"Error processing CSV: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
        
if __name__ == "__main__":
    main()