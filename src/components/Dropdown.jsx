import React, { useState, useRef, useEffect } from 'react';

const Dropdown = ({
  options = [],
  selected,
  onSelect,
  placeholder = "Select...",
  clearable = false,
  onClear,
  width = "100%",
  renderOption,
  renderSelected,
  disabled = false,
  style = {},
  dropdownStyle = {},
  buttonStyle = {},
  clearButtonTitle = "Clear selection"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <>
      <style>{`
        .dropdown-root {
          width: ${width};
          position: relative;
          font-size: 10px;
          display: flex;
          align-items: stretch;
        }
        .dropdown-btn {
          background: #fff;
          border: 2px solid #000;
          border-radius: 0;
          padding: 7px 38px 7px 10px;
          width: 100%;
          text-align: left;
          cursor: ${disabled ? "not-allowed" : "pointer"};
          color: #111;
          font-size: 10px;
          outline: none;
          transition: border 0.15s;
          min-height: 32px;
          position: relative;
        }
        .dropdown-btn:focus {
          border: 2.5px solid #111;
        }
        .dropdown-arrow-img {
          position: absolute;
          right: 10px;
          top: 50%;
          width: 16px;
          height: 16px;
          transform: translateY(-50%) rotate(${isOpen ? "180deg" : "0deg"});
          transition: transform 0.18s;
          pointer-events: none;
        }
        .dropdown-clear {
          margin-left: 8px;
          background: transparent;
          color: #222;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          opacity: 0.85;
          transition: background 0.15s;
          box-shadow: none;
          padding: 0;
        }
        .dropdown-clear img {
          width: 16px;
          height: 16px;
          display: block;
          transition: filter 0.18s;
          filter: brightness(0.7);
        }
        .dropdown-clear:hover img,
        .dropdown-clear:active img,
        .dropdown-clear:focus-visible img {
          filter: brightness(0.15);
        }
        .dropdown-list {
          position: absolute;
          left: 0;
          right: 0;
          top: 110%;
          background: #fff;
          border: 2px solid #000;
          border-radius: 0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          z-index: 1002;
          max-height: 210px;
          overflow-y: auto;
          margin-top: 2px;
        }
        .dropdown-option {
          padding: 8px 10px;
          cursor: pointer;
          color: #111;
          background: #fff;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          transition: background 0.13s;
        }
        .dropdown-option:last-child {
          border-bottom: none;
        }
        .dropdown-option.selected,
        .dropdown-option:hover {
          background: #111;
          color: #fff;
        }
        .dropdown-check {
          margin-left: 7px;
          color: #fff;
          font-weight: bold;
        }
      `}</style>
      <div className="dropdown-root" style={style} ref={dropdownRef}>
        <div style={{ flex: 1, position: 'relative' }}>
          <button
            className="dropdown-btn"
            style={buttonStyle}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen((v) => !v)}
          >
            {renderSelected ? renderSelected(selected) : (selected?.length ? selected.join(', ') : placeholder)}
            <img
              src="dropdown.svg"
              alt=""
              className="dropdown-arrow-img"
              style={{
                filter: "invert(0)",
              }}
            />
          </button>
          {isOpen && (
            <div className="dropdown-list" style={dropdownStyle}>
              {options.map((option, idx) => (
                <div
                  key={option.value || option}
                  className={
                    "dropdown-option" +
                    (selected && (selected.includes(option.value || option) ? " selected" : ""))
                  }
                  onClick={() => {
                    onSelect(option.value || option);
                  }}
                >
                  {renderOption ? renderOption(option) : (option.label || option)}
                  {selected && selected.includes(option.value || option) && (
                    <span className="dropdown-check">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {clearable && (
          <button
            className="dropdown-clear"
            type="button"
            onClick={onClear}
            title={clearButtonTitle}
            tabIndex={0}
          >
            <img src="cross_button.svg" alt="Clear" />
          </button>
        )}
      </div>
    </>
  );
};

export default Dropdown;
