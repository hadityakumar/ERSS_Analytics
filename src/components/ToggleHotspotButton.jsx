import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ACTION_TYPES } from '../middleware/utils/constants';

const ToggleHotspotButton = () => {
  const dispatch = useDispatch();
  const [isLayerVisible, setIsLayerVisible] = useState(false);

  // Monitor Kepler.gl state for hotspot layers
  const keplerState = useSelector(state => state.keplerGl?.map);
  const layers = keplerState?.visState?.layers || [];

  // Find hotspot layer
  const hotspotLayer = layers.find(layer => 
    (layer.type === 'heatmap' && layer.config?.label?.includes('Hotspot')) ||
    (layer.config?.label?.includes('Hotspot') && !layer.config?.label?.includes('Emerging')) ||
    (layer.id?.includes('hotspot') && !layer.id?.includes('emerging'))
  );

  // Update visibility state when hotspot layer is added or visibility changes
  useEffect(() => {
    if (hotspotLayer) {
      setIsLayerVisible(hotspotLayer.config.isVisible);
    } else {
      setIsLayerVisible(false);
    }
  }, [hotspotLayer]);

  const handleToggleLayer = () => {
    if (!hotspotLayer) {
      alert('No hotspot layer found. Please run hotspot analysis first.');
      return;
    }

    const newVisibility = !isLayerVisible;

    dispatch({
      type: ACTION_TYPES.TOGGLE_HOTSPOT_VISIBILITY,
      payload: { isVisible: newVisibility }
    });

    setIsLayerVisible(newVisibility);
  };

  return (
    <>
      <style>{`
        .toggle-hotspot-btn {
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
          overflow: hidden;
          transition:
            background 0.16s cubic-bezier(.4,0,.2,1),
            box-shadow 0.20s cubic-bezier(.4,0,.2,1),
            transform 0.16s cubic-bezier(.4,0,.2,1),
            opacity 0.2s;
          box-shadow: none;
        }
        .toggle-hotspot-btn img {
          width: 50%;
          height: 50%;
          object-fit: contain;
          transition: filter 0.16s, transform 0.16s, opacity 0.2s;
          filter: none;
          pointer-events: none;
          user-select: none;
          z-index: 1;
          display: block;
        }
        /* HOVER (inactive) */
        .toggle-hotspot-btn:not(.active):not(:disabled):hover,
        .toggle-hotspot-btn:not(.active):not(:disabled):focus-visible {
          background: #111;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transform: scale(1.08);
        }
        .toggle-hotspot-btn:not(.active):not(:disabled):hover img,
        .toggle-hotspot-btn:not(.active):not(:disabled):focus-visible img {
          filter: invert(1);
        }
        /* ACTIVE (visible) */
        .toggle-hotspot-btn.active {
          background: #111;
          box-shadow: 0 0 0 2px #fff, 0 2px 8px rgba(0,0,0,0.13);
          transform: scale(1.12);
        }
        .toggle-hotspot-btn.active img {
          filter: invert(1);
        }
        /* HOVER while ACTIVE */
        .toggle-hotspot-btn.active:hover,
        .toggle-hotspot-btn.active:focus-visible {
          background: #111;
          box-shadow: 0 0 0 3px #fff, 0 4px 12px rgba(0,0,0,0.18);
          transform: scale(1.18);
        }
        .toggle-hotspot-btn.active:hover img,
        .toggle-hotspot-btn.active:focus-visible img {
          filter: invert(1);
        }
        /* DISABLED */
        .toggle-hotspot-btn:disabled,
        .toggle-hotspot-btn[disabled] {
          background: transparent !important;
          box-shadow: none !important;
          cursor: not-allowed !important;
          opacity: 0.5;
        }
        .toggle-hotspot-btn:disabled img,
        .toggle-hotspot-btn[disabled] img {
          filter: grayscale(1) opacity(0.5) !important;
        }
        /* Pressed (click) feedback */
        .toggle-hotspot-btn:active {
          transform: scale(0.97);
        }
        .toggle-hotspot-btn:focus {
          outline: none;
        }
      `}</style>
      <button
        className={`toggle-hotspot-btn${isLayerVisible ? ' active' : ''}`}
        onClick={handleToggleLayer}
        disabled={!hotspotLayer}
        tabIndex={0}
        aria-label={
          !hotspotLayer
            ? "No hotspot layer available"
            : isLayerVisible
              ? "Hide Hotspot Layer"
              : "Show Hotspot Layer"
        }
        title={
          !hotspotLayer
            ? "No hotspot layer available"
            : isLayerVisible
              ? "Hide Hotspot Layer"
              : "Show Hotspot Layer"
        }
        type="button"
      >
        <img
          src="hotspots.svg"
          alt=""
          draggable={false}
        />
      </button>
    </>
  );
};

export default ToggleHotspotButton;
