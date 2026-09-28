/**
 * Centralized Analytics Formatting & Title Casing Utilities
 * Enforces unified naming conventions, percentage formatting, number formatting,
 * and technical acronym preservation across ALL 6 Operational Intelligence modules.
 */

// Recognized technical business acronyms that MUST always remain uppercase
const PRESERVED_ACRONYMS = new Set([
  'PPM',
  'SLA',
  'AMC',
  'TAT',
  'CCTV',
  'HVAC',
  'DG',
  'AMF',
  'LT',
  'HT',
  'STP',
  'APFC',
  'NVR',
  'UPS',
  'ACB',
  'VCB',
  'DB',
  'IT',
  'LED',
  'OEM',
  'C&W',
  'KVA',
  'KWH',
  'WTP',
  'RO',
  'BMS'
]);

// Common technical category label dictionary for precise enterprise terminology
const KNOWN_LABEL_MAP = {
  'MONTHLY CHECKLIST - DG': 'Monthly Checklist – DG',
  'MONTHLY CHECKLIST - DG AMF PANEL': 'Monthly Checklist – DG AMF Panel',
  'MONTHLY CHECKLIST - TRANSFORMER': 'Monthly Checklist – Transformer',
  'MONTHLY CHECKLIST - TRAN...': 'Monthly Checklist – Transformer',
  'MONTHLY CHECKLIST - TRANS': 'Monthly Checklist – Transformer',
  'MONTHLY CHECKLIST - DG A...': 'Monthly Checklist – DG AMF Panel',
  'MONTHLY CHECKLIST - PUMPS': 'Monthly Checklist – Pumps',
  'MONTHLY CHECKLIST - PANEL': 'Monthly Checklist – Panel',
  'MONTHLY CHECKLIST - PUMPS #1 (BOOSTER)': 'Monthly Checklist – Pumps (Booster)',
  'MONTHLY CHECKLIST - PUMPS #2 (FIRE HYDRANT)': 'Monthly Checklist – Pumps (Fire Hydrant)',
  'MONTHLY CHECKLIST - PUMPS #3 (HYDRO-PNEUMATIC)': 'Monthly Checklist – Pumps (Hydro-Pneumatic)',
  'MONTHLY CHECKLIST - PUMPS #4 (STP BLOWER)': 'Monthly Checklist – Pumps (STP Blower)',
  'MONTHLY CHECKLIST - PUMPS #5 (SUBMERSIBLE SUMP)': 'Monthly Checklist – Pumps (Submersible Sump)',
  'MONTHLY CHECKLIST - PUMPS #6 (RAINWATER TRANSFER)': 'Monthly Checklist – Pumps (Rainwater Transfer)'
};

/**
 * Formats a category or chart label into clean Title Case while:
 * 1. Replacing raw hyphens '-' with clean en-dashes '–'
 * 2. Keeping technical abbreviations strictly uppercase (PPM, DG, AMF, CCTV, HVAC, etc.)
 * 3. Resolving known truncated category labels (e.g. 'TRAN...' -> 'Transformer')
 */
export function formatCategoryLabel(rawLabel) {
  if (!rawLabel || typeof rawLabel !== 'string') return '';
  const trimmed = rawLabel.trim();

  // Check known label dictionary first
  const upper = trimmed.toUpperCase();
  if (KNOWN_LABEL_MAP[upper]) {
    return KNOWN_LABEL_MAP[upper];
  }

  // 1. Replace underscores with spaces
  let text = trimmed.replace(/_/g, ' ');

  // 2. If it has a pattern like 'something - something' or 'monthly-checklist-dg', normalize separator
  if (text.includes(' - ')) {
    text = text.replace(/\s*-\s*/g, ' – ');
  } else if (/^[a-z0-9]+-[a-z0-9]+/i.test(text)) {
    // e.g. monthly-checklist-dg -> monthly checklist – dg
    const parts = text.split('-');
    if (parts.length > 2) {
      const last = parts.pop();
      text = parts.join(' ') + ' – ' + last;
    } else {
      text = text.replace(/-/g, ' – ');
    }
  }

  // 3. Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // 4. Split into words and process each word
  const words = text.split(' ');
  return words
    .map((word, idx) => {
      // Preserve dashes or special punctuation
      if (word === '–' || word === '&' || word === '/' || word === '+') return word;

      // Strip punctuation for acronym check
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (PRESERVED_ACRONYMS.has(cleanWord)) {
        return word.replace(new RegExp(cleanWord, 'i'), cleanWord);
      }

      // Check lowercase conjunctions/prepositions unless at word boundary (first word)
      const lower = word.toLowerCase();
      if (idx > 0 && ['vs', 'and', 'or', 'by', 'for', 'of', 'in', 'on', 'to'].includes(lower)) {
        return lower;
      }

      // Handle words with special punctuation like (Booster)
      if (word.startsWith('(') && word.endsWith(')')) {
        const inner = word.slice(1, -1);
        const cleanInner = inner.toUpperCase();
        if (PRESERVED_ACRONYMS.has(cleanInner)) {
          return `(${cleanInner})`;
        }
        return `(${inner.charAt(0).toUpperCase()}${inner.slice(1).toLowerCase()})`;
      }

      // Standard Title Case: First letter capital, rest lowercase
      if (word.length <= 1) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Standardizes percentage formatting:
 * - Exactly 100 -> '100%'
 * - 0 -> '0%'
 * - Decimals -> 1 decimal place (e.g., '43.8%')
 * - Never produces '43.8 %' or '100.0%'
 */
export function formatPercentage(value, fallback = '0%') {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return fallback;
  }
  const num = Number(value);
  if (num === 100) return '100%';
  if (num === 0) return '0%';
  if (Number.isInteger(num)) return `${num}%`;
  return `${num.toFixed(1)}%`;
}

/**
 * Standardizes number formatting:
 * - Thousands separator (e.g., 1,240, 11,078)
 * - Whole integers without trailing decimals (e.g., 321 not 321.0)
 */
export function formatNumber(value, fallback = '0') {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return fallback;
  }
  const num = Number(value);
  if (Number.isInteger(num)) {
    return num.toLocaleString();
  }
  return num.toFixed(1);
}

/**
 * Short human-readable number (e.g. 1.2K, 3.4M)
 */
export function formatCompactNumber(value) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0';
  }
  const num = Number(value);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}
