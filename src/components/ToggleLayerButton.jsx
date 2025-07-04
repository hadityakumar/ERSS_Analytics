import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const ToggleLayerButton = () => {
  const dispatch = useDispatch();
  const [isLayerVisible, setIsLayerVisible] = useState(false);

  // Get Kepler.gl state to check actual layer visibility
  const keplerState = useSelector(state => state.keplerGl?.map);

  // Sync button state with actual layer visibility
  useEffect(() => {
    if (keplerState && keplerState.visState && keplerState.visState.layers) {
      const cityLayer = keplerState.visState.layers.find(layer =>
        layer.config.label === 'City Boundaries' ||
        (layer.type === 'geojson' && layer.config.dataId.includes('geojson-data'))
      );
      if (cityLayer) {
        setIsLayerVisible(cityLayer.config.isVisible);
      }
    }
  }, [keplerState]);

  const handleToggleLayer = () => {
    const newVisibility = !isLayerVisible;
    dispatch({
      type: 'TOGGLE_GEOJSON_VISIBILITY',
      payload: { isVisible: newVisibility }
    });
    setIsLayerVisible(newVisibility);
  };

  return (
    <>
      <style>{`
        .toggle-layer-btn {
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
          transition:
            background 0.16s cubic-bezier(.4,0,.2,1),
            box-shadow 0.20s cubic-bezier(.4,0,.2,1),
            transform 0.16s cubic-bezier(.4,0,.2,1);
          box-shadow: none;
        }
        .toggle-layer-btn img {
          width: 44px;
          height: 44px;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          transition: filter 0.16s, transform 0.16s;
          filter: none;
          pointer-events: none;
          user-select: none;
          z-index: 1;
        }
        /* HOVER (inactive) */
        .toggle-layer-btn:not(.active):hover,
        .toggle-layer-btn:not(.active):focus-visible {
          background: #111;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transform: scale(1.08);
        }
        .toggle-layer-btn:not(.active):hover img,
        .toggle-layer-btn:not(.active):focus-visible img {
          filter: invert(1);
          transform: translate(-50%, -50%) scale(1.08);
        }
        /* ACTIVE (visible) */
        .toggle-layer-btn.active {
          background: #111;
          box-shadow: 0 0 0 2px #fff, 0 2px 8px rgba(0,0,0,0.13);
          transform: scale(1.12);
        }
        .toggle-layer-btn.active img {
          filter: invert(1);
          transform: translate(-50%, -50%) scale(1.12);
        }
        /* HOVER while ACTIVE */
        .toggle-layer-btn.active:hover,
        .toggle-layer-btn.active:focus-visible {
          background: #111;
          box-shadow: 0 0 0 3px #fff, 0 4px 12px rgba(0,0,0,0.18);
          transform: scale(1.18);
        }
        .toggle-layer-btn.active:hover img,
        .toggle-layer-btn.active:focus-visible img {
          filter: invert(1);
          transform: translate(-50%, -50%) scale(1.18);
        }
        /* Pressed (click) feedback */
        .toggle-layer-btn:active {
          transform: scale(0.97);
        }
        .toggle-layer-btn:focus {
          outline: none;
        }
      `}</style>
      <button
        className={`toggle-layer-btn${isLayerVisible ? ' active' : ''}`}
        onClick={handleToggleLayer}
        tabIndex={0}
        aria-label={isLayerVisible ? "Hide City Boundaries" : "Show City Boundaries"}
        title={isLayerVisible ? "Hide City Boundaries" : "Show City Boundaries"}
        type="button"
      >
        <img src="building_button.svg" alt="" draggable={false} />
      </button>
    </>
  );
};

export default ToggleLayerButton;
