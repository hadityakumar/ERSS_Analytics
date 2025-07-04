import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

const ToggleCrimePointsButton = () => {
  const dispatch = useDispatch();
  const [isLayerVisible, setIsLayerVisible] = useState(true);

  const handleToggleLayer = () => {
    const newVisibility = !isLayerVisible;
    dispatch({
      type: 'TOGGLE_CRIME_POINTS_VISIBILITY',
      payload: { isVisible: newVisibility }
    });
    setIsLayerVisible(newVisibility);
  };

  return (
    <>
      <style>{`
        .toggle-crime-btn {
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
        .toggle-crime-btn img {
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
        .toggle-crime-btn:not(.active):hover,
        .toggle-crime-btn:not(.active):focus-visible {
          background: #111;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transform: scale(1.08);
        }
        .toggle-crime-btn:not(.active):hover img,
        .toggle-crime-btn:not(.active):focus-visible img {
          filter: invert(1);
          transform: translate(-50%, -50%) scale(1.08);
        }
        /* ACTIVE (visible) */
        .toggle-crime-btn.active {
          background: #111;
          box-shadow: 0 0 0 2px #fff, 0 2px 8px rgba(0,0,0,0.13);
          transform: scale(1.12);
        }
        .toggle-crime-btn.active img {
          filter: invert(1);
          transform: translate(-50%, -50%) scale(1.12);
        }
        /* HOVER while ACTIVE */
        .toggle-crime-btn.active:hover,
        .toggle-crime-btn.active:focus-visible {
          background: #111;
          box-shadow: 0 0 0 3px #fff, 0 4px 12px rgba(0,0,0,0.18);
          transform: scale(1.18);
        }
        .toggle-crime-btn.active:hover img,
        .toggle-crime-btn.active:focus-visible img {
          filter: invert(1);
          transform: translate(-50%, -50%) scale(1.18);
        }
        /* Pressed (click) feedback */
        .toggle-crime-btn:active {
          transform: scale(0.97);
        }
        .toggle-crime-btn:focus {
          outline: none;
        }
      `}</style>
      <button
        className={`toggle-crime-btn${isLayerVisible ? ' active' : ''}`}
        onClick={handleToggleLayer}
        tabIndex={0}
        aria-label={isLayerVisible ? "Hide Crime Points" : "Show Crime Points"}
        title={isLayerVisible ? "Hide Crime Points" : "Show Crime Points"}
        type="button"
      >
        <img src="points_button.svg" alt="" draggable={false} />
      </button>
    </>
  );
};

export default ToggleCrimePointsButton;
