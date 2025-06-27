import pandas as pd
from utils.datetime_utils import parse_datetime_string

class FilterProcessor:
    def __init__(self):
        self.filter_columns = {
            'main_types': 'ahp_weighted_event_types_main_type',
            'subtypes': 'ahp_weighted_event_types_sub_type',
            'severities': 'ahp_weighted_event_types_label',
            'part_of_day': 'part_of_day',
            'city_location': 'inside_trvcity'
        }
    
    def has_filters(self, args):
        """Check if any filters are provided"""
        return any([
            args.main_types, args.subtypes, args.severities, 
            args.part_of_day, args.city_location != 'all'
        ])
    
    def apply_datetime_filter(self, df, start_date, end_date):
        """Apply datetime filtering"""
        start_datetime = parse_datetime_string(start_date)
        end_datetime = parse_datetime_string(end_date)
        
        if start_datetime and end_datetime:
            mask = (df['signal_lan'] >= start_datetime) & (df['signal_lan'] <= end_datetime)
            return df[mask]
        return df
    
    def apply_all_filters(self, df, args):
        """Apply all specified filters"""
        filtered_df = df.copy()
        
        # Parse filter arguments
        filters = {
            'main_types': self._parse_csv_arg(args.main_types),
            'subtypes': self._parse_csv_arg(args.subtypes),
            'severities': self._parse_csv_arg(args.severities),
            'part_of_day': self._parse_csv_arg(args.part_of_day)
        }
        
        # Apply each filter
        for filter_name, values in filters.items():
            if values:
                filtered_df = self._apply_filter(filtered_df, filter_name, values)
        
        # Apply city location filter
        if args.city_location != 'all':
            filtered_df = self._apply_city_location_filter(filtered_df, args.city_location)
        
        return filtered_df
    
    def _apply_filter(self, df, filter_name, values):
        """Apply a specific filter"""
        column = self.filter_columns[filter_name]
        if column in df.columns:
            return df[df[column].isin(values)]
        return df
    
    def _apply_city_location_filter(self, df, location):
        """Apply city location filter"""
        if 'inside_trvcity' in df.columns:
            if location == 'inside':
                return df[df['inside_trvcity'] == True]
            elif location == 'outside':
                return df[df['inside_trvcity'] == False]
        return df
    
    def _parse_csv_arg(self, arg):
        """Parse comma-separated argument"""
        return [s.strip() for s in arg.split(',')] if arg else None