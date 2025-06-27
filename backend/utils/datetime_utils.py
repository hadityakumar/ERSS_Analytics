import pandas as pd

def get_part_of_day(hour):
    """Categorize hour into part of day"""
    if 6 <= hour < 12:
        return 'MORNING'
    elif 12 <= hour < 18:
        return 'AFTERNOON'
    elif 18 <= hour < 24:
        return 'EVENING'
    else:
        return 'NIGHT'

def parse_datetime_string(datetime_str):
    """Parse datetime string with multiple format support"""
    formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d %H:%M',
        '%Y/%m/%d %H:%M:%S.%f',
        '%Y/%m/%d %H:%M:%S',
        '%Y-%m-%d'
    ]
    
    for fmt in formats:
        try:
            return pd.to_datetime(datetime_str, format=fmt)
        except:
            continue
    
    try:
        return pd.to_datetime(datetime_str)
    except:
        return None