// KPI Visibility & Data Normalization Engine
// Zero-value dynamic card hiding with search override and local DD-MM-YYYY date utilities

/**
 * Normalizes any raw KPI value into a strict number or null.
 * Handles:
 *   - Numbers: 0, 0.0, 43.8, 100
 *   - Strings: "0", "0.0", "0%", "0 hrs", "0.0h", "100%", "43.8%"
 *   - Missing/invalid: null, undefined, "", NaN -> returns null
 * Ensures "0" is not treated as truthy or confused with missing data.
 */
export function normalizeKpiValue(raw) {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === 'number') {
    return isNaN(raw) ? null : raw;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return null;

    // Check for explicit zero representations before stripping units
    if (trimmed === '0' || trimmed === '0.0' || trimmed === '0%' || trimmed === '0.0%') {
      return 0;
    }

    // Strip unit characters (%, hrs, hr, h, visitors, tickets, assets, etc.)
    const cleaned = trimmed.replace(/[%a-zA-Z\s]/g, '');
    if (cleaned === '') {
      // If stripped to empty, check if it was like "0 hrs"
      if (/^0+(\.0+)?$/.test(trimmed.replace(/[^0-9.]/g, ''))) return 0;
      return null;
    }

    const parsed = Number(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Explicitly determines whether a KPI metric value is exactly zero.
 * Differentiates 0 from null, undefined, missing data, or errors.
 */
export function isKpiValueZero(raw) {
  const norm = normalizeKpiValue(raw);
  if (norm === null) return false; // Missing/null data is NOT zero
  return Math.abs(norm) < 0.000001;
}

/**
 * Matches a search query against KPI metadata (title, id/key, keywords, and submetric labels).
 * Case-insensitive and trimmed.
 */
export function matchesKpiSearch(kpi, query) {
  if (!query || typeof query !== 'string' || !query.trim()) return false;
  const q = query.trim().toLowerCase();

  // Match title
  if (kpi.title && kpi.title.toLowerCase().includes(q)) return true;

  // Match id / key
  if (kpi.id && kpi.id.toLowerCase().includes(q)) return true;
  if (kpi.key && kpi.key.toLowerCase().includes(q)) return true;

  // Match keywords array
  if (Array.isArray(kpi.keywords)) {
    const match = kpi.keywords.some((kw) => {
      if (!kw) return false;
      const k = kw.toLowerCase().trim();
      return k.includes(q) || q.includes(k);
    });
    if (match) return true;
  }

  // Match submetric labels
  if (Array.isArray(kpi.data?.submetrics)) {
    const match = kpi.data.submetrics.some((s) => s.label && s.label.toLowerCase().includes(q));
    if (match) return true;
  }

  return false;
}

/**
 * Reusable KPI visibility calculation:
 * A KPI card is visible if its value is non-zero, OR if the user searched for it.
 *
 * Formula:
 *   visible = (value !== 0) || searchMatchesKpi
 */
export function calculateKpiVisibility(kpi, searchQuery) {
  const val = kpi.data?.value ?? kpi.value;
  const isZero = isKpiValueZero(val);
  const searchMatch = matchesKpiSearch(kpi, searchQuery);

  const isVisible = (!isZero) || searchMatch;

  return {
    ...kpi,
    normalizedValue: normalizeKpiValue(val),
    isZero,
    searchMatch,
    isVisible
  };
}

/**
 * Centralized filter to obtain the list of visible KPI cards
 * based on current filtered data and search query.
 */
export function filterVisibleKpis(kpiList, searchQuery) {
  if (!Array.isArray(kpiList)) return [];
  return kpiList
    .map((kpi) => calculateKpiVisibility(kpi, searchQuery))
    .filter((kpi) => kpi.isVisible);
}

/* =========================================================================
   CUSTOM DATE RANGE UTILITIES (Local DD-MM-YYYY Format)
   ========================================================================= */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Converts ISO YYYY-MM-DD to DD-MM-YYYY
 */
export function isoToDDMMYYYY(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return '';
  const parts = isoStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }
  return isoStr;
}

/**
 * Converts DD-MM-YYYY (or DD/MM/YYYY) to YYYY-MM-DD
 */
export function ddmmToISO(ddmmStr) {
  if (!ddmmStr || typeof ddmmStr !== 'string') return '';
  const trimmed = ddmmStr.trim();
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const parts = trimmed.split(/[-/.]/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }
  return ddmmStr;
}

/**
 * Validates a custom date range.
 * Rules:
 *  - Start Date is required.
 *  - End Date is required.
 *  - Start Date cannot be after End Date.
 * Returns { isValid, error, startISO, endISO }
 */
export function validateDateRange(startDateStr, endDateStr) {
  if (!startDateStr || !startDateStr.trim()) {
    return { isValid: false, error: 'Start date is required.', startISO: null, endISO: null };
  }
  if (!endDateStr || !endDateStr.trim()) {
    return { isValid: false, error: 'End date is required.', startISO: null, endISO: null };
  }

  const startISO = ddmmToISO(startDateStr);
  const endISO = ddmmToISO(endDateStr);

  const start = new Date(startISO);
  const end = new Date(endISO);

  if (isNaN(start.getTime())) {
    return { isValid: false, error: 'Invalid start date format (use DD-MM-YYYY).', startISO: null, endISO: null };
  }
  if (isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid end date format (use DD-MM-YYYY).', startISO: null, endISO: null };
  }

  // Normalize comparison to calendar day
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

  if (startDay > endDay) {
    return { isValid: false, error: 'End date must be on or after start date.', startISO: null, endISO: null };
  }

  return {
    isValid: true,
    error: null,
    startISO,
    endISO
  };
}

/**
 * Formats a custom date range for the compact header button display:
 * Example: "01 Sep 2026 – 10 Sep 2026"
 */
export function formatCustomRangeDisplay(startDateStr, endDateStr) {
  const startISO = ddmmToISO(startDateStr);
  const endISO = ddmmToISO(endDateStr);

  const start = new Date(startISO);
  const end = new Date(endISO);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Custom Range';
  }

  const pad = (n) => String(n).padStart(2, '0');
  const startFormatted = `${pad(start.getDate())} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
  const endFormatted = `${pad(end.getDate())} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;

  return `${startFormatted} – ${endFormatted}`;
}
