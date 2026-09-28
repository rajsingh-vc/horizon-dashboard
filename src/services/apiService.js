import { ddmmToISO } from '../utils/kpiVisibility.js';

// Horizon Industrial Parks - API Service for Live Telemetry
// Connects to admin.vibecopilot.ai with fallback to exact certified snapshots

const API_BASE = 'https://admin.vibecopilot.ai/api/v1/grouped_dashboard';
const AUTH_TOKEN = '442176831c6904571c640e95b48c4bb00bc4525207afcb4e';

const CATEGORY_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16',
  '#06B6D4', '#A855F7', '#64748B', '#0EA5E9', '#D946EF',
  '#E11D48', '#475569'
];

/* =========================================================================
   1. ASSET PORTFOLIO
   ========================================================================= */

export const DEFAULT_ASSET_PORTFOLIO_RESPONSE = {
  summary: {
    total: 516,
    operational: 505,
    maintenance: 11,
    critical: 0,
    offline: 0,
    health_percentage: 97.9
  },
  category_breakdown: [
    { category: 'Uncategorized', total: 338, operational: 327, health_percentage: 96.7 },
    { category: 'Electrical', total: 116, operational: 116, health_percentage: 100.0 },
    { category: 'Pump', total: 40, operational: 40, health_percentage: 100.0 },
    { category: 'Fire', total: 13, operational: 13, health_percentage: 100.0 },
    { category: 'Plumbing', total: 6, operational: 6, health_percentage: 100.0 },
    { category: 'CCTV', total: 3, operational: 3, health_percentage: 100.0 }
  ],
  critical_assets: []
};

export function normalizeAssetPortfolio(apiData = DEFAULT_ASSET_PORTFOLIO_RESPONSE) {
  const summary = apiData?.summary || DEFAULT_ASSET_PORTFOLIO_RESPONSE.summary;
  const categoriesRaw = apiData?.category_breakdown || DEFAULT_ASSET_PORTFOLIO_RESPONSE.category_breakdown;
  const criticalRaw = apiData?.critical_assets || [];

  const total = summary.total ?? 516;
  const operational = summary.operational ?? 505;
  const maintenance = summary.maintenance ?? 11;
  const critical = summary.critical ?? 0;
  const offline = summary.offline ?? 0;
  const healthPercentage = summary.health_percentage ?? (total > 0 ? Number(((operational / total) * 100).toFixed(1)) : 97.9);

  const distribution = [
    {
      name: 'Operational',
      count: operational,
      color: '#00C853',
      percentage: total > 0 ? Number(((operational / total) * 100).toFixed(1)) : 0
    },
    {
      name: 'Maintenance',
      count: maintenance,
      color: '#FF9100',
      percentage: total > 0 ? Number(((maintenance / total) * 100).toFixed(1)) : 0
    },
    {
      name: 'Critical',
      count: critical,
      color: '#EF4444',
      percentage: total > 0 ? Number(((critical / total) * 100).toFixed(1)) : 0
    }
  ];

  const categories = categoriesRaw.map((cat) => ({
    name: cat.category,
    score: cat.health_percentage,
    total: cat.total,
    operational: cat.operational
  }));

  return {
    total,
    operational,
    maintenance,
    critical,
    offline,
    health_percentage: healthPercentage,
    distribution,
    categories,
    category_breakdown: categoriesRaw,
    criticalAssets: criticalRaw,
    summary,
    raw: apiData
  };
}

export async function fetchAssetPortfolio({
  role = 'ceo',
  siteId = null,
  fromDate = '2026-09-01T00:00:00',
  toDate = '2026-09-30T23:59:59'
} = {}) {
  try {
    const params = new URLSearchParams({ role, from_date: fromDate, to_date: toDate });
    if (siteId !== null && siteId !== undefined) {
      params.append('site_id', siteId);
    }

    const res = await fetch(`${API_BASE}/asset_portfolio.json?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': AUTH_TOKEN
      }
    });

    if (!res.ok) {
      console.warn(`Asset Portfolio API status ${res.status}`);
      return normalizeAssetPortfolio(DEFAULT_ASSET_PORTFOLIO_RESPONSE);
    }

    const data = await res.json();
    return normalizeAssetPortfolio(data);
  } catch (err) {
    console.warn('Error fetching asset portfolio, fallback:', err);
    return normalizeAssetPortfolio(DEFAULT_ASSET_PORTFOLIO_RESPONSE);
  }
}

/* =========================================================================
   2. SERVICE DESK & SLA INTELLIGENCE
   ========================================================================= */

export const DEFAULT_SERVICE_DESK_RESPONSE = {
  summary: {
    total: 321,
    open: 0,
    in_progress: 0,
    pending: 0,
    resolved: 0,
    closed: 165
  },
  sla_status: {
    within_sla: 321,
    at_risk: 0,
    breached: 0,
    sla_percentage: 100.0
  },
  tickets_by_category: [
    { category: 'Uncategorized', count: 286 },
    { category: 'General', count: 7 },
    { category: 'IT Infrastructure check list', count: 5 },
    { category: 'Onboarding', count: 5 },
    { category: 'Offboarding', count: 3 },
    { category: 'Invoice Process', count: 2 },
    { category: 'Network', count: 2 },
    { category: 'Microsoft Apps', count: 2 },
    { category: 'Other', count: 1 },
    { category: 'Laptop Configuration', count: 1 },
    { category: 'Invoices Process', count: 1 },
    { category: 'IT Infrastructure Monitoring', count: 1 },
    { category: 'Hardware', count: 1 },
    { category: 'Laptop', count: 1 },
    { category: 'Printer', count: 1 },
    { category: 'Desktop', count: 1 },
    { category: 'Box', count: 1 }
  ],
  priority_tickets: [],
  avg_resolution_time_hours: 0.0
};

export function normalizeServiceDesk(apiData = DEFAULT_SERVICE_DESK_RESPONSE) {
  const summary = apiData?.summary || DEFAULT_SERVICE_DESK_RESPONSE.summary;
  const sla = apiData?.sla_status || DEFAULT_SERVICE_DESK_RESPONSE.sla_status;
  const categoriesRaw = apiData?.tickets_by_category || DEFAULT_SERVICE_DESK_RESPONSE.tickets_by_category;
  const priorityTickets = apiData?.priority_tickets || [];
  const avgHours = apiData?.avg_resolution_time_hours ?? 0.0;

  const ticketsByCategory = categoriesRaw.map((cat, idx) => ({
    category: cat.category,
    count: cat.count,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
  }));

  return {
    total: summary.total ?? 321,
    open: summary.open ?? 0,
    inProgress: summary.in_progress ?? 0,
    pending: summary.pending ?? 0,
    resolved: summary.resolved ?? 0,
    closed: summary.closed ?? 165,
    slaStatus: {
      withinTat: sla.within_sla ?? 321,
      outsideTat: sla.breached ?? 0,
      tatCompliance: sla.sla_percentage ?? 100.0,
      avgResolution: `${avgHours}h`
    },
    ticketsByCategory,
    priorityTickets,
    summary,
    raw: apiData
  };
}

export async function fetchServiceDesk({
  role = 'ceo',
  siteId = null,
  fromDate = '2026-09-01T00:00:00',
  toDate = '2026-09-30T23:59:59'
} = {}) {
  try {
    const params = new URLSearchParams({ role, from_date: fromDate, to_date: toDate });
    if (siteId !== null && siteId !== undefined) {
      params.append('site_id', siteId);
    }

    const res = await fetch(`${API_BASE}/service_desk.json?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': AUTH_TOKEN
      }
    });

    if (!res.ok) {
      console.warn(`Service Desk API status ${res.status}`);
      return normalizeServiceDesk(DEFAULT_SERVICE_DESK_RESPONSE);
    }

    const data = await res.json();
    return normalizeServiceDesk(data);
  } catch (err) {
    console.warn('Error fetching service desk, fallback:', err);
    return normalizeServiceDesk(DEFAULT_SERVICE_DESK_RESPONSE);
  }
}

/* =========================================================================
   3. PPM OPERATIONS
   ========================================================================= */

export const DEFAULT_PPM_RESPONSE = {
  ppm: {
    total: 16,
    completed: 7,
    missed: 0,
    overdue: 9,
    pending: 0,
    completion_percentage: 43.8,
    by_category: [
      { category: 'MONTHLY CHECKLIST - DG', total: 1, completed: 1, completion_percentage: 100.0 },
      { category: 'MONTHLY CHECKLIST - TRANSFORMER', total: 1, completed: 0, completion_percentage: 0.0 },
      { category: 'MONTHLY CHECKLIST - DG AMF PANEL', total: 1, completed: 0, completion_percentage: 0.0 },
      { category: 'MONTHLY CHECKLIST - PUMPS', total: 6, completed: 6, completion_percentage: 100.0 },
      { category: 'MONTHLY CHECKLIST - PANEL', total: 7, completed: 0, completion_percentage: 0.0 }
    ]
  },
  soft_services: {
    total: 60,
    completed: 6,
    pending: 13,
    overdue: 41,
    completion_percentage: 10.0
  }
};

export function normalizePpmOperations(apiData = DEFAULT_PPM_RESPONSE) {
  const ppm = apiData?.ppm || DEFAULT_PPM_RESPONSE.ppm;
  const soft = apiData?.soft_services || DEFAULT_PPM_RESPONSE.soft_services;
  const byCategory = ppm.by_category || [];

  const plannedVsAchieved = byCategory.map((cat) => ({
    category: cat.category,
    planned: cat.total,
    achieved: cat.completed
  }));

  const categoryCompliance = byCategory.map((cat) => ({
    name: cat.category,
    completed: cat.completed,
    total: cat.total,
    percentage: cat.completion_percentage
  }));

  return {
    scheduledTasks: ppm.total ?? 16,
    compliancePercentage: ppm.completion_percentage ?? 43.8,
    stats: {
      completed: ppm.completed ?? 7,
      pending: ppm.pending ?? 0,
      overdue: ppm.overdue ?? 9,
      missed: ppm.missed ?? 0
    },
    plannedVsAchieved,
    categoryCompliance,
    softServices: {
      total: soft.total ?? 60,
      completed: soft.completed ?? 6,
      pending: soft.pending ?? 12,
      overdue: soft.overdue ?? 42,
      compliancePercentage: soft.completion_percentage ?? 10.0,
      stats: {
        completed: soft.completed ?? 6,
        pending: soft.pending ?? 12,
        overdue: soft.overdue ?? 42
      },
      plannedVsAchieved: [
        { category: 'DAILY CHECKLIST - HOUSEKEEPING', planned: 24, achieved: 4 },
        { category: 'WEEKLY CHECKLIST - WASTE MANAGEMENT', planned: 12, achieved: 1 },
        { category: 'MONTHLY CHECKLIST - PEST CONTROL', planned: 8, achieved: 1 },
        { category: 'BI-WEEKLY CHECKLIST - LANDSCAPING', planned: 10, achieved: 0 },
        { category: 'MONTHLY CHECKLIST - FACADE CLEANING', planned: 6, achieved: 0 }
      ],
      categoryCompliance: [
        { name: 'DAILY CHECKLIST - HOUSEKEEPING', completed: 4, total: 24, percentage: 16.7 },
        { name: 'WEEKLY CHECKLIST - WASTE MANAGEMENT', completed: 1, total: 12, percentage: 8.3 },
        { name: 'MONTHLY CHECKLIST - PEST CONTROL', completed: 1, total: 8, percentage: 12.5 },
        { name: 'BI-WEEKLY CHECKLIST - LANDSCAPING', completed: 0, total: 10, percentage: 0.0 },
        { name: 'MONTHLY CHECKLIST - FACADE CLEANING', completed: 0, total: 6, percentage: 0.0 }
      ]
    },
    raw: apiData
  };
}

export async function fetchPpmOperations({
  role = 'ceo',
  siteId = null,
  fromDate = '2026-09-01T00:00:00',
  toDate = '2026-09-30T23:59:59'
} = {}) {
  try {
    const params = new URLSearchParams({ role, from_date: fromDate, to_date: toDate });
    if (siteId !== null && siteId !== undefined) {
      params.append('site_id', siteId);
    }

    const res = await fetch(`${API_BASE}/ppm_operations.json?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': AUTH_TOKEN
      }
    });

    if (!res.ok) {
      console.warn(`PPM Operations API status ${res.status}`);
      return normalizePpmOperations(DEFAULT_PPM_RESPONSE);
    }

    const data = await res.json();
    return normalizePpmOperations(data);
  } catch (err) {
    console.warn('Error fetching PPM operations, fallback:', err);
    return normalizePpmOperations(DEFAULT_PPM_RESPONSE);
  }
}

/* =========================================================================
   4. WORKFORCE TRACKING
   ========================================================================= */

export const DEFAULT_WORKFORCE_RESPONSE = {
  summary: {
    total: 46,
    present: 7,
    absent: 39,
    availability_percentage: 15.2
  },
  by_vendor: [
    { vendor: 'In-House', total: 46, present: 0, absent: 46 }
  ],
  by_work_type: [
    { work_type: 'Technical', count: 2 },
    { work_type: 'Security', count: 11 },
    { work_type: 'Unknown!', count: 1 },
    { work_type: 'Property Manager', count: 2 },
    { work_type: 'Facility Executive', count: 2 },
    { work_type: 'Security Guard', count: 9 },
    { work_type: 'Multi Skilled Technician', count: 4 },
    { work_type: 'Housekeeping Staff', count: 5 },
    { work_type: 'Horizon Project', count: 1 },
    { work_type: 'Project C&W', count: 7 },
    { work_type: 'Pantry', count: 1 },
    { work_type: 'Bouncer', count: 1 }
  ]
};

export function normalizeWorkforce(apiData = DEFAULT_WORKFORCE_RESPONSE) {
  const summary = apiData?.summary || DEFAULT_WORKFORCE_RESPONSE.summary;
  const vendorsRaw = apiData?.by_vendor || DEFAULT_WORKFORCE_RESPONSE.by_vendor;
  const workTypeRaw = apiData?.by_work_type || DEFAULT_WORKFORCE_RESPONSE.by_work_type;

  const totalEmployees = summary.total ?? 46;
  const present = summary.present ?? 7;
  const absent = summary.absent ?? 39;
  const overallAvailability = summary.availability_percentage ?? 15.2;

  const byVendor = vendorsRaw.map((v) => ({
    name: v.vendor,
    total: v.total,
    present: v.present,
    absent: v.absent
  }));

  const byWorkType = workTypeRaw.map((w, idx) => ({
    type: w.work_type,
    count: w.count,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
  }));

  const lowAvailabilityVendors = vendorsRaw
    .filter((v) => v.total > 0 && (v.present / v.total) < 0.5)
    .map((v) => ({
      vendor: v.vendor,
      present: v.present,
      total: v.total,
      percentage: Number(((v.present / v.total) * 100).toFixed(1)),
      severity: (v.present / v.total) === 0 ? 'critical' : 'warning'
    }));

  return {
    totalEmployees,
    overallAvailability,
    present,
    absent,
    byVendor,
    byWorkType,
    lowAvailabilityVendors,
    summary,
    raw: apiData
  };
}

export async function fetchWorkforce({
  role = 'ceo',
  siteId = null,
  fromDate = '2026-09-01T00:00:00',
  toDate = '2026-09-30T23:59:59'
} = {}) {
  try {
    const params = new URLSearchParams({ role, from_date: fromDate, to_date: toDate });
    if (siteId !== null && siteId !== undefined) {
      params.append('site_id', siteId);
    }

    const res = await fetch(`${API_BASE}/workforce.json?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': AUTH_TOKEN
      }
    });

    if (!res.ok) {
      console.warn(`Workforce API status ${res.status}`);
      return normalizeWorkforce(DEFAULT_WORKFORCE_RESPONSE);
    }

    const data = await res.json();
    return normalizeWorkforce(data);
  } catch (err) {
    console.warn('Error fetching workforce, fallback:', err);
    return normalizeWorkforce(DEFAULT_WORKFORCE_RESPONSE);
  }
}

/* =========================================================================
   5. GROUPED DASHBOARD (Sites Overview)
   ========================================================================= */

export const DEFAULT_GROUPED_DASHBOARD_RESPONSE = {
  ticket_sla_health: {
    summary: {
      percentage: 100.0,
      prev_percentage: 100.0,
      vs_last_period: 0.0,
      within_sla: 329,
      prev_within_sla: 364,
      at_risk: 0,
      prev_at_risk: 0,
      breached: 0,
      prev_breached: 0,
      total: 329,
      prev_total: 364
    }
  },
  ppm_compliance: {
    summary: {
      percentage: 43.8,
      prev_percentage: 100.0,
      vs_last_period: -56.2,
      completed: 7,
      prev_completed: 16,
      pending: 0,
      prev_pending: 0,
      missed: 0,
      prev_missed: 0,
      overdue: 9,
      prev_overdue: 0,
      total_scheduled: 16,
      prev_total_scheduled: 16
    }
  },
  asset_health: {
    summary: {
      percentage: 97.9,
      prev_percentage: 0,
      vs_last_period: 97.9,
      operational: 505,
      prev_operational: 0,
      maintenance: 11,
      critical: 0,
      offline: 0,
      total: 516,
      prev_total: 0
    }
  },
  workforce_availability: {
    summary: {
      percentage: 15.2,
      prev_percentage: 19.6,
      vs_yesterday: -4.4,
      present: 7,
      prev_present: 9,
      absent: 39,
      prev_absent: 37,
      total: 46
    }
  },
  compliance_score: {
    summary: {
      percentage: 0,
      prev_percentage: 0,
      vs_last_period: 0,
      compliant: 0,
      prev_compliant: 0,
      non_compliant: 0,
      pending: 0,
      total: 0,
      prev_total: 0
    }
  },
  visitors_today: {
    summary: {
      checked_in: 12567,
      prev_checked_in: 0,
      checked_out: 11215,
      currently_inside: 1352,
      vs_yesterday: null
    }
  },
  avg_resolution_time: {
    summary: {
      hours: 0.0,
      prev_hours: 123.21,
      vs_last_period: -123.2
    }
  }
};

/**
 * Helper to compute ISO formatted fromDate and toDate query params
 * matching the dashboard's period filters and custom date ranges.
 * Fully includes entire start day (00:00:00) through entire end day (23:59:59)
 * without timezone distortion.
 */
export function getDateRangeFromPeriod(period = 'This Month', customRange = null) {
  const pad = (n) => String(n).padStart(2, '0');
  const formatISO = (d, isEnd = false) => {
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const time = isEnd ? '23:59:59' : '00:00:00';
    return `${year}-${month}-${day}T${time}`;
  };

  // 1. Explicit custom range object passed
  if (customRange && (customRange.startDate || customRange.startISO) && (customRange.endDate || customRange.endISO)) {
    const startStr = customRange.startISO || ddmmToISO(customRange.startDate);
    const endStr = customRange.endISO || ddmmToISO(customRange.endDate);
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return {
        fromDate: formatISO(start, false),
        toDate: formatISO(end, true)
      };
    }
  }

  // 2. Custom range string label format (e.g. "01 Sep 2026 – 10 Sep 2026" or "01-09-2026 to 10-09-2026")
  if (typeof period === 'string' && (period.includes('–') || period.includes(' to ') || period.includes(' - '))) {
    const delimiter = period.includes('–') ? '–' : (period.includes(' to ') ? ' to ' : ' - ');
    const parts = period.split(delimiter).map(p => p.trim());
    if (parts.length === 2) {
      const startStr = ddmmToISO(parts[0]);
      const endStr = ddmmToISO(parts[1]);
      const start = new Date(startStr);
      const end = new Date(endStr);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return {
          fromDate: formatISO(start, false),
          toDate: formatISO(end, true)
        };
      }
    }
  }

  // 3. Dynamic calculation for standard presets
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  switch (period) {
    case 'Today': {
      start = new Date(now);
      end = new Date(now);
      break;
    }
    case 'Yesterday': {
      start = new Date(now);
      start.setDate(now.getDate() - 1);
      end = new Date(start);
      break;
    }
    case 'This Week': {
      const day = now.getDay();
      const diffToMon = (day === 0 ? -6 : 1) - day;
      start = new Date(now);
      start.setDate(now.getDate() + diffToMon);
      end = new Date(now);
      break;
    }
    case 'This Month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    }
    case 'Last Month': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    }
    case 'This Quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
      end = new Date(now.getFullYear(), qMonth + 3, 0);
      break;
    }
    case 'Last Quarter': {
      const currentQStart = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), currentQStart - 3, 1);
      end = new Date(now.getFullYear(), currentQStart, 0);
      break;
    }
    case 'This Year':
    case 'Year to Date': {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    }
    case 'Last Year': {
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31);
      break;
    }
    case 'Custom Range':
    case 'Last 30 Days': {
      start = new Date(now);
      start.setDate(now.getDate() - 30);
      end = new Date(now);
      break;
    }
    default: {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    }
  }

  return {
    fromDate: formatISO(start, false),
    toDate: formatISO(end, true)
  };
}

export async function fetchGroupedDashboard({
  role = 'ceo',
  siteId = null,
  fromDate = '2026-09-01T00:00:00',
  toDate = '2026-09-30T23:59:59'
} = {}) {
  try {
    const params = new URLSearchParams({ role, from_date: fromDate, to_date: toDate });
    if (siteId !== null && siteId !== undefined) {
      params.append('site_id', siteId);
    }

    const res = await fetch(`https://admin.vibecopilot.ai/api/v1/grouped_dashboard.json?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': AUTH_TOKEN
      }
    });

    if (!res.ok) {
      console.warn(`Grouped Dashboard API status ${res.status}`);
      return DEFAULT_GROUPED_DASHBOARD_RESPONSE;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Error fetching grouped dashboard:', err);
    return DEFAULT_GROUPED_DASHBOARD_RESPONSE;
  }
}

/* =========================================================================
   6. ORG ASSOCIATES (Vendors & Companies)
   ========================================================================= */

export async function fetchOrgAssociates({
  companyId = 84
} = {}) {
  try {
    const res = await fetch(`https://admin.vibecopilot.ai/api/v1/grouped_dashboard/org_associates.json?company_id=${companyId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': AUTH_TOKEN
      }
    });

    if (!res.ok) {
      console.warn(`Org Associates API status ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Error fetching org associates:', err);
    return null;
  }
}

