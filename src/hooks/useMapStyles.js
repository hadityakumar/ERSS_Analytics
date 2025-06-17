import { useEffect } from 'react';

export const useMapStyles = () => {
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      /* Fix for mapboxgl-children black space */
      .mapboxgl-canvas-container,
      [mapboxgl-children] {
        position: absolute !important;
        height: auto !important;
        bottom: 0 !important;
      }
      
      /* Make sure the canvas container fills the parent */
      .mapboxgl-canvas-container {
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
      }
      
      /* Force proper canvas dimensions */
      canvas.mapboxgl-canvas {
        position: absolute !important;
        width: 100% !important;
        height: 100% !important;
      }

      /* Fix scrollbar flickering */
      html, body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        height: 100%;
        width: 100%;
      }
      
      /* Ensure no overflow on containers */
      #root {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
      }
      
      /* Prevent all mapbox elements from causing overflow */
      .mapboxgl-map,
      .mapboxgl-canvas-container,
      [mapboxgl-children],
      .overlays,
      .maplibregl-map {
        overflow: hidden !important;
      }
      
      /* Fix for animated elements */
      .mapboxgl-popup,
      .mapboxgl-marker {
        will-change: transform;
      }
      
      /* Fix for Kepler.gl containers */
      .kepler-gl {
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
};