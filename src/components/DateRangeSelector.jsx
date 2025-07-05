import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const DATE_FIELD_NAME = 'signal_lan';

export default function DateRangeSelector({ onDateRangeChange }) {
  const dispatch = useDispatch();
  const { startDate, endDate } = useSelector(s => s.csvProcessing);

  const [fromDate, setFromDate] = useState(startDate ? startDate.split(' ')[0] : '');
  const [fromTime, setFromTime] = useState(startDate ? startDate.split(' ')[1] || '00:00' : '00:00');
  const [toDate, setToDate] = useState(endDate ? endDate.split(' ')[0] : '');
  const [toTime, setToTime] = useState(endDate ? endDate.split(' ')[1] || '23:59' : '23:59');

  useEffect(() => {
    const dateRange = {
      fromDate,
      fromTime,
      toDate,
      toTime,
      hasDateRange: fromDate && toDate
    };
    onDateRangeChange?.(dateRange);
  }, [fromDate, fromTime, toDate, toTime, onDateRangeChange]);

  const clearFromDate = useCallback(() => setFromDate(''), []);
  const clearFromTime = useCallback(() => setFromTime('00:00'), []);
  const clearToDate = useCallback(() => setToDate(''), []);
  const clearToTime = useCallback(() => setToTime('23:59'), []);

  return (
    <>
      <style>{`
        .drs-label {
          font-size: 10px;
          color: black;
          font-weight: 600;
          margin-bottom: 2px;
          letter-spacing: 0.01em;
          text-align: left;
          margin-left: 5px;
        }
        .drs-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
          margin-bottom: 0px;
        }
        .drs-row {
          display: flex;
          align-items: center;
          gap: 2px;
          width: 100%;
          justify-content: flex-end;
        }
        .drs-input-wrap {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          position: relative;
        }
        .drs-input {
          font-size: 12px;
          padding: 7px 10px 7px 8px;
          border: 2px solid #000;
          border-radius: 0;
          background: transparent;
          color: #111;
          outline: none;
          transition: border 0.16s;
          appearance: none;
          text-align: right;
        }
        .drs-input:focus {
          border: 2.5px solid #111;
        }
        .drs-input.date {
          width: 120px;
          min-width: 82px;
          max-width: 140px;
        }
        .drs-input.time {
          width: 83px;
          min-width: 60px;
          max-width: 90px;
        }
        .drs-clear-btn {
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
        .drs-clear-btn img {
          width: 16px;
          height: 16px;
          display: block;
          transition: filter 0.18s;
          filter: brightness(0.7);
        }
        .drs-clear-btn:hover img,
        .drs-clear-btn:active img,
        .drs-clear-btn:focus-visible img {
          filter: brightness(0.15);
        }
        
        
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
        {/* From */}
        <div className="drs-group">
          <div className="drs-label">From</div>
          <div className="drs-row">
            <div className="drs-input-wrap">
              <input
                className="drs-input date"
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                autoComplete="off"
              />
              <button
                className="drs-clear-btn"
                onClick={clearFromDate}
                tabIndex={0}
                aria-label="Clear from date"
                type="button"
                title="Clear from date"
                style={{ opacity: fromDate ? 1 : 0.5 }}
              >
                <img src="cross_button.svg" alt="Clear" />
              </button>
            </div>
          </div>
          <div className="drs-row">
            <div className="drs-input-wrap">
              <input
                className="drs-input time"
                type="time"
                value={fromTime}
                onChange={e => setFromTime(e.target.value)}
                autoComplete="off"
              />
              <button
                className="drs-clear-btn"
                onClick={clearFromTime}
                tabIndex={0}
                aria-label="Clear from time"
                type="button"
                title="Clear from time"
                style={{ opacity: fromTime && fromTime !== '00:00' ? 1 : 0.5 }}
              >
                <img src="cross_button.svg" alt="Clear" />
              </button>
            </div>
          </div>
        </div>
        {/* To */}
        <div className="drs-group">
          <div className="drs-label">To</div>
          <div className="drs-row">
            <div className="drs-input-wrap">
              <input
                className="drs-input date"
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                autoComplete="off"
              />
              <button
                className="drs-clear-btn"
                onClick={clearToDate}
                tabIndex={0}
                aria-label="Clear to date"
                type="button"
                title="Clear to date"
                style={{ opacity: toDate ? 1 : 0.5 }}
              >
                <img src="cross_button.svg" alt="Clear" />
              </button>
            </div>
          </div>
          <div className="drs-row">
            <div className="drs-input-wrap">
              <input
                className="drs-input time"
                type="time"
                value={toTime}
                onChange={e => setToTime(e.target.value)}
                autoComplete="off"
              />
              <button
                className="drs-clear-btn"
                onClick={clearToTime}
                tabIndex={0}
                aria-label="Clear to time"
                type="button"
                title="Clear to time"
                style={{ opacity: toTime && toTime !== '23:59' ? 1 : 0.5 }}
              >
                <img src="cross_button.svg" alt="Clear" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
