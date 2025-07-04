import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ACTION_TYPES } from '../middleware/utils/constants';

const ToggleEmergingHotspotsButton = () => {
  const dispatch = useDispatch();
  const [isLayerVisible, setIsLayerVisible] = useState(false);

  // Monitor Kepler.gl state for emerging hotspots layers
  const keplerState = useSelector(state => state.keplerGl?.map);
  const layers = keplerState?.visState?.layers || [];

  // Find emerging hotspots layer
  const emergingHotspotsLayer = layers.find(layer =>
    layer.config?.label?.includes('Emerging Hotspots') ||
    layer.id?.includes('emerging_hotspots') ||
    (layer.config?.label?.includes('Emerging') && layer.config?.label?.includes('Hotspot'))
  );

  // Update visibility state when emerging hotspots layer is added or visibility changes
  useEffect(() => {
    if (emergingHotspotsLayer) {
      setIsLayerVisible(emergingHotspotsLayer.config.isVisible);
    } else {
      setIsLayerVisible(false);
    }
  }, [emergingHotspotsLayer]);

  const handleToggleLayer = () => {
    if (!emergingHotspotsLayer) {
      alert('No emerging hotspots layer found. Please run emerging hotspots analysis first.');
      return;
    }

    const newVisibility = !isLayerVisible;

    dispatch({
      type: ACTION_TYPES.TOGGLE_EMERGING_HOTSPOTS_VISIBILITY,
      payload: { isVisible: newVisibility }
    });

    setIsLayerVisible(newVisibility);
  };

  return (
    <>
      <style>{`
        .toggle-emerging-btn {
          width: 30px;
          height: 30px;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 50%;
          outline: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition:
            background 0.16s cubic-bezier(.4,0,.2,1),
            box-shadow 0.20s cubic-bezier(.4,0,.2,1),
            transform 0.16s cubic-bezier(.4,0,.2,1),
            opacity 0.2s;
          box-shadow: none;
        }
        .toggle-emerging-btn img {
          width: 21px;
          height: 21px;
          transition: filter 0.16s, transform 0.16s, opacity 0.2s;
          filter: none;
          pointer-events: none;
          user-select: none;
          display: block;
        }
        /* HOVER (inactive) */
        .toggle-emerging-btn:not(.active):not(:disabled):hover,
        .toggle-emerging-btn:not(.active):not(:disabled):focus-visible {
          background: #111;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transform: scale(1.08);
        }
        .toggle-emerging-btn:not(.active):not(:disabled):hover img,
        .toggle-emerging-btn:not(.active):not(:disabled):focus-visible img {
          filter: invert(1);
        }
        /* ACTIVE (visible) */
        .toggle-emerging-btn.active {
          background: #111;
          box-shadow: 0 0 0 2px #fff, 0 2px 8px rgba(0,0,0,0.13);
          transform: scale(1.12);
        }
        .toggle-emerging-btn.active img {
          filter: invert(1);
        }
        /* HOVER while ACTIVE */
        .toggle-emerging-btn.active:hover,
        .toggle-emerging-btn.active:focus-visible {
          background: #111;
          box-shadow: 0 0 0 3px #fff, 0 4px 12px rgba(0,0,0,0.18);
          transform: scale(1.18);
        }
        .toggle-emerging-btn.active:hover img,
        .toggle-emerging-btn.active:focus-visible img {
          filter: invert(1);
        }
        /* DISABLED */
        .toggle-emerging-btn:disabled,
        .toggle-emerging-btn[disabled] {
          background: transparent !important;
          box-shadow: none !important;
          cursor: not-allowed !important;
          opacity: 0.5;
        }
        .toggle-emerging-btn:disabled img,
        .toggle-emerging-btn[disabled] img {
          filter: grayscale(1) opacity(0.5) !important;
        }
        /* Pressed (click) feedback */
        .toggle-emerging-btn:active {
          transform: scale(0.97);
        }
        .toggle-emerging-btn:focus {
          outline: none;
        }
      `}</style>
      <button
        className={`toggle-emerging-btn${isLayerVisible ? ' active' : ''}`}
        onClick={handleToggleLayer}
        disabled={!emergingHotspotsLayer}
        tabIndex={0}
        aria-label={
          !emergingHotspotsLayer
            ? "No emerging hotspots layer available"
            : isLayerVisible
              ? "Hide Emerging Hotspots Layer"
              : "Show Emerging Hotspots Layer"
        }
        title={
          !emergingHotspotsLayer
            ? "No emerging hotspots layer available"
            : isLayerVisible
              ? "Hide Emerging Hotspots Layer"
              : "Show Emerging Hotspots Layer"
        }
        type="button"
      >
        <img
          src="emerging.svg"
          alt=""
          draggable={false}
        />
      </button>
    </>
  );
};

export default ToggleEmergingHotspotsButton;
