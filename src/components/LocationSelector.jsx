import React, { useState } from 'react';
import DistrictDropdown from './DistrictDropdown';
import CityDropdown from './CityDropdown';

const LocationSelector = ({ onLocationChange }) => {
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
    // Reset city when district changes
    setSelectedCity('All Cities');
    
    // Notify parent of location change
    onLocationChange?.({
      district: district,
      city: 'All Cities'
    });
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    
    // Notify parent of location change
    onLocationChange?.({
      district: selectedDistrict,
      city: city
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: 'black' }}>
        Location Filter
      </div>
      
      <DistrictDropdown onSelectionChange={handleDistrictChange} />
      <CityDropdown 
        selectedDistrict={selectedDistrict} 
        onSelectionChange={handleCityChange} 
      />
      
      {/* Status display */}
      {(selectedDistrict !== 'All Districts' || selectedCity !== 'All Cities') && (
        <div style={{
          fontSize: '11px',
          color: '#666',
          marginTop: '4px',
          padding: '4px 8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #e9ecef'
        }}>
          {selectedDistrict !== 'All Districts' && selectedCity !== 'All Cities' 
            ? `${selectedCity}, ${selectedDistrict}`
            : selectedDistrict !== 'All Districts' 
              ? `All cities in ${selectedDistrict}`
              : `${selectedCity} (All districts)`
          }
        </div>
      )}
    </div>
  );
};

export default LocationSelector;