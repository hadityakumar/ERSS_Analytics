import React from 'react';

const MapPanelIconButton = ({
  icon,
  alt,
  title,
  onClick = () => {},
  disabled = false,
  size = 30,
  iconSize = 21,
  style = {},
}) => (
  <>
    <style>{`
      .icon-btn {
        width: ${size}px;
        height: ${size}px;
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
      .icon-btn img {
        width: ${iconSize}px;
        height: ${iconSize}px;
        transition: filter 0.16s, transform 0.16s, opacity 0.2s;
        filter: none;
        pointer-events: none;
        user-select: none;
        display: block;
      }
      .icon-btn:not(:disabled):hover,
      .icon-btn:not(:disabled):focus-visible {
        background: #111;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        transform: scale(1.08);
      }
      .icon-btn:not(:disabled):hover img,
      .icon-btn:not(:disabled):focus-visible img {
        filter: invert(1);
      }
      .icon-btn:active {
        transform: scale(0.97);
      }
      .icon-btn:focus {
        outline: none;
      }
      .icon-btn:disabled {
        background: transparent !important;
        box-shadow: none !important;
        cursor: not-allowed !important;
        opacity: 0.5;
      }
      .icon-btn:disabled img {
        filter: grayscale(1) opacity(0.5) !important;
      }
    `}</style>
    <button
      className="icon-btn"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={alt || title}
      type="button"
      style={style}
    >
      <img src={icon} alt={alt || ''} draggable={false} />
    </button>
  </>
);

export default MapPanelIconButton;
