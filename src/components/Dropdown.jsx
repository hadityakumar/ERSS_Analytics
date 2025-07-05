import React, { useState, useRef, useEffect, useId } from 'react';

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
  clearButtonTitle = "Clear selection",
  multiSelect = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef();
  const buttonRef = useRef();
  const uniqueId = useId();

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = Math.min(210, options.length * 40);
      
      const spaceBelow = viewportHeight - buttonRect.bottom - 10;
      const spaceAbove = buttonRect.top - 10;
      
      let top, maxHeight;
      if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
        top = buttonRect.bottom + 2;
        maxHeight = Math.min(210, spaceBelow);
      } else {
        top = buttonRect.top - Math.min(210, spaceAbove);
        maxHeight = Math.min(210, spaceAbove);
      }

      setDropdownPosition({
        top,
        left: buttonRect.left,
        width: buttonRect.width,
        maxHeight
      });
    }
  }, [isOpen, options.length]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        const dropdownList = document.querySelector(`.dropdown-list-${uniqueId.replace(/:/g, '')}`);
        if (!dropdownList || !dropdownList.contains(e.target)) {
          setIsOpen(false);
        }
      }
    };
    
    // Use a slight delay to prevent immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, uniqueId]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  };

  const handleOptionClick = (optionValue) => {
    // Handle the selection first
    onSelect(optionValue);
    
    // For single-select, close the dropdown after selection
    // For multi-select, keep it open
    if (!multiSelect) {
      setTimeout(() => {
        setIsOpen(false);
      }, 50);
    }
  };

  // Detect if this is a multi-select based on selected being an array with multiple items
  const isMultiSelect = multiSelect || (Array.isArray(selected) && selected.length >= 0);

  // Create unique class names for this dropdown instance
  const rootClass = `dropdown-root-${uniqueId.replace(/:/g, '')}`;
  const btnClass = `dropdown-btn-${uniqueId.replace(/:/g, '')}`;
  const arrowClass = `dropdown-arrow-${uniqueId.replace(/:/g, '')}`;
  const clearClass = `dropdown-clear-${uniqueId.replace(/:/g, '')}`;
  const listClass = `dropdown-list-${uniqueId.replace(/:/g, '')}`;
  const optionClass = `dropdown-option-${uniqueId.replace(/:/g, '')}`;
  const checkClass = `dropdown-check-${uniqueId.replace(/:/g, '')}`;

  return (
    <>
      <style>{`
        .${rootClass} {
          width: ${width};
          position: relative;
          font-size: 10px;
          display: flex;
          align-items: stretch;
        }
        .${btnClass} {
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
        .${btnClass}:focus {
          border: 2.5px solid #111;
        }
        .${arrowClass} {
          position: absolute;
          right: 10px;
          top: 50%;
          width: 16px;
          height: 16px;
          transform: translateY(-50%) ${isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
          transition: transform 0.3s ease-in-out;
          pointer-events: none;
        }
        .${clearClass} {
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
          font-size: 10px;
          opacity: 0.85;
          transition: background 0.15s;
          box-shadow: none;
          padding: 0;
        }
        .${clearClass} img {
          width: 16px;
          height: 16px;
          display: block;
          transition: filter 0.18s;
          filter: brightness(0.7);
        }
        .${clearClass}:hover img,
        .${clearClass}:active img,
        .${clearClass}:focus-visible img {
          filter: brightness(0.15);
        }
        .${listClass} {
          position: fixed;
          background: #fff;
          border: 2px solid #000;
          border-radius: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          z-index: 9999;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #888 #f1f1f1;
        }
        .${listClass}::-webkit-scrollbar {
          width: 6px;
        }
        .${listClass}::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .${listClass}::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        .${listClass}::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .${optionClass} {
          padding: 8px 10px;
          cursor: pointer;
          color: #111;
          background: #fff;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          transition: background 0.13s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          user-select: none;
        }
        .${optionClass}:last-child {
          border-bottom: none;
        }
        .${optionClass}.selected,
        .${optionClass}:hover {
          background: #111;
          color: #fff;
        }
        .${checkClass} {
          margin-left: 7px;
          color: #fff;
          font-weight: bold;
          flex-shrink: 0;
        }
      `}</style>
      <div className={rootClass} style={style} ref={dropdownRef}>
        <div style={{ flex: 1, position: 'relative' }}>
          <button
            ref={buttonRef}
            className={btnClass}
            style={buttonStyle}
            type="button"
            disabled={disabled}
            onClick={handleToggle}
          >
            {renderSelected ? renderSelected(selected) : (selected?.length ? selected.join(', ') : placeholder)}
            <img
              src="dropdown.svg"
              alt=""
              className={arrowClass}
              style={{
                filter: "invert(0)",
              }}
            />
          </button>
        </div>
        {clearable && (
          <button
            className={clearClass}
            type="button"
            onClick={onClear}
            title={clearButtonTitle}
            tabIndex={0}
          >
            <img src="cross_button.svg" alt="Clear" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={listClass}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: `${dropdownPosition.maxHeight}px`,
            ...dropdownStyle
          }}
        >
          {options.map((option, idx) => (
            <div
              key={option.value || option}
              className={
                `${optionClass}` +
                (selected && (selected.includes(option.value || option) ? " selected" : ""))
              }
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent the mousedown from triggering outside click
                handleOptionClick(option.value || option);
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {renderOption ? renderOption(option) : (option.label || option)}
              </span>
              {selected && selected.includes(option.value || option) && (
                <span className={checkClass}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Dropdown;
