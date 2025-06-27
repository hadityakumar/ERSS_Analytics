import numpy as np
from sklearn.neighbors import BallTree

class SpatialProcessor:
    def __init__(self, earth_radius=6371000, exclusion_radius=250):
        self.earth_radius = earth_radius
        self.exclusion_radius = exclusion_radius
    
    def remove_near_police_stations(self, crime_df, police_df):
        """Remove crime points near police stations"""
        # Convert coordinates to radians
        police_coords = np.radians(police_df[['latitude', 'longitude']].values)
        crime_coords = np.radians(crime_df[['latitude', 'longitude']].values)
        
        # Build spatial index
        tree = BallTree(police_coords, metric='haversine')
        
        # Find points within exclusion radius
        radius_in_radians = self.exclusion_radius / self.earth_radius
        indices = tree.query_radius(crime_coords, r=radius_in_radians)
        
        # Create mask for points NOT near police stations
        mask = [len(idx) == 0 for idx in indices]
        
        return crime_df[mask]