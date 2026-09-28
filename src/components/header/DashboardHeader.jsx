import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Layers, 
  MapPin, 
  Grid, 
  Truck, 
  RefreshCw, 
  ChevronDown, 
  Check,
  Sun,
  Moon
} from 'lucide-react';
import HorizonLogo from '../common/HorizonLogo';
import CustomDateRangePicker from './CustomDateRangePicker';
import { GROUPS_DATA, CATEGORIES_DATA, VENDORS_DATA, SITES_DATA } from '../../data/mockData';

const DATE_OPTIONS = [
  'Today',
  'This Week',
  'This Month',
  'Last Month',
  'This Quarter',
  'This Year',
  'Custom Range'
];

function DropdownRow({ label, isSelected, onClick, isLight }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '7px 10px',
        fontSize: '0.8125rem',
        fontWeight: isSelected ? 600 : 400,
        borderRadius: '6px',
        border: 'none',
        backgroundColor: isSelected
          ? (isLight ? '#EBF3FC' : 'rgba(56, 189, 248, 0.15)')
          : isHovered
            ? (isLight ? '#F8FAFC' : 'rgba(255, 255, 255, 0.05)')
            : 'transparent',
        color: isSelected
          ? (isLight ? '#0F172A' : '#38BDF8')
          : (isLight ? '#334155' : '#E2E8F0'),
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.12s ease',
        userSelect: 'none'
      }}
    >
      <span
        style={{
          width: '14px',
          height: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {isSelected ? (
          <Check size={14} strokeWidth={2.5} color={isLight ? '#1E293B' : '#38BDF8'} />
        ) : null}
      </span>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
    </button>
  );
}

export default function DashboardHeader({
  selectedDate = 'This Month',
  activeCustomRange = null,
  onDateChange,
  selectedGroup = 'All Groups',
  onGroupChange,
  selectedSite = 'All Sites',
  onSiteChange,
  selectedCategory = 'All Categories',
  onCategoryChange,
  selectedVendor = 'All Vendors',
  onVendorChange,
  groups = GROUPS_DATA,
  categories = CATEGORIES_DATA,
  vendors = VENDORS_DATA,
  sites = SITES_DATA,
  lastUpdated,
  isRefreshing,
  onRefresh,
  theme = 'dark',
  onToggleTheme
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCustomRangeMode, setIsCustomRangeMode] = useState(false);
  const headerRef = useRef(null);
  const isLight = theme === 'light';

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setIsCustomRangeMode(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setIsCustomRangeMode(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDropdown = (key) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const isFilterActive = (val, defaultVal) => Boolean(val && val !== defaultVal);

  // Filter available sites based on selectedGroup
  const availableSites = useMemo(() => {
    if (!selectedGroup || selectedGroup === 'All Groups') return sites;
    return sites.filter((s) => (s.group || s.region || '').toLowerCase() === selectedGroup.toLowerCase());
  }, [sites, selectedGroup]);

  const pillBtnStyle = (isActive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    height: '36px',
    padding: '0 12px',
    fontSize: '0.8125rem',
    fontWeight: isActive ? 600 : 500,
    borderRadius: '8px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    border: isActive
      ? (isLight ? '1px solid #0284C7' : '1px solid #38BDF8')
      : (isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.12)'),
    backgroundColor: isActive
      ? (isLight ? '#F0F9FF' : 'rgba(56, 189, 248, 0.12)')
      : (isLight ? '#FFFFFF' : 'rgba(23, 31, 48, 0.8)'),
    color: isActive
      ? (isLight ? '#0369A1' : '#38BDF8')
      : (isLight ? '#1E293B' : '#F8FAFC'),
    cursor: 'pointer',
    boxShadow: isLight ? '0 1px 2px rgba(15, 23, 42, 0.05)' : '0 2px 6px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.15s ease'
  });

  const dropdownPanelStyle = (minWidth = '160px', alignRight = false) => ({
    position: 'absolute',
    top: 'calc(100% + 6px)',
    [alignRight ? 'right' : 'left']: 0,
    zIndex: 1000,
    minWidth,
    maxHeight: '360px',
    overflowY: 'auto',
    backgroundColor: isLight ? '#FFFFFF' : '#151D2C',
    borderRadius: '8px',
    boxShadow: isLight 
      ? '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)' 
      : '0 16px 40px rgba(0, 0, 0, 0.7)',
    border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255, 255, 255, 0.12)',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  });

  return (
    <header
      ref={headerRef}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(11, 15, 23, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: isLight ? '1px solid rgba(226, 232, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isLight ? '0 4px 20px -2px rgba(15, 23, 42, 0.05)' : '0 8px 30px -4px rgba(0, 0, 0, 0.6)',
        padding: '10px 24px',
        transition: 'all 0.25s ease'
      }}
    >
      <div
        style={{
          maxWidth: '1680px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'nowrap'
        }}
      >
        {/* Left: Authentic Horizon Brand Logo Area */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <HorizonLogo size={42} showText={true} theme={theme} />
        </div>

        {/* Center: Global Dashboard Filter Bar - 5 Central Filters matching reference UX */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'nowrap',
            padding: '2px 8px',
            overflow: 'visible',
            position: 'relative'
          }}
        >
          {/* 1. Date / Period Filter */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('date');
              }}
              className="filter-pill-btn"
              style={pillBtnStyle(isFilterActive(selectedDate, 'This Month'))}
            >
              <Calendar 
                size={14} 
                color={isFilterActive(selectedDate, 'This Month') ? (isLight ? '#0284C7' : '#38BDF8') : (isLight ? '#64748B' : '#94A3B8')} 
              />
              <span>{selectedDate}</span>
              <ChevronDown size={14} color={isLight ? '#64748B' : '#94A3B8'} />
            </button>

            {openDropdown === 'date' && (
              <div className="dropdown-anim" style={dropdownPanelStyle(isCustomRangeMode ? '360px' : '160px')}>
                {isCustomRangeMode ? (
                  <CustomDateRangePicker
                    initialStartDate={activeCustomRange?.startDate || ''}
                    initialEndDate={activeCustomRange?.endDate || ''}
                    theme={theme}
                    onApply={(rangeData) => {
                      onDateChange && onDateChange('Custom Range', rangeData);
                      setOpenDropdown(null);
                      setIsCustomRangeMode(false);
                    }}
                    onCancel={() => {
                      setOpenDropdown(null);
                      setIsCustomRangeMode(false);
                    }}
                    onBackToPresets={() => setIsCustomRangeMode(false)}
                  />
                ) : (
                  DATE_OPTIONS.map((opt) => {
                    const isCustomOption = opt === 'Custom Range';
                    const isSelected = isCustomOption
                      ? Boolean(activeCustomRange || selectedDate === 'Custom Range' || (typeof selectedDate === 'string' && selectedDate.includes('–')))
                      : selectedDate === opt;

                    return (
                      <DropdownRow
                        key={opt}
                        label={opt}
                        isSelected={isSelected}
                        isLight={isLight}
                        onClick={() => {
                          if (isCustomOption) {
                            setIsCustomRangeMode(true);
                          } else {
                            onDateChange && onDateChange(opt, null);
                            setOpenDropdown(null);
                            setIsCustomRangeMode(false);
                          }
                        }}
                      />
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 2. Group Filter */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('group');
              }}
              className="filter-pill-btn"
              style={pillBtnStyle(isFilterActive(selectedGroup, 'All Groups'))}
            >
              <span>{selectedGroup}</span>
              <ChevronDown size={14} color={isLight ? '#64748B' : '#94A3B8'} />
            </button>

            {openDropdown === 'group' && (
              <div className="dropdown-anim" style={dropdownPanelStyle('150px')}>
                {groups.map((grp) => (
                  <DropdownRow
                    key={grp}
                    label={grp}
                    isSelected={selectedGroup === grp}
                    isLight={isLight}
                    onClick={() => {
                      onGroupChange && onGroupChange(grp);
                      setOpenDropdown(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 3. Site Filter */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('site');
              }}
              className="filter-pill-btn"
              style={pillBtnStyle(isFilterActive(selectedSite, 'All Sites'))}
            >
              <span>{selectedSite}</span>
              <ChevronDown size={14} color={isLight ? '#64748B' : '#94A3B8'} />
            </button>

            {openDropdown === 'site' && (
              <div className="dropdown-anim" style={dropdownPanelStyle('230px')}>
                <DropdownRow
                  key="All Sites"
                  label="All Sites"
                  isSelected={selectedSite === 'All Sites'}
                  isLight={isLight}
                  onClick={() => {
                    onSiteChange && onSiteChange('All Sites');
                    setOpenDropdown(null);
                  }}
                />
                {availableSites.map((site) => (
                  <DropdownRow
                    key={site.id || site.name}
                    label={site.name}
                    isSelected={selectedSite === site.name}
                    isLight={isLight}
                    onClick={() => {
                      onSiteChange && onSiteChange(site.name);
                      setOpenDropdown(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 4. Category Filter */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('category');
              }}
              className="filter-pill-btn"
              style={pillBtnStyle(isFilterActive(selectedCategory, 'All Categories'))}
            >
              <span>{selectedCategory}</span>
              <ChevronDown size={14} color={isLight ? '#64748B' : '#94A3B8'} />
            </button>

            {openDropdown === 'category' && (
              <div className="dropdown-anim" style={dropdownPanelStyle('190px')}>
                {categories.map((cat) => (
                  <DropdownRow
                    key={cat}
                    label={cat}
                    isSelected={selectedCategory === cat}
                    isLight={isLight}
                    onClick={() => {
                      onCategoryChange && onCategoryChange(cat);
                      setOpenDropdown(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 5. Vendor Filter */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown('vendor');
              }}
              className="filter-pill-btn"
              style={pillBtnStyle(isFilterActive(selectedVendor, 'All Vendors'))}
            >
              <span>{selectedVendor}</span>
              <ChevronDown size={14} color={isLight ? '#64748B' : '#94A3B8'} />
            </button>

            {openDropdown === 'vendor' && (
              <div className="dropdown-anim" style={dropdownPanelStyle('160px', true)}>
                {vendors.map((ven) => (
                  <DropdownRow
                    key={ven}
                    label={ven}
                    isSelected={selectedVendor === ven}
                    isLight={isLight}
                    onClick={() => {
                      onVendorChange && onVendorChange(ven);
                      setOpenDropdown(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Theme Toggle (Sun/Moon icon only), Clock & Sync (icon only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="filter-pill-btn"
            title={isLight ? 'Switch to Dark Mode (currently Light)' : 'Switch to Light Mode (currently Dark)'}
            aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(255, 255, 255, 0.14)',
              backgroundColor: isLight ? '#FFFFFF' : 'rgba(23, 31, 48, 0.85)',
              cursor: 'pointer',
              boxShadow: isLight ? '0 1px 3px rgba(15, 23, 42, 0.05)' : '0 2px 6px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {isLight ? (
              <Sun size={17} color="#F59E0B" />
            ) : (
              <Moon size={17} color="#818CF8" />
            )}
          </button>

          <div style={{ width: '1px', height: '20px', backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)' }} />

          {/* Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span className="pulse-dot" style={{ backgroundColor: isLight ? '#047857' : '#00E676' }} />
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: isLight ? '#0F172A' : '#F8FAFC',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap'
              }}
            >
              {lastUpdated}
            </span>
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)' }} />

          {/* Sync Button (Icon only) */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="filter-pill-btn"
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: isLight ? '1px solid rgba(0, 200, 83, 0.4)' : '1px solid rgba(0, 200, 83, 0.4)',
              backgroundColor: isRefreshing 
                ? (isLight ? '#F1F5F9' : 'rgba(23, 31, 48, 0.9)') 
                : (isLight ? 'rgba(0, 200, 83, 0.08)' : 'rgba(0, 200, 83, 0.12)'),
              cursor: isRefreshing ? 'default' : 'pointer',
              boxShadow: isLight ? '0 1px 4px rgba(0, 200, 83, 0.15)' : '0 2px 8px rgba(0, 200, 83, 0.2)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            aria-label="Refresh telemetry data"
            title="Click to refresh operational telemetry"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-anim' : ''} color={isLight ? '#047857' : '#00E676'} />
          </button>
        </div>
      </div>
    </header>
  );
}
