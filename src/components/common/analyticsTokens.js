/**
 * Centralized Analytics Design Tokens
 * Provides standard metrics, semantic colors, heights, and card styles
 * ensuring visual consistency across all six operational modules.
 */

export const ANALYTICS_TOKENS = {
  // Semantic Colors
  colors: {
    success: '#00C853',
    successLight: 'rgba(0, 200, 83, 0.12)',
    successBorder: 'rgba(0, 200, 83, 0.3)',
    warning: '#FF9100',
    warningLight: 'rgba(255, 145, 0, 0.12)',
    warningBorder: 'rgba(255, 145, 0, 0.3)',
    critical: '#EF4444',
    criticalLight: 'rgba(239, 68, 68, 0.12)',
    criticalBorder: 'rgba(239, 68, 68, 0.3)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.12)',
    infoBorder: 'rgba(59, 130, 246, 0.3)',
    purple: '#8B5CF6',
    purpleLight: 'rgba(139, 92, 246, 0.12)',
    purpleBorder: 'rgba(139, 92, 246, 0.3)',
    cyan: '#00B0FF',
    cyanLight: 'rgba(0, 176, 255, 0.12)',
    cyanBorder: 'rgba(0, 176, 255, 0.3)',
    orange: '#FF5B22',
    orangeLight: 'rgba(255, 91, 34, 0.12)',
    orangeBorder: 'rgba(255, 91, 34, 0.3)',
    neutral: '#64748B'
  },

  // Component Geometry & Dimensions
  cardRadius: '16px',
  cardPadding: '20px 22px',
  dropdownHeight: '28px',
  chartHeight: 240,
  donutSize: 180,
  donutStrokeWidth: 26,

  // Standard Chart Types
  chartTypes: [
    'Horizontal Bar',
    'Vertical Bar',
    'Line',
    'Area',
    'Pie',
    'Donut',
    'Radar'
  ]
};

export default ANALYTICS_TOKENS;
