import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateMap } from '@kepler.gl/actions';

const DEFAULT_COORDINATES = {
  latitude: 8.565,
  longitude: 76.958,
  zoom: 9
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

    const latDiff = Math.abs(currentLat - targetLat);
    const lngDiff = Math.abs(currentLng - targetLng);
    const zoomDiff = Math.abs(currentZoom - targetZoom);

    if (latDiff < 0.001 && lngDiff < 0.001 && zoomDiff < 0.1) {
      return;
    }

    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);

      const lat = lerp(currentLat, targetLat, easedProgress);
      const lng = lerp(currentLng, targetLng, easedProgress);
      const zoom = lerp(currentZoom, targetZoom, easedProgress);

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
    <>
      <style>{`
        .center-icon-btn {
          width: 35px;
          height: 35px;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 50%;
          outline: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: visible;
          transition: background 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s cubic-bezier(.4,0,.2,1), transform 0.16s;
          box-shadow: none;
        }
        .center-icon-btn img {
          width: 44px;
          height: 44px;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          transition: filter 0.18s cubic-bezier(.4,0,.2,1);
          filter: none;
          pointer-events: none;
          user-select: none;
          z-index: 1;
        }
        .center-icon-btn:hover,
        .center-icon-btn:focus-visible,
        .center-icon-btn:active {
          background: #111;
          box-shadow: 0 2px 8px rgba(0,0,0,0.16);
        }
        .center-icon-btn:hover img,
        .center-icon-btn:focus-visible img,
        .center-icon-btn:active img {
          filter: invert(1);
        }
        .center-icon-btn:focus {
          outline: none;
        }
      `}</style>
      <button
        className="center-icon-btn"
        onClick={centerMap}
        tabIndex={0}
        aria-label="Center map on Trivandrum"
        title="Center map on Trivandrum"
        type="button"
      >
        <img
          src="/center_button.svg"
          alt=""
          draggable={false}
        />
      </button>
    </>
  );
};

export default CenterButton;
