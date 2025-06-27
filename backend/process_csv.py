import pandas as pd
import numpy as np
import argparse
import sys
from processors.data_loader import DataLoader
from processors.filter_processor import FilterProcessor
from processors.spatial_processor import SpatialProcessor
from utils.datetime_utils import parse_datetime_string, get_part_of_day

def main():
    args = parse_arguments()
    
    try:
        # Initialize processors
        data_loader = DataLoader()
        filter_processor = FilterProcessor()
        spatial_processor = SpatialProcessor()
        
        # Load and prepare data
        csv1, csv2, city_geometries = data_loader.load_all_data()
        csv1 = data_loader.prepare_data(csv1, city_geometries)
        
        # Apply datetime filtering if provided
        if args.start_date and args.end_date:
            csv1 = filter_processor.apply_datetime_filter(csv1, args.start_date, args.end_date)
        
        # Apply spatial filtering (remove points near police stations)
        processed_df = spatial_processor.remove_near_police_stations(csv1, csv2)
        
        # Apply additional filters if needed
        has_other_filters = filter_processor.has_filters(args)
        if has_other_filters:
            processed_df = filter_processor.apply_all_filters(processed_df, args)
            output_file = 'filtered_data.csv'
        else:
            output_file = 'ps_removed_dt.csv'
        
        # Save result
        processed_df.to_csv(output_file, index=False, encoding='utf-8')
        print(f"Data saved to {output_file}")
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

def parse_arguments():
    parser = argparse.ArgumentParser(description='Process CSV data with filtering options.')
    parser.add_argument('--start-date', type=str, help='Start datetime (YYYY-MM-DD HH:MM:SS)')
    parser.add_argument('--end-date', type=str, help='End datetime (YYYY-MM-DD HH:MM:SS)')
    parser.add_argument('--main-types', type=str, help='Comma-separated main types')
    parser.add_argument('--subtypes', type=str, help='Comma-separated subtypes')
    parser.add_argument('--severities', type=str, help='Comma-separated severities')
    parser.add_argument('--part-of-day', type=str, help='Comma-separated time periods')
    parser.add_argument('--city-location', type=str, choices=['all', 'inside', 'outside'], 
                       default='all', help='City location filter')
    parser.add_argument('--combined-filtering', action='store_true', 
                       help='Apply combined filtering')
    return parser.parse_args()

if __name__ == "__main__":
    main()