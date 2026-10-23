import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, MapPin, Search, Check } from 'lucide-react';

/**
 * Reusable Site Filter Dropdown Component
 * Provides a standardized, interactive site selector across all operational dashboard sections:
 * - Asset Portfolio & Health
 * - Service Desk & SLA Intelligence
 * - PPM & Soft Services Operations
 * - Workforce Tracking
 */
export default function SiteFilterDropdown({
  selectedSite = 'All Sites',
  onSiteSelect,
  sites = [],
  isLight = false,
  accentColor = '#00C853',
  align = 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Normalize sites list to string names
  const normalizedSites = useMemo(() => {
    const defaultParks = [
      'Farukh Nagar 1',
      'Malur',
      'Bilaspur',
      'Farukh Nagar 2',
      'Koka',
      'Luhari',
      'Verna, Goa',
      'Chakan V',
      'Hosur',
      'Dappar',
      'Bhamboli',
      'Oragadam'
    ];

    const source = (sites && sites.length > 0) ? sites : defaultParks;
    const names = [];

    source.forEach((s) => {
      const name = typeof s === 'string' ? s : (s?.name || s?.siteName || s?.title);
      if (name && name !== 'All Sites' && !names.includes(name)) {
        names.push(name);
      }
    });

    return names;
  }, [sites]);

  // Filtered sites based on inner search query
  const displaySites = useMemo(() => {
    if (!searchQuery.trim()) return normalizedSites;
    const q = searchQuery.toLowerCase().trim();
    return normalizedSites.filter((name) => name.toLowerCase().includes(q));
  }, [normalizedSites, searchQuery]);

  const isSpecificSite = selectedSite && selectedSite !== 'All Sites';

  // Theme-aware color tokens
  const cardBorder = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLight ? '#0F172A' : '#FFFFFF';
  const textMuted = isLight ? '#64748B' : '#94A3B8';
  const btnBg = isLight
    ? (isSpecificSite ? 'rgba(0, 0, 0, 0.03)' : '#FFFFFF')
    : (isSpecificSite ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.03)');

  const handleSelect = (siteName) => {
    if (onSiteSelect) {
      onSiteSelect(siteName);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: btnBg,
          border: isSpecificSite
            ? `1.5px solid ${accentColor}`
            : `1px solid ${cardBorder}`,
          borderRadius: '8px',
          color: isSpecificSite ? (isLight ? '#0F172A' : '#FFFFFF') : textPrimary,
          fontSize: '0.8125rem',
          fontWeight: isSpecificSite ? 700 : 500,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxShadow: isSpecificSite
            ? `0 0 12px ${accentColor}26`
            : (isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none')
        }}
      >
        <MapPin
          size={14}
          color={isSpecificSite ? accentColor : textMuted}
          strokeWidth={isSpecificSite ? 2.5 : 2}
        />
        <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedSite || 'All Sites'}
        </span>
        <ChevronDown
          size={13}
          color={textMuted}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.18s ease'
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'left' ? 'left' : 'right']: 0,
            width: '210px',
            backgroundColor: isLight ? '#FFFFFF' : '#111827',
            border: `1px solid ${isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.12)'}`,
            borderRadius: '10px',
            boxShadow: isLight
              ? '0 10px 25px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)'
              : '0 14px 35px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.4)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Quick Search Input */}
          {normalizedSites.length > 4 && (
            <div
              style={{
                padding: '8px 10px',
                borderBottom: `1px solid ${isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <Search size={13} color={textMuted} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search park site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.75rem',
                  color: textPrimary
                }}
              />
            </div>
          )}

          {/* Site Options List */}
          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px'
            }}
          >
            {/* "All Sites" Global Reset Option */}
            {(!searchQuery || 'all sites'.includes(searchQuery.toLowerCase().trim())) && (
              <button
                type="button"
                onClick={() => handleSelect('All Sites')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: selectedSite === 'All Sites'
                    ? (isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)')
                    : 'transparent',
                  color: selectedSite === 'All Sites' ? accentColor : textPrimary,
                  fontSize: '0.8125rem',
                  fontWeight: selectedSite === 'All Sites' ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.12s ease'
                }}
              >
                <span>All Sites (Nationwide)</span>
                {selectedSite === 'All Sites' && <Check size={14} color={accentColor} />}
              </button>
            )}

            {/* Individual Sites */}
            {displaySites.map((siteName) => {
              const isSelected = selectedSite === siteName;
              return (
                <button
                  key={siteName}
                  type="button"
                  onClick={() => handleSelect(siteName)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isSelected
                      ? (isLight ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)')
                      : 'transparent',
                    color: isSelected ? accentColor : textPrimary,
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'background-color 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {siteName}
                  </span>
                  {isSelected && <Check size={14} color={accentColor} />}
                </button>
              );
            })}

            {displaySites.length === 0 && searchQuery && (
              <div
                style={{
                  padding: '12px 10px',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: textMuted
                }}
              >
                No matching park sites
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
