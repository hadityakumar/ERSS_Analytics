import pandas as pd
import json
from shapely.geometry import Point, shape
from utils.datetime_utils import parse_datetime_string, get_part_of_day

class DataLoader:
    def __init__(self):
        self.input_files = {
            'crime_data': 'input_data.csv',
            'police_stations': 'police_station.csv',
            'city_boundary': './data/trv_city.geojson'
        }
    
    def load_all_data(self):
        """Load all required data files"""
        csv1 = pd.read_csv(self.input_files['crime_data'])
        csv2 = pd.read_csv(self.input_files['police_stations'])
        city_geometries = self._load_city_boundary()
        return csv1, csv2, city_geometries
    
    def prepare_data(self, df, city_geometries):
        """Prepare data by adding computed columns"""
        # Process datetime and add part_of_day
        if 'signal_lan' in df.columns:
            df['signal_lan'] = df['signal_lan'].apply(parse_datetime_string)
            df = df.dropna(subset=['signal_lan'])
            df['part_of_day'] = df['signal_lan'].dt.hour.apply(get_part_of_day)
        
        # Add inside_city column
        df['inside_trvcity'] = df.apply(
            lambda row: self._point_in_city(row['latitude'], row['longitude'], city_geometries), 
            axis=1
        ) if city_geometries else False
        
        return df
    
    def _load_city_boundary(self):
        """Load city boundary geometries"""
        try:
            with open(self.input_files['city_boundary'], 'r') as f:
                geojson_data = json.load(f)
            return [shape(feature['geometry']) for feature in geojson_data['features']]
        except Exception:
            return []
    
    def _point_in_city(self, lat, lon, city_geometries):
        """Check if point is inside city boundaries"""
        point = Point(lon, lat)
        return any(geom.contains(point) for geom in city_geometries)