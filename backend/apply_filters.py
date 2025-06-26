import pandas as pd
import argparse
import sys
import os

def apply_filters(severities=None, part_of_day=None, city_location='all'):
    """
    Apply filters to the crime data and save the filtered result.
    """
    try:
        # Read the original processed CSV file
        input_file = 'ps_removed_dt.csv'
        output_file = 'filtered_data.csv'
        
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Input file {input_file} not found. Please process the CSV first.")
        
        print(f"Reading data from {input_file}...")
        
        # Try different encodings if UTF-8 fails
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
        df = None
        
        for encoding in encodings:
            try:
                df = pd.read_csv(input_file, encoding=encoding)
                print(f"Successfully read CSV with {encoding} encoding")
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            raise Exception("Could not read CSV file with any supported encoding")
        
        print(f"Original data shape: {df.shape}")
        print(f"Columns available: {list(df.columns)}")
        
        # Start with the full dataset
        filtered_df = df.copy()
        
        # Apply severity filter
        if severities and len(severities) > 0:
            print(f"Applying severity filter: {severities}")
            if 'ahp_weighted_event_types_label' in filtered_df.columns:
                filtered_df = filtered_df[filtered_df['ahp_weighted_event_types_label'].isin(severities)]
                print(f"After severity filter: {filtered_df.shape}")
            else:
                print("Warning: ahp_weighted_event_types_label column not found!")
                available_severity_cols = [col for col in df.columns if 'severity' in col.lower() or 'event' in col.lower()]
                print(f"Available severity-related columns: {available_severity_cols}")
        
        # Apply part of day filter
        if part_of_day and len(part_of_day) > 0:
            print(f"Applying part of day filter: {part_of_day}")
            if 'part_of_day' in filtered_df.columns:
                filtered_df = filtered_df[filtered_df['part_of_day'].isin(part_of_day)]
                print(f"After part of day filter: {filtered_df.shape}")
            else:
                print("Warning: part_of_day column not found!")
                available_time_cols = [col for col in df.columns if 'time' in col.lower() or 'day' in col.lower() or 'hour' in col.lower()]
                print(f"Available time-related columns: {available_time_cols}")
        
        # Apply city location filter
        if city_location != 'all':
            print(f"Applying city location filter: {city_location}")
            if 'inside_trvcity' in filtered_df.columns:
                if city_location == 'inside':
                    # Filter for True values (inside city)
                    filtered_df = filtered_df[filtered_df['inside_trvcity'] == True]
                elif city_location == 'outside':
                    # Filter for False values (outside city)
                    filtered_df = filtered_df[filtered_df['inside_trvcity'] == False]
                print(f"After city location filter: {filtered_df.shape}")
            else:
                print("Warning: inside_trvcity column not found!")
                available_location_cols = [col for col in df.columns if 'city' in col.lower() or 'location' in col.lower()]
                print(f"Available location-related columns: {available_location_cols}")
        
        # Save the filtered data
        print(f"Saving filtered data to {output_file}...")
        filtered_df.to_csv(output_file, index=False, encoding='utf-8')
        
        print(f"Filter application completed successfully!")
        print(f"Final filtered data shape: {filtered_df.shape}")
        print(f"Filtered data saved to: {output_file}")
        
        # Print summary of applied filters
        filter_summary = []
        if severities and len(severities) > 0:
            filter_summary.append(f"Severities: {', '.join(severities)}")
        if part_of_day and len(part_of_day) > 0:
            filter_summary.append(f"Part of Day: {', '.join(part_of_day)}")
        if city_location != 'all':
            filter_summary.append(f"Location: {'Inside City' if city_location == 'inside' else 'Outside City'}")
        
        if filter_summary:
            print(f"Applied filters: {' | '.join(filter_summary)}")
        else:
            print("No filters applied - returning all data")
        
        # Print record counts
        print(f"\n=== SUMMARY ===")
        print(f"Original records: {len(df)}")
        print(f"Filtered records: {len(filtered_df)}")
        print(f"Records removed: {len(df) - len(filtered_df)}")
        if len(df) > 0:
            print(f"Percentage remaining: {(len(filtered_df) / len(df) * 100):.2f}%")
            
        return True
        
    except Exception as e:
        print(f"Error applying filters: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

def main():
    parser = argparse.ArgumentParser(description='Apply filters to crime data')
    parser.add_argument('--severities', type=str, help='Comma-separated list of severity levels')
    parser.add_argument('--part-of-day', type=str, help='Comma-separated list of part of day values')
    parser.add_argument('--city-location', type=str, choices=['all', 'inside', 'outside'], 
                       default='all', help='City location filter')
    
    args = parser.parse_args()
    
    # Parse comma-separated values
    severities = None
    if args.severities:
        severities = [s.strip() for s in args.severities.split(',')]
    
    part_of_day = None
    if args.part_of_day:
        part_of_day = [p.strip() for p in args.part_of_day.split(',')]
    
    print("=" * 50)
    print("CRIME DATA FILTER APPLICATION")
    print("=" * 50)
    print(f"Severities: {severities if severities else 'All'}")
    print(f"Part of Day: {part_of_day if part_of_day else 'All'}")
    print(f"City Location: {args.city_location}")
    print("=" * 50)
    
    success = apply_filters(
        severities=severities,
        part_of_day=part_of_day,
        city_location=args.city_location
    )
    
    if success:
        print("Filter application completed successfully!")
        sys.exit(0)
    else:
        print("Filter application failed!", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()