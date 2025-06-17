import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateMap } from '@kepler.gl/actions';

const DEFAULT_COORDINATES = {
  latitude: 8.5241,
  longitude: 76.9366,
  zoom: 10
};

const easeOutQuad = (t) => t * (2 - t);

const lerp = (start, end, factor) => start + (end - start) * factor;

const CenterButton = () => {
  const dispatch = useDispatch();
  
  const currentLat = useSelector(state => state.keplerGl?.map?.mapState?.latitude || 8.5241);
  const currentLng = useSelector(state => state.keplerGl?.map?.mapState?.longitude || 76.9366);
  const currentZoom = useSelector(state => state.keplerGl?.map?.mapState?.zoom || 10);

  const centerMap = useCallback(() => {
    const targetLat = DEFAULT_COORDINATES.latitude;
    const targetLng = DEFAULT_COORDINATES.longitude;
    const targetZoom = DEFAULT_COORDINATES.zoom;
    
    // Skip animation if already at target location
    const latDiff = Math.abs(currentLat - targetLat);
    const lngDiff = Math.abs(currentLng - targetLng);
    const zoomDiff = Math.abs(currentZoom - targetZoom);
    
    if (latDiff < 0.001 && lngDiff < 0.001 && zoomDiff < 0.1) {
      return; // Already centered
    }
    
    // Animation parameters
    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);
      
      const lat = lerp(currentLat, targetLat, easedProgress);
      const lng = lerp(currentLng, targetLng, easedProgress);
      const zoom = lerp(currentZoom, targetZoom, easedProgress);
      
      // Update map state
      dispatch(updateMap({
        latitude: lat,
        longitude: lng,
        zoom: zoom,
        bearing: 0,
        pitch: 0
      }, 'map'));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [dispatch, currentLat, currentLng, currentZoom]);

  return (
    <div style={{
      position: 'absolute',
      top: '80px',
      right: '50px',
      zIndex: 1000
    }}>
      <button
        onClick={centerMap}
        style={{
          width: '35px',
          height: '35px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '17.5px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(4px)',
          padding: '6px',
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = 'rgba(30, 187, 214, 0.9)';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          e.target.style.transform = 'scale(1)';
        }}
        title="Center map on Trivandrum"
      >
        <img 
          src="/center-circle-svgrepo-com.svg" 
          alt="Center" 
          style={{
            width: '20px',
            height: '20px',
            filter: 'invert(0.2)',
            pointerEvents: 'none'
          }}
        />
      </button>
    </div>
  );
};

export default CenterButton;