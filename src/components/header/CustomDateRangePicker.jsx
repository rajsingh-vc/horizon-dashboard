import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ArrowRight, AlertCircle, X, Check } from 'lucide-react';
import { 
  isoToDDMMYYYY, 
  ddmmToISO, 
  validateDateRange, 
  formatCustomRangeDisplay 
} from '../../utils/kpiVisibility';

/**
 * Custom Date Range Selector matching reference screenshot:
 * [ dd-mm-yyyy 📅 ]  to  [ dd-mm-yyyy 📅 ]
 * 
 * Supports:
 * - Native date picker integration via showPicker()
 * - DD-MM-YYYY direct editing and display
 * - Full boundary validation ("End date must be on or after start date.")
 * - Cancel and Apply callbacks
 */
export default function CustomDateRangePicker({
  initialStartDate = '',
  initialEndDate = '',
  onApply,
  onCancel,
  onBackToPresets,
  theme = 'dark'
}) {
  const isLight = theme === 'light';

  // Format initial values to DD-MM-YYYY if given in ISO
  const [startDate, setStartDate] = useState(() => {
    if (!initialStartDate) return '';
    return initialStartDate.includes('-') && initialStartDate.split('-')[0].length === 4
      ? isoToDDMMYYYY(initialStartDate)
      : initialStartDate;
  });

  const [endDate, setEndDate] = useState(() => {
    if (!initialEndDate) return '';
    return initialEndDate.includes('-') && initialEndDate.split('-')[0].length === 4
      ? isoToDDMMYYYY(initialEndDate)
      : initialEndDate;
  });

  const [validationError, setValidationError] = useState(null);

  const startNativeInputRef = useRef(null);
  const endNativeInputRef = useRef(null);

  // Sync if initial props change
  useEffect(() => {
    if (initialStartDate) {
      setStartDate(
        initialStartDate.includes('-') && initialStartDate.split('-')[0].length === 4
          ? isoToDDMMYYYY(initialStartDate)
          : initialStartDate
      );
    }
    if (initialEndDate) {
      setEndDate(
        initialEndDate.includes('-') && initialEndDate.split('-')[0].length === 4
          ? isoToDDMMYYYY(initialEndDate)
          : initialEndDate
      );
    }
  }, [initialStartDate, initialEndDate]);

  // Open native calendar picker for Start Date
  const handleOpenStartPicker = () => {
    if (startNativeInputRef.current) {
      try {
        if (typeof startNativeInputRef.current.showPicker === 'function') {
          startNativeInputRef.current.showPicker();
        } else {
          startNativeInputRef.current.focus();
        }
      } catch {
        startNativeInputRef.current.focus();
      }
    }
  };

  // Open native calendar picker for End Date
  const handleOpenEndPicker = () => {
    if (endNativeInputRef.current) {
      try {
        if (typeof endNativeInputRef.current.showPicker === 'function') {
          endNativeInputRef.current.showPicker();
        } else {
          endNativeInputRef.current.focus();
        }
      } catch {
        endNativeInputRef.current.focus();
      }
    }
  };

  // Handle native date selection from picker
  const handleNativeStartChange = (e) => {
    const isoVal = e.target.value; // YYYY-MM-DD
    if (isoVal) {
      setStartDate(isoToDDMMYYYY(isoVal));
      setValidationError(null);
    }
  };

  const handleNativeEndChange = (e) => {
    const isoVal = e.target.value; // YYYY-MM-DD
    if (isoVal) {
      setEndDate(isoToDDMMYYYY(isoVal));
      setValidationError(null);
    }
  };

  // Handle manual typing in input
  const handleStartTextChange = (e) => {
    setStartDate(e.target.value);
    setValidationError(null);
  };

  const handleEndTextChange = (e) => {
    setEndDate(e.target.value);
    setValidationError(null);
  };

  // Submit and validate custom range
  const handleApply = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    const validation = validateDateRange(startDate, endDate);
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    setValidationError(null);
    const label = formatCustomRangeDisplay(startDate, endDate);

    if (onApply) {
      onApply({
        startDate: validation.startISO,
        endDate: validation.endISO,
        displayStartDate: startDate,
        displayEndDate: endDate,
        label
      });
    }
  };

  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: isLight ? '#FFFFFF' : '#1A2333',
    border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.16)',
    borderRadius: '8px',
    padding: '0 8px',
    height: '38px',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    width: '140px',
    boxShadow: isLight ? '0 1px 2px rgba(15, 23, 42, 0.05)' : 'none'
  };

  const textInputStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: isLight ? '#0F172A' : '#F8FAFC',
    letterSpacing: '0.02em',
    padding: '0'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: isLight ? '#64748B' : '#94A3B8',
    marginBottom: '4px'
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        padding: '14px 16px',
        width: '340px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarIcon size={14} color="#00C853" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isLight ? '#0F172A' : '#FFFFFF' }}>
            Custom Date Range
          </span>
        </div>
        {onBackToPresets && (
          <button
            type="button"
            onClick={onBackToPresets}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: isLight ? '#0284C7' : '#38BDF8',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Presets
          </button>
        )}
      </div>

      {/* Date Pickers Row matching screenshot: [ dd-mm-yyyy 📅 ] to [ dd-mm-yyyy 📅 ] */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
        {/* Start Date */}
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Start Date</label>
          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="dd-mm-yyyy"
              value={startDate}
              onChange={handleStartTextChange}
              onKeyDown={(e) => e.key === 'Enter' && handleApply(e)}
              style={textInputStyle}
            />
            <button
              type="button"
              onClick={handleOpenStartPicker}
              title="Select Start Date"
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: isLight ? '#64748B' : '#94A3B8'
              }}
            >
              <CalendarIcon size={15} />
            </button>
            {/* Hidden native input for standard calendar picker popover */}
            <input
              ref={startNativeInputRef}
              type="date"
              tabIndex={-1}
              value={ddmmToISO(startDate) || ''}
              onChange={handleNativeStartChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 0,
                height: 0,
                opacity: 0,
                pointerEvents: 'none',
                border: 'none'
              }}
            />
          </div>
        </div>

        {/* "to" separator matching screenshot */}
        <div
          style={{
            paddingBottom: '9px',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: isLight ? '#64748B' : '#94A3B8',
            userSelect: 'none'
          }}
        >
          to
        </div>

        {/* End Date */}
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>End Date</label>
          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="dd-mm-yyyy"
              value={endDate}
              onChange={handleEndTextChange}
              onKeyDown={(e) => e.key === 'Enter' && handleApply(e)}
              style={textInputStyle}
            />
            <button
              type="button"
              onClick={handleOpenEndPicker}
              title="Select End Date"
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: isLight ? '#64748B' : '#94A3B8'
              }}
            >
              <CalendarIcon size={15} />
            </button>
            {/* Hidden native input for standard calendar picker popover */}
            <input
              ref={endNativeInputRef}
              type="date"
              tabIndex={-1}
              value={ddmmToISO(endDate) || ''}
              onChange={handleNativeEndChange}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 0,
                height: 0,
                opacity: 0,
                pointerEvents: 'none',
                border: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: isLight ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
            border: isLight ? '1px solid #FCA5A5' : '1px solid rgba(239, 68, 68, 0.3)',
            color: isLight ? '#B91C1C' : '#F87171',
            fontSize: '0.75rem',
            fontWeight: 600,
            animation: 'fadeInUp 0.15s ease'
          }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Action Buttons: Cancel & Apply */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel && onCancel();
          }}
          style={{
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            borderRadius: '6px',
            border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.05)',
            color: isLight ? '#475569' : '#CBD5E1',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleApply}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: 700,
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#00C853',
            color: '#0B0F19',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0, 200, 83, 0.3)',
            transition: 'opacity 0.15s ease, transform 0.1s ease'
          }}
        >
          <Check size={13} strokeWidth={2.5} />
          <span>Apply Range</span>
        </button>
      </div>
    </div>
  );
}
