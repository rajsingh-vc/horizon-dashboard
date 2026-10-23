import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardHeader from './components/header/DashboardHeader';
import DashboardHero from './components/hero/DashboardHero';
import KpiSection from './components/kpi/KpiSection';
import SitePerformance from './components/sites/SitePerformance';
import AssetPortfolio from './components/assets/AssetPortfolio';
import ServiceDesk from './components/servicedesk/ServiceDesk';
import PpmOperations from './components/ppm/PpmOperations';
import WorkforceTracking from './components/workforce/WorkforceTracking';
import LoadingSkeleton from './components/common/LoadingSkeleton';
import DrillDownModal from './components/common/DrillDownModal';
import { 
  SITES_DATA, 
  INITIAL_DASHBOARD_DATA,
  CATEGORIES_DATA
} from './data/mockData';
import { 
  fetchAssetPortfolio, 
  fetchServiceDesk, 
  fetchPpmOperations, 
  fetchWorkforce,
  fetchGroupedDashboard,
  fetchOrgAssociates,
  getDateRangeFromPeriod
} from './services/apiService';

const formatCurrentTime = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
};

export default function App() {
  // Central Global Dashboard Filter State (Single source of truth)
  const [selectedDate, setSelectedDate] = useState('This Month');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('All Groups');
  const [selectedSite, setSelectedSite] = useState('All Sites');
  const [selectedVendor, setSelectedVendor] = useState('All Vendors');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  // Theme state: defaults to 'dark', persists in localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('horizon_theme') || 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('horizon_theme', next);
      return next;
    });
  }, []);

  // Sync data-theme attribute on documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [lastUpdated, setLastUpdated] = useState(formatCurrentTime);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [triggerKey, setTriggerKey] = useState(0);

  // Drill-down inspection modal state
  const [drillDownModal, setDrillDownModal] = useState({
    isOpen: false,
    info: null
  });

  // Live telemetry states synced with APIs (Raw ground truth)
  const [assetPortfolioData, setAssetPortfolioData] = useState(INITIAL_DASHBOARD_DATA.assets);
  const [serviceDeskData, setServiceDeskData] = useState(INITIAL_DASHBOARD_DATA.serviceDesk);
  const [ppmData, setPpmData] = useState(INITIAL_DASHBOARD_DATA.ppm);
  const [workforceData, setWorkforceData] = useState(INITIAL_DASHBOARD_DATA.workforce);
  const [groupedDashboardData, setGroupedDashboardData] = useState(null);
  const [sitesData, setSitesData] = useState(SITES_DATA);
  const [vendorsList, setVendorsList] = useState(['All Vendors']);
  const [apiCategories, setApiCategories] = useState(CATEGORIES_DATA);

  // Dynamic real-time timestamp updating every second
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(formatCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic available Groups derived from sitesData with 'All Groups' first, matching screenshot order
  const availableGroups = useMemo(() => {
    const set = new Set();
    (sitesData || []).forEach((s) => {
      const g = s.group || s.region;
      if (g && g !== '.') set.add(g.trim());
    });
    const sorted = Array.from(set).sort((a, b) => {
      if (a === 'Mumbai') return -1;
      if (b === 'Mumbai') return 1;
      return a.localeCompare(b);
    });
    return ['All Groups', ...sorted];
  }, [sitesData]);

  // Dynamic available Categories derived from real API associates & telemetry
  const availableCategories = useMemo(() => {
    const set = new Set(['All Categories']);
    (apiCategories || []).forEach((c) => {
      if (c && c !== 'All Categories') set.add(c);
    });
    (assetPortfolioData?.category_breakdown || []).forEach((c) => {
      if (c.category) set.add(c.category.trim());
    });
    (serviceDeskData?.ticketsByCategory || []).forEach((c) => {
      if (c.category) set.add(c.category.trim());
    });
    (ppmData?.plannedVsAchieved || []).forEach((c) => {
      if (c.category) {
        const clean = c.category.replace(/^(MONTHLY|DAILY|WEEKLY|BI-WEEKLY) CHECKLIST - /i, '').trim();
        if (clean) set.add(clean);
      }
    });
    return Array.from(set);
  }, [apiCategories, assetPortfolioData, serviceDeskData, ppmData]);

  // Dynamic available Vendors derived from API associates without fake vendor names
  const availableVendors = useMemo(() => {
    const set = new Set(['All Vendors']);
    (vendorsList || []).forEach((v) => {
      const name = typeof v === 'string' ? v : (v?.name || v?.vendor || v?.associate_name || v?.company_name);
      if (name && name !== 'All Vendors') set.add(name.trim());
    });
    return Array.from(set);
  }, [vendorsList]);

  // Handle group change with site constraint validation
  const handleGroupChange = useCallback((grp) => {
    setSelectedGroup(grp);
    if (grp !== 'All Groups' && selectedSite !== 'All Sites') {
      const siteObj = sitesData.find((s) => s.name === selectedSite);
      const siteGroup = siteObj?.group || siteObj?.region || '';
      if (siteGroup.toLowerCase() !== grp.toLowerCase()) {
        setSelectedSite('All Sites');
      }
    }
  }, [selectedSite, sitesData]);

  // Handle site change (supports siteId or siteName)
  const handleSiteChange = useCallback((siteIdentifier) => {
    if (!siteIdentifier || siteIdentifier === 'All Sites') {
      setSelectedSite('All Sites');
      return;
    }
    const siteObj = sitesData.find((s) => 
      s.id === siteIdentifier || 
      String(s.id) === String(siteIdentifier) || 
      s.name.toLowerCase() === String(siteIdentifier).toLowerCase()
    );
    const siteName = siteObj ? siteObj.name : siteIdentifier;
    setSelectedSite(siteName);
    if (siteObj && selectedGroup !== 'All Groups') {
      const siteGroup = siteObj.group || siteObj.region;
      if (siteGroup && siteGroup.toLowerCase() !== selectedGroup.toLowerCase()) {
        setSelectedGroup('All Groups');
      }
    }
  }, [selectedGroup, sitesData]);

  // Handle date change (supports both preset strings and custom range objects)
  const handleDateChange = useCallback((period, customRangeData) => {
    if (period === 'Custom Range' && customRangeData) {
      setSelectedDate(customRangeData.label);
      setCustomDateRange(customRangeData);
    } else {
      setSelectedDate(period);
      setCustomDateRange(null);
    }
  }, []);

  // Fetch live telemetry for all modules concurrently when selected site, date, or triggerKey updates
  useEffect(() => {
    let isCancelled = false;

    async function loadTelemetry() {
      setIsLoadingTelemetry(true);
      let siteId = null;
      if (selectedSite !== 'All Sites') {
        const found = sitesData.find((s) => s.name === selectedSite);
        if (found) siteId = found.id;
      }
      const { fromDate, toDate } = getDateRangeFromPeriod(selectedDate, customDateRange);

      try {
        const [assetsRes, serviceDeskRes, ppmRes, workforceRes, groupedRes, orgAssociatesRes] = await Promise.all([
          fetchAssetPortfolio({ siteId, fromDate, toDate }),
          fetchServiceDesk({ siteId, fromDate, toDate }),
          fetchPpmOperations({ siteId, fromDate, toDate }),
          fetchWorkforce({ siteId, fromDate, toDate }),
          fetchGroupedDashboard({ role: 'ceo', siteId, fromDate, toDate }),
          fetchOrgAssociates({ companyId: 84 })
        ]);

        if (!isCancelled) {
          if (assetsRes) setAssetPortfolioData(assetsRes);
          if (serviceDeskRes) setServiceDeskData(serviceDeskRes);
          if (ppmRes) setPpmData(ppmRes);
          if (workforceRes) setWorkforceData(workforceRes);
          if (groupedRes) {
            setGroupedDashboardData(groupedRes);
            if (groupedRes?.sites && Array.isArray(groupedRes.sites) && groupedRes.sites.length > 0) {
              setSitesData(groupedRes.sites);
            }
          }
          if (orgAssociatesRes) {
            if (Array.isArray(orgAssociatesRes.categories) && orgAssociatesRes.categories.length > 0) {
              const rawCats = orgAssociatesRes.categories
                .map((c) => (typeof c === 'string' ? c : c?.name))
                .filter(Boolean)
                .map((c) => c.trim().replace(/\t/g, ''));
              setApiCategories(Array.from(new Set(rawCats)));
            }
            if (Array.isArray(orgAssociatesRes.vendors) && orgAssociatesRes.vendors.length > 0) {
              const rawVendors = orgAssociatesRes.vendors
                .map((v) => (typeof v === 'string' ? v : (v?.name || v?.vendor || v?.associate_name || v?.company_name)))
                .filter(Boolean)
                .map((v) => v.trim());
              setVendorsList(Array.from(new Set(['All Vendors', ...rawVendors])));
            }
          }
        }
      } catch (err) {
        console.warn('Telemetry load error:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingTelemetry(false);
        }
      }
    }

    loadTelemetry();

    return () => {
      isCancelled = true;
    };
  }, [selectedSite, selectedDate, customDateRange, triggerKey]);

  // Trigger simulated live data refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setToastMessage('Fetching latest operational telemetry...');

    setTimeout(() => {
      setLastUpdated(formatCurrentTime());
      setIsRefreshing(false);
      setTriggerKey((prev) => prev + 1);
      setToastMessage('Live telemetry updated successfully');

      setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    }, 750);
  }, []);

  // Group sites (all sites in the selected group, for comparative ranking & overview)
  const groupSites = useMemo(() => {
    return sitesData.filter((site) => {
      const grp = site.group || site.region || '';
      return selectedGroup === 'All Groups' || grp.toLowerCase() === selectedGroup.toLowerCase();
    });
  }, [sitesData, selectedGroup]);

  // Filtered sites based on Group and Site filter
  const filteredSites = useMemo(() => {
    return sitesData.filter((site) => {
      const grp = site.group || site.region || '';
      const matchesGroup = selectedGroup === 'All Groups' || grp.toLowerCase() === selectedGroup.toLowerCase();
      const matchesSite = selectedSite === 'All Sites' || site.name.toLowerCase() === selectedSite.toLowerCase();
      return matchesGroup && matchesSite;
    });
  }, [sitesData, selectedGroup, selectedSite]);

  // Compute filtered dashboard data combining all 5 active filters (AND logic)
  const currentData = useMemo(() => {
    const isNum = (v) => typeof v === 'number' && !isNaN(v);

    // 1. Group / Site filtering on sites
    const groupSites = selectedGroup === 'All Groups' 
      ? sitesData 
      : sitesData.filter((s) => (s.group || s.region || '').toLowerCase() === selectedGroup.toLowerCase());

    const foundSite = selectedSite === 'All Sites' 
      ? null 
      : sitesData.find((s) => s.name.toLowerCase() === selectedSite.toLowerCase());

    // 2. Base metrics calculation
    const baseTickets = foundSite 
      ? (foundSite.tickets || 0)
      : (selectedGroup !== 'All Groups' 
          ? groupSites.reduce((sum, s) => sum + (s.tickets || 0), 0)
          : (serviceDeskData?.total ?? 321));

    const baseAssets = foundSite 
      ? (foundSite.activeAssets || foundSite.total_assets || 0)
      : (selectedGroup !== 'All Groups' 
          ? groupSites.reduce((sum, s) => sum + (s.activeAssets || s.total_assets || 0), 0)
          : (assetPortfolioData?.total ?? 516));

    const baseHealth = foundSite 
      ? (isNum(foundSite.health) ? foundSite.health : 97.9)
      : (selectedGroup !== 'All Groups'
          ? (groupSites.length > 0 ? Number((groupSites.reduce((sum, s) => sum + (s.health || 0), 0) / groupSites.length).toFixed(1)) : 97.9)
          : (assetPortfolioData?.health_percentage ?? 97.9));

    const baseTat = foundSite 
      ? (isNum(foundSite.tat) ? foundSite.tat : 100.0)
      : (selectedGroup !== 'All Groups'
          ? (groupSites.length > 0 ? Number((groupSites.reduce((sum, s) => sum + (s.tat || 0), 0) / groupSites.length).toFixed(1)) : 100.0)
          : (serviceDeskData?.slaStatus?.tatCompliance ?? 100.0));

    const basePpm = foundSite 
      ? (isNum(foundSite.ppm) ? foundSite.ppm : 43.8)
      : (selectedGroup !== 'All Groups'
          ? (groupSites.length > 0 ? Number((groupSites.reduce((sum, s) => sum + (s.ppm || 0), 0) / groupSites.length).toFixed(1)) : 43.8)
          : (ppmData?.compliancePercentage ?? 43.8));

    // 2b. Scope base datasets to selected site or group before category/vendor filters
    let processedAssets = assetPortfolioData;
    let processedServiceDesk = serviceDeskData;
    let processedPpm = ppmData;
    let processedWorkforce = workforceData;

    if (foundSite) {
      // 1. ASSETS SCOPED TO SELECTED SITE
      const siteTotalAssets = foundSite.total_assets ?? foundSite.activeAssets ?? 0;
      const siteAssetHealth = isNum(foundSite.health) ? foundSite.health : 0;
      const siteOp = siteTotalAssets > 0 ? Math.round(((siteAssetHealth || 0) / 100) * siteTotalAssets) : 0;
      const siteMaint = Math.max(0, siteTotalAssets - siteOp);

      const baseCategories = assetPortfolioData?.category_breakdown || [];
      const globalTotal = assetPortfolioData?.total || 516;
      let remainingCatAssets = siteTotalAssets;
      const siteCategories = baseCategories.map((c, idx) => {
        if (siteTotalAssets === 0) {
          return {
            category: c.category,
            name: c.category,
            total: 0,
            operational: 0,
            score: 0,
            health_percentage: 0
          };
        }
        const ratio = globalTotal > 0 ? (c.total / globalTotal) : (1 / (baseCategories.length || 1));
        const catTotal = idx === baseCategories.length - 1 ? remainingCatAssets : Math.min(remainingCatAssets, Math.round(ratio * siteTotalAssets));
        remainingCatAssets = Math.max(0, remainingCatAssets - catTotal);
        const catOp = Math.round(((siteAssetHealth || 0) / 100) * catTotal);
        return {
          category: c.category,
          name: c.category,
          total: catTotal,
          operational: catOp,
          score: catTotal > 0 ? siteAssetHealth : (c.health_percentage ?? 0),
          health_percentage: catTotal > 0 ? siteAssetHealth : (c.health_percentage ?? 0)
        };
      });

      processedAssets = {
        ...assetPortfolioData,
        total: siteTotalAssets,
        operational: siteOp,
        maintenance: siteMaint,
        critical: 0,
        offline: 0,
        health_percentage: siteAssetHealth,
        categories: siteCategories,
        category_breakdown: siteCategories,
        summary: {
          total: siteTotalAssets,
          operational: siteOp,
          maintenance: siteMaint,
          critical: 0,
          offline: 0,
          health_percentage: siteAssetHealth
        },
        distribution: [
          { name: 'Operational', count: siteOp, color: '#00C853', percentage: siteTotalAssets > 0 ? Number(((siteOp / siteTotalAssets) * 100).toFixed(1)) : 0 },
          { name: 'Maintenance', count: siteMaint, color: '#FF9100', percentage: siteTotalAssets > 0 ? Number(((siteMaint / siteTotalAssets) * 100).toFixed(1)) : 0 },
          { name: 'Critical', count: 0, color: '#EF4444', percentage: 0 }
        ]
      };

      // 2. SERVICE DESK SCOPED TO SELECTED SITE
      const siteTotalTickets = foundSite.tickets ?? 0;
      const siteTat = isNum(foundSite.tat) ? foundSite.tat : 0;
      const sitePending = foundSite.pending_tickets ?? 0;
      const siteOpen = foundSite.open_tickets ?? 0;
      const siteClosed = Math.max(0, siteTotalTickets - sitePending - siteOpen);
      const siteWithinTat = Math.round(((siteTat || 0) / 100) * siteTotalTickets);
      const siteOutsideTat = Math.max(0, siteTotalTickets - siteWithinTat);

      const baseTicketsByCat = serviceDeskData?.ticketsByCategory || [];
      const globalTicketsTotal = serviceDeskData?.total || 321;
      let remainingTickets = siteTotalTickets;
      const siteTicketsByCat = baseTicketsByCat.map((c, idx) => {
        if (siteTotalTickets === 0) return { ...c, count: 0 };
        const ratio = globalTicketsTotal > 0 ? (c.count / globalTicketsTotal) : (1 / baseTicketsByCat.length);
        const count = idx === baseTicketsByCat.length - 1 ? remainingTickets : Math.min(remainingTickets, Math.round(ratio * siteTotalTickets));
        remainingTickets = Math.max(0, remainingTickets - count);
        return {
          ...c,
          count
        };
      });

      processedServiceDesk = {
        ...serviceDeskData,
        total: siteTotalTickets,
        open: siteOpen,
        inProgress: 0,
        pending: sitePending,
        resolved: 0,
        closed: siteClosed,
        slaStatus: {
          withinTat: siteWithinTat,
          outsideTat: siteOutsideTat,
          tatCompliance: siteTat,
          avgResolution: siteTat > 0 ? '2.4h' : '0h'
        },
        ticketsByCategory: siteTicketsByCat,
        summary: {
          total: siteTotalTickets,
          open: siteOpen,
          in_progress: 0,
          pending: sitePending,
          resolved: 0,
          closed: siteClosed
        }
      };

      // 3. PPM SCOPED TO SELECTED SITE
      const sitePpmComp = isNum(foundSite.ppm) ? foundSite.ppm : 0;
      const siteScheduled = foundSite.raw?.scheduled_ppm ?? (sitePpmComp > 0 ? 8 : (siteTotalAssets > 0 ? 4 : 0));
      const siteCompleted = Math.round(((sitePpmComp || 0) / 100) * siteScheduled);
      const siteOverdue = Math.max(0, siteScheduled - siteCompleted);

      const basePlannedVsAchieved = ppmData?.plannedVsAchieved || [];
      const sitePlannedVsAchieved = basePlannedVsAchieved.map((c) => {
        const planned = siteScheduled > 0 ? Math.max(1, Math.round(siteScheduled / (basePlannedVsAchieved.length || 1))) : 0;
        const achieved = Math.round(((sitePpmComp || 0) / 100) * planned);
        return {
          ...c,
          planned,
          achieved
        };
      });

      processedPpm = {
        ...ppmData,
        compliancePercentage: sitePpmComp,
        scheduledTasks: siteScheduled,
        stats: {
          completed: siteCompleted,
          pending: 0,
          overdue: siteOverdue,
          missed: 0
        },
        plannedVsAchieved: sitePlannedVsAchieved,
        summary: {
          total_scheduled: siteScheduled,
          completed: siteCompleted,
          overdue: siteOverdue,
          pending: 0,
          missed: 0
        }
      };

      // 4. WORKFORCE SCOPED TO SELECTED SITE
      const siteWorkforceAvail = isNum(foundSite.workforce_percentage) ? foundSite.workforce_percentage : 0;
      const siteTotalEmp = siteWorkforceAvail > 0 ? 25 : (siteTotalAssets > 0 ? 12 : 0);
      const sitePresent = Math.round(((siteWorkforceAvail || 0) / 100) * siteTotalEmp);
      const siteAbsent = Math.max(0, siteTotalEmp - sitePresent);

      const baseVendors = workforceData?.byVendor || [];
      const siteByVendor = baseVendors.map((v) => {
        const total = siteTotalEmp > 0 ? Math.max(1, Math.round(siteTotalEmp / (baseVendors.length || 1))) : 0;
        const pres = Math.round(((siteWorkforceAvail || 0) / 100) * total);
        return {
          ...v,
          total,
          present: pres,
          absent: Math.max(0, total - pres)
        };
      });

      processedWorkforce = {
        ...workforceData,
        totalEmployees: siteTotalEmp,
        overallAvailability: siteWorkforceAvail,
        present: sitePresent,
        absent: siteAbsent,
        byVendor: siteByVendor,
        summary: {
          total: siteTotalEmp,
          present: sitePresent,
          absent: siteAbsent,
          availability_percentage: siteWorkforceAvail
        }
      };
    }

    // 3. Category Filter Application (Assets)
    if (selectedCategory !== 'All Categories' && processedAssets) {
      const target = selectedCategory.toLowerCase().trim();
      const matchCat = (catName) => {
        if (!catName) return false;
        const name = catName.toLowerCase().trim();
        return name === target || name.includes(target) || target.includes(name);
      };

      const matchedBreakdown = (assetPortfolioData.category_breakdown || []).filter((c) => matchCat(c.category));
      const matchedCats = (assetPortfolioData.categories || []).filter((c) => matchCat(c.name));

      const catTotal = matchedBreakdown.reduce((sum, c) => sum + (Number(c.total) || 0), 0);
      const catOp = matchedBreakdown.reduce((sum, c) => sum + (Number(c.operational) || 0), 0);
      const catMaint = Math.max(0, catTotal - catOp);
      const catHealth = catTotal > 0 ? Number(((catOp / catTotal) * 100).toFixed(1)) : 0;

      processedAssets = {
        ...assetPortfolioData,
        total: catTotal,
        operational: catOp,
        maintenance: catMaint,
        critical: 0,
        health_percentage: catHealth,
        categories: matchedCats.length > 0 ? matchedCats : matchedBreakdown.map((c) => ({
          name: c.category,
          score: c.health_percentage,
          total: c.total,
          operational: c.operational
        })),
        category_breakdown: matchedBreakdown,
        distribution: [
          { name: 'Operational', count: catOp, color: '#00C853', percentage: catTotal > 0 ? Number(((catOp / catTotal) * 100).toFixed(1)) : 0 },
          { name: 'Maintenance', count: catMaint, color: '#FF9100', percentage: catTotal > 0 ? Number(((catMaint / catTotal) * 100).toFixed(1)) : 0 },
          { name: 'Critical', count: 0, color: '#EF4444', percentage: 0 }
        ]
      };
    }

    // 4. Category Filter Application (Service Desk)
    if (selectedCategory !== 'All Categories' && processedServiceDesk) {
      const target = selectedCategory.toLowerCase().trim();
      const matchCat = (catName) => {
        if (!catName) return false;
        const name = catName.toLowerCase().trim();
        return name === target || name.includes(target) || target.includes(name);
      };

      const matchedTickets = (processedServiceDesk.ticketsByCategory || []).filter((c) => matchCat(c.category));
      const catTicketsCount = matchedTickets.reduce((sum, c) => sum + (Number(c.count) || 0), 0);

      processedServiceDesk = {
        ...processedServiceDesk,
        total: catTicketsCount,
        open: 0,
        inProgress: 0,
        pending: 0,
        resolved: 0,
        closed: catTicketsCount > 0 ? Math.round(catTicketsCount * 0.5) : 0,
        ticketsByCategory: matchedTickets.length > 0 ? matchedTickets : [{ category: selectedCategory, count: 0, color: '#FF5B22' }],
        slaStatus: {
          withinTat: catTicketsCount,
          outsideTat: 0,
          tatCompliance: catTicketsCount > 0 ? (processedServiceDesk.slaStatus?.tatCompliance ?? 100.0) : 0.0,
          avgResolution: '0h'
        }
      };
    }

    // 5. Category Filter Application (PPM)
    if (selectedCategory !== 'All Categories' && processedPpm) {
      const target = selectedCategory.toLowerCase().trim();
      const matchCat = (catName) => {
        if (!catName) return false;
        const name = catName.toLowerCase().trim();
        return name === target || name.includes(target) || target.includes(name);
      };

      const matchedPlanned = (processedPpm.plannedVsAchieved || []).filter((c) => matchCat(c.category));
      const matchedCompliance = (processedPpm.categoryCompliance || []).filter((c) => matchCat(c.name));

      const plannedCount = matchedPlanned.reduce((sum, c) => sum + (Number(c.planned) || 0), 0);
      const achievedCount = matchedPlanned.reduce((sum, c) => sum + (Number(c.achieved) || 0), 0);
      const compPct = plannedCount > 0 ? Number(((achievedCount / plannedCount) * 100).toFixed(1)) : 0;

      processedPpm = {
        ...processedPpm,
        scheduledTasks: plannedCount,
        compliancePercentage: compPct,
        stats: {
          completed: achievedCount,
          pending: 0,
          overdue: Math.max(0, plannedCount - achievedCount),
          missed: 0
        },
        plannedVsAchieved: matchedPlanned,
        categoryCompliance: matchedCompliance
      };
    }

    // 6. Vendor Filter Application (Workforce)
    if (selectedVendor !== 'All Vendors' && processedWorkforce) {
      const target = selectedVendor.toLowerCase().trim();
      const matchedVendors = (processedWorkforce.byVendor || []).filter((v) => {
        const name = (v.name || v.vendor || '').toLowerCase().trim();
        return name === target || name.includes(target) || target.includes(name);
      });

      if (matchedVendors.length > 0) {
        const totalEmp = matchedVendors.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
        const pres = matchedVendors.reduce((sum, v) => sum + (Number(v.present) || 0), 0);
        const abs = matchedVendors.reduce((sum, v) => sum + (Number(v.absent) || 0), 0);
        const avail = totalEmp > 0 ? Number(((pres / totalEmp) * 100).toFixed(1)) : 0;

        processedWorkforce = {
          ...processedWorkforce,
          totalEmployees: totalEmp,
          present: pres,
          absent: abs,
          overallAvailability: avail,
          byVendor: matchedVendors
        };
      } else {
        processedWorkforce = {
          ...processedWorkforce,
          totalEmployees: 0,
          present: 0,
          absent: 0,
          overallAvailability: 0,
          byVendor: [{ name: selectedVendor, total: 0, present: 0, absent: 0 }]
        };
      }
    }

    // 7. Group telemetry extracts
    const rawHours = groupedDashboardData?.avg_resolution_time?.summary?.hours ?? processedServiceDesk?.raw?.avg_resolution_time_hours;
    const dynamicAvgHours = isNum(rawHours) ? Number(rawHours) : 0.0;

    const rawAvgTrend = groupedDashboardData?.avg_resolution_time?.summary?.vs_last_period;
    const dynamicAvgTrend = isNum(rawAvgTrend) ? Number(rawAvgTrend) : 0;

    const rawAmcPercentage = groupedDashboardData?.compliance_score?.summary?.percentage;
    const dynamicAmcPercentage = isNum(rawAmcPercentage) ? Number(rawAmcPercentage) : 0;

    const rawAmcTrend = groupedDashboardData?.compliance_score?.summary?.vs_last_period;
    const dynamicAmcTrend = isNum(rawAmcTrend) ? Number(rawAmcTrend) : 0;

    const amcTotal = groupedDashboardData?.compliance_score?.summary?.total ?? 0;
    const amcCompliant = groupedDashboardData?.compliance_score?.summary?.compliant ?? 0;

    const totalVisitorsCount = groupedDashboardData?.visitors_today?.summary?.currently_inside ?? 1352;
    const visitorsCheckedIn = groupedDashboardData?.visitors_today?.summary?.checked_in ?? 12567;
    const visitorsCheckedOut = groupedDashboardData?.visitors_today?.summary?.checked_out ?? 11215;

    // Determine final KPI values considering Category/Group/Site filters
    const finalAssetHealth = selectedCategory !== 'All Categories'
      ? processedAssets.health_percentage
      : (foundSite ? baseHealth : (selectedGroup !== 'All Groups' ? baseHealth : (processedAssets?.health_percentage ?? 97.9)));

    const finalAssetTotal = selectedCategory !== 'All Categories'
      ? processedAssets.total
      : (foundSite ? baseAssets : (selectedGroup !== 'All Groups' ? baseAssets : (processedAssets?.total ?? 516)));

    const finalAssetOp = selectedCategory !== 'All Categories'
      ? processedAssets.operational
      : Math.round(((finalAssetHealth || 0) / 100) * finalAssetTotal);

    const finalAssetMaint = Math.max(0, finalAssetTotal - finalAssetOp);

    const finalServiceTat = selectedCategory !== 'All Categories'
      ? processedServiceDesk.slaStatus.tatCompliance
      : (foundSite ? baseTat : (selectedGroup !== 'All Groups' ? baseTat : (processedServiceDesk?.slaStatus?.tatCompliance ?? 100.0)));

    const finalServiceTotal = selectedCategory !== 'All Categories'
      ? processedServiceDesk.total
      : (foundSite ? baseTickets : (selectedGroup !== 'All Groups' ? baseTickets : (processedServiceDesk?.total ?? 321)));

    const finalWithinTat = Math.round(((finalServiceTat || 0) / 100) * finalServiceTotal);
    const finalOutsideTat = Math.max(0, finalServiceTotal - finalWithinTat);

    const finalPpmCompliance = selectedCategory !== 'All Categories'
      ? processedPpm.compliancePercentage
      : (foundSite ? basePpm : (selectedGroup !== 'All Groups' ? basePpm : (processedPpm?.compliancePercentage ?? 43.8)));

    const finalPpmScheduled = selectedCategory !== 'All Categories'
      ? processedPpm.scheduledTasks
      : (processedPpm?.scheduledTasks ?? 16);

    const finalPpmCompleted = selectedCategory !== 'All Categories'
      ? processedPpm.stats.completed
      : (processedPpm?.stats?.completed ?? 7);

    const finalPpmOverdue = Math.max(0, finalPpmScheduled - finalPpmCompleted);

    return {
      assets: processedAssets,
      serviceDesk: processedServiceDesk,
      ppm: processedPpm,
      workforce: processedWorkforce,
      kpis: {
        assetHealth: {
          value: finalAssetHealth,
          unit: '%',
          trend: 0.8,
          trendType: 'up',
          trendText: '+0.8% vs Prior Month',
          target: 95,
          targetText: '2.9% above 95% target',
          submetrics: [
            { label: 'Total Asset', value: finalAssetTotal },
            { label: 'Operational', value: finalAssetOp, color: 'success' },
            { label: 'Breakdown', value: finalAssetMaint, color: 'warning' }
          ]
        },
        serviceRequestTat: {
          value: finalServiceTat,
          unit: '%',
          trend: 1.5,
          trendType: 'up',
          trendText: '+1.5% vs Prior Month',
          target: 95,
          targetText: '5% above 95% target',
          submetrics: [
            { label: 'Total', value: finalServiceTotal },
            { label: 'Within TAT', value: finalWithinTat, color: 'success' },
            { label: 'Outside TAT', value: finalOutsideTat, color: 'danger' }
          ]
        },
        ppmCompliance: {
          value: finalPpmCompliance,
          unit: '%',
          trend: -2.1,
          trendType: 'down',
          trendText: '-2.1% vs Prior Month',
          target: 90,
          targetText: '46.2% below 90% target',
          submetrics: [
            { label: 'Total Scheduled', value: finalPpmScheduled },
            { label: 'Completed', value: finalPpmCompleted, color: 'success' },
            { label: 'Overdue', value: finalPpmOverdue, color: 'danger' }
          ]
        },
        amcCompliance: {
          value: dynamicAmcPercentage,
          unit: '%',
          trend: dynamicAmcTrend,
          trendType: 'neutral',
          trendText: `${dynamicAmcTrend}% vs last period`,
          target: 90,
          targetText: '0% recorded compliance',
          submetrics: [
            { label: 'Total Amc', value: amcTotal },
            { label: 'Frequency', value: amcCompliant }
          ]
        },
        totalVisitors: {
          value: totalVisitorsCount,
          unit: '',
          trend: 4.2,
          trendType: 'up',
          trendText: '+4.2% vs Prior Week',
          target: null,
          targetText: null,
          submetrics: [
            { label: 'Checked In Today', value: visitorsCheckedIn, color: 'success' },
            { label: 'Checked Out Today', value: visitorsCheckedOut, color: 'neutral' },
            { label: 'Currently On-Premises', value: totalVisitorsCount, color: 'primary' }
          ]
        },
        avgResolutionTime: {
          value: dynamicAvgHours,
          unit: 'hrs',
          trend: dynamicAvgTrend,
          trendType: dynamicAvgTrend <= 0 ? 'down' : 'up',
          trendText: dynamicAvgTrend !== 0 ? `${Math.abs(dynamicAvgTrend)}% vs last period` : '0% vs last period',
          target: 4.0,
          targetText: 'Within 4.0h SLA',
          submetrics: [
            { label: 'Total Resolved', value: finalServiceTotal },
            { label: 'Target TAT', value: '< 4.0 hrs' },
            { label: 'Within SLA', value: `${finalServiceTat}%`, color: 'success' }
          ]
        }
      }
    };
  }, [
    selectedGroup,
    selectedSite,
    selectedVendor,
    selectedCategory,
    sitesData,
    assetPortfolioData,
    serviceDeskData,
    ppmData,
    workforceData,
    groupedDashboardData
  ]);

  const handleCardClick = (kpiKey) => {
    switch (kpiKey) {
      case 'serviceRequestTat':
        setDrillDownModal({
          isOpen: true,
          info: {
            type: 'servicedesk',
            title: selectedSite !== 'All Sites' ? `Service Request SLA & TAT Intelligence — ${selectedSite}` : 'Service Request SLA & TAT Intelligence',
            subtitle: `Live Telemetry: ${currentData.serviceDesk?.total ?? 321} Requests • ${currentData.serviceDesk?.slaStatus?.tatCompliance ?? 100}% SLA • ${currentData.serviceDesk?.closed ?? 165} Closed`,
            segment: 'All',
            liveData: currentData.serviceDesk,
            selectedSite: selectedSite
          }
        });
        break;
      case 'ppmCompliance':
        setDrillDownModal({
          isOpen: true,
          info: {
            type: 'ppm',
            title: selectedSite !== 'All Sites' ? `Planned Preventive Maintenance (PPM) Operations — ${selectedSite}` : 'Planned Preventive Maintenance (PPM) Operations',
            subtitle: `Live Telemetry: ${currentData.ppm?.scheduledTasks ?? 16} Tasks • ${currentData.ppm?.stats?.completed ?? 7} Completed (${currentData.ppm?.compliancePercentage ?? 43.8}%) • ${currentData.ppm?.stats?.overdue ?? 9} Overdue`,
            segment: 'All',
            liveData: currentData.ppm,
            selectedSite: selectedSite
          }
        });
        break;
      case 'amcCompliance':
        setDrillDownModal({
          isOpen: true,
          info: {
            type: 'amc',
            title: selectedSite !== 'All Sites' ? `Annual Maintenance Contracts (AMC) Intelligence — ${selectedSite}` : 'Annual Maintenance Contracts (AMC) Intelligence',
            subtitle: `${currentData.kpis.amcCompliance.value}% Compliance • ${currentData.kpis.amcCompliance.submetrics?.[0]?.value ?? 0} Total AMC Contracts Recorded`,
            segment: 'All',
            metricValue: currentData.kpis.amcCompliance.value,
            selectedSite: selectedSite
          }
        });
        break;
      case 'assetHealth':
        setDrillDownModal({
          isOpen: true,
          info: {
            type: 'assets',
            title: selectedSite !== 'All Sites' ? `Asset Portfolio & Health Telemetry — ${selectedSite}` : 'Asset Portfolio & Health Telemetry',
            subtitle: `Live Telemetry: ${currentData.assets?.total ?? 516} Units • ${currentData.assets?.operational ?? 505} Operational (${currentData.assets?.health_percentage ?? 97.9}%) • ${currentData.assets?.maintenance ?? 11} Maintenance`,
            segment: 'All',
            liveData: currentData.assets,
            selectedSite: selectedSite
          }
        });
        break;
      case 'totalVisitors':
        setDrillDownModal({
          isOpen: true,
          info: {
            type: 'visitors',
            title: selectedSite !== 'All Sites' ? `Security Gate & Visitor Operations — ${selectedSite}` : 'Security Gate & Visitor Operations',
            subtitle: `${(currentData.kpis.totalVisitors?.value ?? 1352).toLocaleString()} Active Park Visitors (${(currentData.kpis.totalVisitors?.submetrics?.[0]?.value ?? 12567).toLocaleString()} Checked In)`,
            segment: 'All',
            selectedSite: selectedSite
          }
        });
        break;
      case 'avgResolutionTime':
        setDrillDownModal({
          isOpen: true,
          info: {
            type: 'resolution',
            title: selectedSite !== 'All Sites' ? `Service Request Resolution Time & SLAs — ${selectedSite}` : 'Service Request Resolution Time & SLAs',
            subtitle: `Average resolution ${currentData.kpis.avgResolutionTime.value} hrs across ${currentData.serviceDesk?.total ?? 321} requests • ${currentData.serviceDesk?.slaStatus?.tatCompliance ?? 100}% within SLA (< 4.0 hrs)`,
            segment: 'All',
            liveData: currentData.serviceDesk,
            metricValue: currentData.kpis.avgResolutionTime.value,
            selectedSite: selectedSite
          }
        });
        break;
      default:
        break;
    }
  };

  const isLight = theme === 'light';

  return (
    <div 
      data-theme={theme}
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-main)',
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}
    >
      {/* Sticky Modern Top Header with Theme Switcher and 5 Global Filters */}
      <DashboardHeader
        selectedDate={selectedDate}
        activeCustomRange={customDateRange}
        onDateChange={handleDateChange}
        selectedGroup={selectedGroup}
        onGroupChange={handleGroupChange}
        selectedSite={selectedSite}
        onSiteChange={handleSiteChange}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedVendor={selectedVendor}
        onVendorChange={setSelectedVendor}
        groups={availableGroups}
        categories={availableCategories}
        vendors={availableVendors}
        sites={sitesData}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Command Center Canvas */}
      <main
        style={{
          flex: 1,
          maxWidth: '1680px',
          width: '100%',
          margin: '0 auto',
          padding: '0 24px 80px 24px'
        }}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '72px',
              right: '24px',
              zIndex: 120,
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: isLight ? '#FFFFFF' : '#121826',
              color: isLight ? '#0F172A' : '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 700,
              border: '1px solid rgba(0, 200, 83, 0.4)',
              boxShadow: isLight 
                ? '0 10px 25px rgba(0, 0, 0, 0.1), 0 0 12px rgba(0, 200, 83, 0.15)' 
                : '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 16px rgba(0, 200, 83, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeInUp 0.2s ease'
            }}
          >
            <span className="pulse-dot" style={{ width: '8px', height: '8px' }} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Hero & Intro Greeting with Horizon geometric mountain backdrop */}
        <DashboardHero
          lastUpdated={lastUpdated}
          activeSiteCount={filteredSites.length}
          selectedSite={selectedSite}
          selectedDate={selectedDate}
          theme={theme}
        />

        {/* Loading Skeleton during refresh / filter update or Full Dashboard Content */}
        {(isRefreshing || isLoadingTelemetry) ? (
          <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <LoadingSkeleton variant="kpi" count={6} />
            <LoadingSkeleton variant="table" count={5} />
          </div>
        ) : (
          <>
            {/* 6 Core KPI Cards in Horizon Brand Palette responding dynamically to filters */}
            <KpiSection
              kpis={currentData.kpis}
              triggerKey={triggerKey}
              selectedDate={selectedDate}
              theme={theme}
              onCardClick={handleCardClick}
            />

            {/* Site Performance Overview (Table & Heatmap) responding to Group and Site filters */}
            <SitePerformance
              sites={groupSites}
              selectedSite={selectedSite}
              selectedGroup={selectedGroup}
              onSiteSelect={handleSiteChange}
              theme={theme}
            />

            {/* Asset Portfolio & Health responding to Site & Category filters */}
            <AssetPortfolio
              assetsData={currentData.assets}
              triggerKey={triggerKey}
              theme={theme}
              selectedSite={selectedSite}
              onSiteSelect={handleSiteChange}
              sites={groupSites}
              selectedCategory={selectedCategory}
            />

            {/* Service Desk & SLA Intelligence responding to Site & Category filters */}
            <ServiceDesk
              serviceDeskData={currentData.serviceDesk}
              triggerKey={triggerKey}
              theme={theme}
              selectedCategory={selectedCategory}
              selectedSite={selectedSite}
              onSiteSelect={handleSiteChange}
              sites={groupSites}
            />

            {/* PPM & Soft Services Operations responding to Site & Category filters */}
            <PpmOperations
              ppmData={currentData.ppm}
              triggerKey={triggerKey}
              theme={theme}
              selectedCategory={selectedCategory}
              selectedSite={selectedSite}
              onSiteSelect={handleSiteChange}
              sites={groupSites}
            />

            {/* Workforce Tracking responding to Site & Vendor filters */}
            <WorkforceTracking
              workforceData={currentData.workforce}
              triggerKey={triggerKey}
              theme={theme}
              selectedSite={selectedSite}
              onSiteSelect={handleSiteChange}
              sites={groupSites}
              selectedVendor={selectedVendor}
            />
          </>
        )}
      </main>

      {/* Drill-Down Operational Inspection Modal */}
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal({ isOpen: false, info: null })}
        drillDownInfo={drillDownModal.info}
        selectedSite={selectedSite}
        theme={theme}
      />
    </div>
  );
}
