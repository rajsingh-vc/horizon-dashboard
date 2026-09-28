/**
 * Universal Chart Configuration & Dynamic Top-N Engine
 * Enforces strict dashboard standards:
 * - Dynamic Top-N calculation based strictly on dataset length (never hardcoded)
 * - Automatic reset of active limit when dataset shrinks (e.g. Top 10 -> Top 5)
 * - Clean separation between rawData and displayData (never mutates source data)
 * - Declarative chart type compatibility map per dataset
 */

import { useState, useMemo, useEffect } from 'react';

/**
 * Returns available Top-N limits dynamically based strictly on data.length.
 * Rules:
 *  - dataLength <= 5: [] (no Top-N dropdown shown; all items are shown directly)
 *  - 6 to 9 items: ['Top 5', 'All']
 *  - 10 to 14 items: ['Top 5', 'Top 10', 'All']
 *  - 15 to 19 items: ['Top 5', 'Top 10', 'Top 15', 'All']
 *  - 20+ items: ['Top 5', 'Top 10', 'Top 15', 'Top 20', 'All']
 */
export function getAvailableLimits(dataLength = 0) {
  if (typeof dataLength !== 'number' || dataLength <= 5) {
    return [];
  }

  const options = ['All', 'Top 5'];

  // Add multiples of 5 that are strictly less than dataLength
  for (let limit = 10; limit < dataLength; limit += 5) {
    options.push(`Top ${limit}`);
  }

  // Include exact count if not already added as a multiple of 5
  if (dataLength > 5 && dataLength % 5 !== 0) {
    options.push(`Top ${dataLength}`);
  } else if (dataLength >= 10 && !options.includes(`Top ${dataLength}`)) {
    options.push(`Top ${dataLength}`);
  }

  return options;
}

/**
 * Extracts the numeric limit from a string like 'Top 5', 'Top 10', 'All'.
 * Returns Infinity for 'All' or empty.
 */
export function parseLimit(limitStr) {
  if (!limitStr || limitStr === 'All') return Infinity;
  const match = String(limitStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : Infinity;
}

/**
 * Reusable dynamic Top-N filter hook.
 * 1. Preserves rawData intact.
 * 2. Normalizes & sorts data descending by metric value.
 * 3. Dynamically calculates available limits based on dataset length.
 * 4. Automatically resets active limit if new dataset length makes current limit invalid.
 * 5. Returns displayData sliced by current valid limit.
 */
export function useDynamicTopN(data = [], defaultLimit = 'Top 5', valueKey = 'value') {
  const dataLength = Array.isArray(data) ? data.length : 0;
  const availableLimits = useMemo(() => getAvailableLimits(dataLength), [dataLength]);

  const [activeLimit, setActiveLimit] = useState(defaultLimit);

  // Auto-reset when dataset length changes:
  // If the active limit exceeds the new dataset length and isn't 'All',
  // reset to the highest valid limit (e.g. 'Top 5') or 'All'.
  useEffect(() => {
    if (availableLimits.length === 0) {
      // 5 or fewer items: no limit dropdown needed, all items shown
      if (activeLimit !== 'All') {
        setActiveLimit('All');
      }
      return;
    }

    if (!availableLimits.includes(activeLimit)) {
      // Fallback to closest valid limit
      const parsedCurrent = parseLimit(activeLimit);
      const validOptionsWithNums = availableLimits
        .filter((opt) => opt !== 'All')
        .map((opt) => ({ opt, num: parseLimit(opt) }))
        .filter((item) => item.num <= dataLength);

      if (validOptionsWithNums.length > 0) {
        // Pick the largest valid Top-N
        setActiveLimit(validOptionsWithNums[validOptionsWithNums.length - 1].opt);
      } else {
        setActiveLimit('All');
      }
    }
  }, [dataLength, availableLimits, activeLimit]);

  // Sort raw data descending by actual metric value (never modifies raw data in place)
  const sortedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return [...data].sort((a, b) => {
      const valA = Number(a[valueKey] ?? a.value ?? a.count ?? a.score ?? 0);
      const valB = Number(b[valueKey] ?? b.value ?? b.count ?? b.score ?? 0);
      return valB - valA;
    });
  }, [data, valueKey]);

  // Derive displayData from sortedData based on activeLimit
  const displayData = useMemo(() => {
    if (sortedData.length === 0) return [];
    if (availableLimits.length === 0 || activeLimit === 'All') {
      return sortedData;
    }
    const limitNum = parseLimit(activeLimit);
    return sortedData.slice(0, limitNum);
  }, [sortedData, availableLimits.length, activeLimit]);

  return {
    activeLimit: availableLimits.length > 0 ? activeLimit : 'All',
    setActiveLimit,
    availableLimits,
    showLimitDropdown: availableLimits.length > 0,
    rawData: data,
    sortedData,
    displayData,
    dataLength
  };
}

/**
 * Chart Type Compatibility Configuration
 * Ensures dropdowns only present chart types strictly valid for that dataset.
 */
export const CHART_COMPATIBILITY = {
  statusDistribution: ['Donut', 'Pie', 'Vertical Bar', 'Horizontal Bar'],
  categoryPerformance: ['Radar', 'Horizontal Bar', 'Vertical Bar'],
  ticketsByCategory: ['Vertical Bar', 'Horizontal Bar', 'Donut', 'Pie', 'Radar'],
  sitePerformance: ['Vertical Bar', 'Horizontal Bar', 'Area', 'Line', 'Radar', 'Pie'],
  workforceVendor: ['Vertical Bar', 'Horizontal Bar', 'Donut', 'Pie', 'Area'],
  workforceWorkType: ['Horizontal Bar', 'Vertical Bar', 'Donut', 'Pie', 'Area']
};
