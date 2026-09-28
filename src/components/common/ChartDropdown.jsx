import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Standardized Reusable Chart-Type Dropdown Component
 * Enforces uniform dimensions (28px height), padding, typography,
 * border styling, and chevron animation across all six operational cards.
 */
export default function ChartDropdown({
  selectedType,
  value,
  onChange,
  types = ['Horizontal Bar', 'Vertical Bar', 'Line', 'Area', 'Pie', 'Donut', 'Radar'],
  options,
  isLight,
  accentColor = '#00C853',
  align = 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const availableTypes = options || types;
  const currentType = selectedType || value || availableTypes[0] || '';

  const cardBorder = isLight === true
    ? '#CBD5E1'
    : 'var(--glass-border, rgba(255, 255, 255, 0.12))';
  const textPrimary = isLight === true
    ? '#0F172A'
    : 'var(--text-main, #0F172A)';
  const textMuted = isLight === true
    ? '#475569'
    : 'var(--text-muted, #64748B)';
  const btnBg = isLight === true
    ? '#FFFFFF'
    : 'var(--glass-bg, rgba(255, 255, 255, 0.06))';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dropdownWidth = availableTypes.some((t) => String(t).length > 8) ? '140px' : '96px';

  return (
    <div
      ref={dropdownRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          height: '28px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 10px',
          backgroundColor: btnBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '7px',
          fontSize: '0.75rem',
          color: textPrimary,
          fontWeight: 600,
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease',
          boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
          whiteSpace: 'nowrap'
        }}
      >
        <span>{currentType}</span>
        <ChevronDown
          size={12}
          style={{
            color: textMuted,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease'
          }}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            [align === 'right' ? 'right' : 'left']: 0,
            width: dropdownWidth,
            backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            boxShadow: isLight
              ? '0 10px 25px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.05)'
              : '0 12px 30px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 60,
            padding: '4px',
            overflow: 'hidden'
          }}
        >
          {availableTypes.map((type) => {
            const isSelected = currentType === type;
            return (
              <button
                key={type}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(type);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 9px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: isSelected
                    ? (isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)')
                    : 'transparent',
                  color: isSelected ? accentColor : textPrimary,
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease'
                }}
              >
                <span>{type}</span>
                {isSelected && <Check size={12} strokeWidth={2.5} color={accentColor} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
