import pandas as pd
import numpy as np
import argparse
from sklearn.neighbors import BallTree
from datetime import datetime

# Set up argument parser for date filtering
parser = argparse.ArgumentParser(description='Process CSV data with optional date filtering.')
parser.add_argument('--start-date', type=str, help='Start date for filtering (YYYY-MM-DD)')
parser.add_argument('--end-date', type=str, help='End date for filtering (YYYY-MM-DD)')
args = parser.parse_args()

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

print("Starting CSV processing...")

try:
    # Load data
    csv1 = pd.read_csv('csv_use_new.csv')
    csv2 = pd.read_csv('police_station.csv')
    
    if 'signal_lan' in csv1.columns:
        csv1['signal_lan'] = pd.to_datetime(csv1['signal_lan'], format='%Y/%m/%d %H:%M:%S.%f')
        
        # Create part of day column
        csv1['part_of_day'] = csv1['signal_lan'].dt.hour.apply(get_part_of_day)
        print(f"Added 'part_of_day' column with categories: {csv1['part_of_day'].value_counts().to_dict()}")
    
    if args.start_date and args.end_date:
        start_date = pd.to_datetime(args.start_date)
        end_date = pd.to_datetime(args.end_date)
        
        print(f"Filtering data from {start_date} to {end_date}")
        original_count = len(csv1)
        
        # Filter by date range
        csv1 = csv1[(csv1['signal_lan'] >= start_date) & (csv1['signal_lan'] <= end_date)]
        
        date_filtered_count = len(csv1)
        print(f"Date filtering: {original_count - date_filtered_count} points removed, {date_filtered_count} remaining")
        
        if date_filtered_count == 0:
            print("Warning: No data points match the date range")
    
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

    filtered_csv1 = csv1[mask]
    
    if 'signal_lan' in filtered_csv1.columns and not pd.api.types.is_datetime64_any_dtype(filtered_csv1['signal_lan']):
        filtered_csv1['signal_lan'] = pd.to_datetime(filtered_csv1['signal_lan'])
        
    # Save the filtered data
    filtered_csv1.to_csv('ps_removed_dt.csv', index=False)

    print(f"Original count: {len(csv1)}")
    print(f"Filtered count: {len(filtered_csv1)}")
    print(f"Removed {len(csv1) - len(filtered_csv1)} points that were within 250m of points in the second file")
    
    # Show part of day distribution in final filtered data
    if 'part_of_day' in filtered_csv1.columns:
        print(f"Part of day distribution in filtered data: {filtered_csv1['part_of_day'].value_counts().to_dict()}")
    
    print("CSV processing completed successfully")
    
except Exception as e:
    print(f"Error processing CSV: {str(e)}")
    exit(1)