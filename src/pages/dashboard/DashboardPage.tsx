import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  Calendar,
  FileBarChart,
  CreditCard,
  Percent,
  RefreshCw,
  Receipt,
  Wallet,
  Activity,
  Zap,
  PieChart,
  HelpCircle,
  Timer,
  History,
  PlayCircle,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RechartsPie, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subHours } from 'date-fns';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { TourGuide, type TourStep } from '../../components/TourGuide';

// View mode types
type ViewMode = 'current_shift' | 'previous_shift' | 'last_24_hours';

interface ShiftInfo {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  startTime: string;
  endTime?: string;
  autoClose?: boolean;
}

interface ShiftStatus {
  shiftStatus: 'ACTIVE' | 'LAST_SHIFT' | 'NO_SHIFT';
  activeShift: ShiftInfo | null;
  netSales: number;
  numberOfOrders: number;
  cashSales: number;
  cardSales: number;
  otherPayments: number;
  payIn: number;
  payOut: number;
  totalTimeWorked: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  activeEmployees: number;
  taxCollected: number;
  totalRefunds: number;
  grossProfit: number;
  totalPayIn: number;
  totalPayOut: number;
  paymentMethodBreakdown: { name: string; value: number }[];
  categoryBreakdown: { name: string; value: number; count?: number }[];
  dailyBreakdown: { date: string; revenue: number }[];
}

interface TopProduct {
  name: string;
  orders: number;
  revenue: number;
}

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899'];

// Auto-refresh interval: 1 hour in milliseconds
const AUTO_REFRESH_INTERVAL = 60 * 60 * 1000;

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentEstablishment } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);

  // Shift and view mode state
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('last_24_hours');
  const [isViewModeOpen, setIsViewModeOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Ref for click outside handling
  const viewModeRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewModeRef.current && !viewModeRef.current.contains(event.target as Node)) {
        setIsViewModeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-view-mode',
      title: "View Mode Selector",
      description: "Switch between Current Shift, Previous Shift, or Last 24 Hours data view."
    },
    {
      targetId: 'tour-kpi-cards',
      title: "Sales Overview",
      description: "Track your Total Sales, Net Sales, Taxes, and Profit in real-time."
    },
    {
      targetId: 'tour-revenue-chart',
      title: "Sales Trends",
      description: "Monitor sales performance throughout the day to identify peak periods."
    },
    {
      targetId: 'tour-capital-sources',
      title: "Payment Methods",
      description: "See a breakdown of how your customers are paying."
    },
    {
      targetId: 'tour-top-products',
      title: "Top Items",
      description: "Identify your best-selling products."
    },
    {
      targetId: 'tour-quick-actions',
      title: "Quick Navigation",
      description: "Fast access to essential management tools."
    }
  ];

  // Fetch shift status from backend
  const fetchShiftStatus = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/live-shift');
      setShiftStatus(response.data);

      // Auto-select view mode based on shift status
      if (response.data.shiftStatus === 'ACTIVE') {
        // If there's an active shift, default to current shift view
        setViewMode('current_shift');
      } else if (response.data.shiftStatus === 'LAST_SHIFT') {
        // If there's a last shift, default to 24 hours view
        setViewMode('last_24_hours');
      } else {
        // No shifts, show 24 hours data
        setViewMode('last_24_hours');
      }
    } catch (error) {
      console.error('Failed to fetch shift status:', error);
      setShiftStatus(null);
    }
  }, []);

  // Fetch dashboard data based on view mode
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      let start: string;
      let end: string;

      if (viewMode === 'last_24_hours') {
        // Last 24 hours from now
        const now = new Date();
        start = subHours(now, 24).toISOString();
        end = now.toISOString();
      } else if (viewMode === 'current_shift' && shiftStatus?.activeShift) {
        // Current shift data
        start = new Date(shiftStatus.activeShift.startTime).toISOString();
        end = new Date().toISOString();
      } else if (viewMode === 'previous_shift' && shiftStatus?.shiftStatus !== 'NO_SHIFT') {
        // Previous shift - fetch last shift snapshot
        const snapshotRes = await api.get('/dashboard/last-shift-snapshot').catch(() => ({ data: null }));
        if (snapshotRes.data) {
          start = new Date(snapshotRes.data.startTime).toISOString();
          end = new Date(snapshotRes.data.timestamp).toISOString();
        } else {
          // Fallback to last 24 hours
          const now = new Date();
          start = subHours(now, 24).toISOString();
          end = now.toISOString();
        }
      } else {
        // Default to last 24 hours
        const now = new Date();
        start = subHours(now, 24).toISOString();
        end = now.toISOString();
      }

      setLastRefresh(new Date());

      const [summaryRes, topItemsRes, peakRes] = await Promise.all([
        api.get('/reports/historical-summary', { params: { startDate: start, endDate: end } }).catch(() => ({ data: null })),
        api.get('/reports/top-selling-items', { params: { startDate: start, endDate: end, limit: 5 } }).catch(() => ({ data: [] })),
        api.get('/reports/peak-hours', { params: { startDate: start, endDate: end } }).catch(() => ({ data: [] }))
      ]);

      // Process stats
      const summaryData = summaryRes.data || {};
      setStats({
        totalRevenue: summaryData.totalRevenue || 0,
        totalOrders: summaryData.totalOrders || 0,
        averageOrderValue: summaryData.averageOrderValue || 0,
        pendingOrders: summaryData.pendingOrders || 0,
        completedOrders: summaryData.completedOrders || summaryData.totalOrders || 0,
        activeEmployees: summaryData.activeEmployees || 0,
        taxCollected: summaryData.taxCollected || 0,
        totalRefunds: summaryData.totalRefunds || 0,
        grossProfit: summaryData.grossProfit || 0,
        totalPayIn: summaryData.totalPayIn || 0,
        totalPayOut: summaryData.totalPayOut || 0,
        paymentMethodBreakdown: summaryData.paymentMethodBreakdown || [],
        categoryBreakdown: summaryData.categoryBreakdown || [],
        dailyBreakdown: summaryData.dailyBreakdown || []
      });

      // Process top products
      const topItems = topItemsRes.data || [];
      setTopProducts(topItems.map((item: any) => ({
        name: item.itemName || item.name || 'Unknown',
        orders: item.quantity || 0,
        revenue: item.revenue || 0,
      })));

      // Process peak hours
      setPeakHours(peakRes.data || []);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, shiftStatus]);

  // Initial load: fetch shift status first
  useEffect(() => {
    fetchShiftStatus();
  }, [currentEstablishment?.id, fetchShiftStatus]);

  // Fetch dashboard data when view mode or shift status changes
  useEffect(() => {
    if (shiftStatus !== null) {
      fetchDashboardData();
    }
  }, [viewMode, shiftStatus, fetchDashboardData]);

  // Auto-refresh every hour for 24-hour data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchShiftStatus();
      fetchDashboardData();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchShiftStatus, fetchDashboardData]);

  // Get available view modes based on shift status
  const getAvailableViewModes = (): { mode: ViewMode; label: string; icon: React.ReactNode; description: string }[] => {
    const modes: { mode: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [];

    if (shiftStatus?.shiftStatus === 'ACTIVE') {
      modes.push({
        mode: 'current_shift',
        label: 'Current Shift',
        icon: <PlayCircle size={16} />,
        description: `Started ${shiftStatus.activeShift ? format(new Date(shiftStatus.activeShift.startTime), 'h:mm a') : ''}`
      });
    }

    if (shiftStatus?.shiftStatus === 'ACTIVE' || shiftStatus?.shiftStatus === 'LAST_SHIFT') {
      modes.push({
        mode: 'previous_shift',
        label: 'Previous Shift',
        icon: <History size={16} />,
        description: 'Last completed shift'
      });
    }

    modes.push({
      mode: 'last_24_hours',
      label: 'Last 24 Hours',
      icon: <Timer size={16} />,
      description: 'Rolling 24-hour window'
    });

    return modes;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-JO', {
      style: 'currency',
      currency: 'JOD',
      minimumFractionDigits: 3,
    }).format(value);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-paymint-green/20 rounded-full" />
          <div className="w-16 h-16 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <p className="text-sm font-bold text-gray-400 tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }



  // Get current view mode info
  const currentViewModeInfo = getAvailableViewModes().find(m => m.mode === viewMode);

  // Format shift employee name
  const getShiftEmployeeName = () => {
    if (!shiftStatus?.activeShift?.employee) return '';
    const emp = shiftStatus.activeShift.employee;
    return `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 font-inter">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {/* Real Shift Status Badge */}
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border ${shiftStatus?.shiftStatus === 'ACTIVE'
              ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
              : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
              }`}>
              {shiftStatus?.shiftStatus === 'ACTIVE'
                ? `Active Shift - ${getShiftEmployeeName()}`
                : 'No Active Shift'}
            </span>

            {/* Live indicator for active shift */}
            {shiftStatus?.shiftStatus === 'ACTIVE' && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green" />
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wide">LIVE</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{getGreeting()}</h1>
          <div className="flex items-center gap-3 mt-2 text-gray-500 dark:text-gray-400 font-medium text-sm">
            <Calendar size={16} />
            <span>{formatDate()}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
            <span className="text-paymint-green font-bold">{currentEstablishment?.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div id="tour-view-mode" className="relative" ref={viewModeRef}>
            <button
              onClick={() => setIsViewModeOpen(!isViewModeOpen)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all min-w-[180px]"
            >
              {currentViewModeInfo?.icon}
              <span className="flex-1 text-left">{currentViewModeInfo?.label}</span>
              <ChevronDown size={16} className={`transition-transform ${isViewModeOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isViewModeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0B1120] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden z-50"
                >
                  {getAvailableViewModes().map((mode) => (
                    <button
                      key={mode.mode}
                      onClick={() => {
                        setViewMode(mode.mode);
                        setIsViewModeOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${viewMode === mode.mode ? 'bg-paymint-green/10' : ''
                        }`}
                    >
                      <span className={viewMode === mode.mode ? 'text-paymint-green' : 'text-gray-400'}>{mode.icon}</span>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-bold ${viewMode === mode.mode ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>
                          {mode.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{mode.description}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIsTourOpen(true)}
            className="p-3 rounded-xl bg-white dark:bg-white/5 text-gray-400 hover:text-paymint-green border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
            title="Start Tour"
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={() => navigate('/dashboard/reports')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          >
            <FileBarChart size={18} className="text-paymint-green" />
            <span>Reports</span>
          </button>
          <button
            onClick={() => {
              fetchShiftStatus();
              fetchDashboardData();
            }}
            className="p-3 rounded-xl bg-paymint-green text-black hover:bg-emerald-400 transition-all shadow-sm"
            title={`Refresh Data (Last updated: ${format(lastRefresh, 'h:mm a')})`}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* View Mode Info Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          {currentViewModeInfo?.icon && (
            <span className="text-paymint-green">{currentViewModeInfo.icon}</span>
          )}
          <div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {viewMode === 'current_shift' && shiftStatus?.activeShift && (
                <>Showing data since {format(new Date(shiftStatus.activeShift.startTime), 'MMM d, h:mm a')}</>
              )}
              {viewMode === 'previous_shift' && 'Showing data from last completed shift'}
              {viewMode === 'last_24_hours' && 'Showing data from the last 24 hours'}
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
          Updated {format(lastRefresh, 'h:mm a')} • Auto-refresh hourly
        </span>
      </div>

      {/* Primary KPIs */}
      <div id="tour-kpi-cards" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold tracking-wide border border-blue-500/20">
            Overview
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Sales',
              value: formatCurrency((stats?.totalRevenue || 0) + (stats?.taxCollected || 0)),
              sub: 'Including Tax',
              icon: Wallet,
              color: 'text-blue-500',
              bg: 'bg-blue-500/10'
            },
            {
              label: 'Net Sales',
              value: formatCurrency(stats?.totalRevenue || 0),
              sub: 'Excluding Tax',
              icon: DollarSign,
              color: 'text-paymint-green',
              bg: 'bg-paymint-green/10'
            },
            {
              label: 'Profit',
              value: formatCurrency(stats?.grossProfit || 0),
              sub: 'Net Sales - Costs',
              icon: TrendingUp,
              color: 'text-purple-500',
              bg: 'bg-purple-500/10'
            },
            {
              label: 'Tax',
              value: formatCurrency(stats?.taxCollected || 0),
              sub: 'Total Tax',
              icon: Percent,
              color: 'text-orange-500',
              bg: 'bg-orange-500/10'
            },
            {
              label: 'Orders',
              value: stats?.totalOrders?.toString() || '0',
              sub: viewMode === 'current_shift' ? 'This Shift' : viewMode === 'previous_shift' ? 'Previous Shift' : 'Last 24h',
              icon: Receipt,
              color: 'text-indigo-500',
              bg: 'bg-indigo-500/10'
            },
            {
              label: 'Avg Order',
              value: formatCurrency(stats?.averageOrderValue || 0),
              sub: 'Average Value',
              icon: ShoppingBag,
              color: 'text-pink-500',
              bg: 'bg-pink-500/10'
            }
          ].concat(([
            {
              label: 'Refunds',
              value: formatCurrency(stats?.totalRefunds || 0),
              sub: viewMode === 'current_shift' ? 'This Shift' : viewMode === 'previous_shift' ? 'Previous Shift' : 'Last 24h',
              icon: ArrowDownRight,
              color: 'text-orange-500',
              bg: 'bg-orange-500/10'
            },
            {
              label: 'Non Sales',
              value: null, // Custom content
              sub: null,
              icon: ArrowUpRight,
              color: 'text-cyan-500',
              bg: 'bg-cyan-500/10',
              customContent: (
                <div className="space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Pay In</span>
                    <span className="text-sm font-bold text-paymint-green tracking-tight">+{formatCurrency(stats?.totalPayIn || 0)}</span>
                  </div>
                  <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Pay Out</span>
                    <span className="text-sm font-bold text-red-500 tracking-tight">-{formatCurrency(stats?.totalPayOut || 0)}</span>
                  </div>
                </div>
              ),
              onClick: () => navigate('/dashboard/reports', { state: { showPayInOut: true, dateRange: 'today' } })
            }
          ] as any[])).map((stat: any, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={stat.onClick}
              className={`group relative p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${stat.onClick ? 'cursor-pointer' : ''}`}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                    <stat.icon size={20} />
                  </div>
                  {stat.customContent && stat.onClick && (
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-paymint-green transition-colors">
                      <ArrowUpRight size={14} />
                    </div>
                  )}
                </div>

                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 flex items-center gap-1">
                  {stat.label}
                </p>

                {stat.customContent ? (
                  stat.customContent
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                      {stat.sub}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Revenue Chart & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Momentum Chart */}
        <div id="tour-revenue-chart" className="lg:col-span-2 p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="text-paymint-green" size={20} />
                  {viewMode === 'current_shift' ? 'Current Shift Sales' : viewMode === 'previous_shift' ? 'Previous Shift Sales' : 'Sales (Last 24h)'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Hourly sales breakdown</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                <Activity size={12} className="text-paymint-green" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">Real-time</span>
              </div>
            </div>

            <div className="h-[300px]">
              {stats?.dailyBreakdown && stats.dailyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.dailyBreakdown.map((d: any) => ({ ...d, revenue: Number(d.revenue) || 0 }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenueDash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7CC39F" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7CC39F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff10" : "#00000005"} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke={isDark ? "#525252" : "#e5e5e5"}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#9ca3af" }}
                      tickFormatter={(val) => {
                        const date = new Date(val);
                        return val.includes(':') ? format(date, 'HH:00') : format(date, 'MMM d');
                      }}
                      dy={10}
                    />
                    <YAxis
                      hide
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      cursor={{ stroke: '#7CC39F', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{
                        backgroundColor: isDark ? '#0B1120' : '#fff',
                        borderRadius: '12px',
                        border: '1px solid rgba(124, 195, 159, 0.2)',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                        padding: '12px'
                      }}
                      itemStyle={{ color: '#7CC39F', fontWeight: 'bold', fontSize: '12px' }}
                      labelStyle={{ color: isDark ? '#fff' : '#000', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
                      formatter={(val) => [formatCurrency(val as number), 'Revenue']}
                      labelFormatter={(val) => {
                        const date = new Date(val);
                        return val.includes(':') ? format(date, 'MMM d, HH:00') : format(date, 'MMM d, yyyy');
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#7CC39F"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenueDash)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Zap size={32} className="mb-3 opacity-20" />
                  <p className="text-xs font-bold tracking-wide">No revenue data</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div id="tour-capital-sources" className="group relative p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Methods</h3>
                  <p className="text-xs font-bold text-gray-500 tracking-wide">
                    {viewMode === 'current_shift' ? 'This Shift' : viewMode === 'previous_shift' ? 'Previous Shift' : 'Last 24h'} Distribution
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/reports/payments')}
                className="text-xs font-bold text-blue-500 hover:underline tracking-wide"
              >
                View All
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {stats?.paymentMethodBreakdown && stats.paymentMethodBreakdown.length > 0 ? (
                <>
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={stats.paymentMethodBreakdown}
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {stats.paymentMethodBreakdown.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#0B1120' : '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            fontSize: '12px'
                          }}
                          itemStyle={{ color: isDark ? '#fff' : '#111', fontWeight: 'bold' }}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {stats.paymentMethodBreakdown.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <CreditCard size={32} className="mb-3 opacity-20" />
                  <p className="text-xs font-bold tracking-wide">No payment data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Top Products & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div id="tour-top-products" className="group relative bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-40 h-40 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green group-hover:scale-110 transition-transform duration-300">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Your Best Sellers</h3>
                  <p className="text-xs font-bold text-gray-500 tracking-wide">
                    {viewMode === 'current_shift' ? 'This Shift' : viewMode === 'previous_shift' ? 'Previous Shift' : 'Last 24h'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/reports')}
                className="text-xs font-bold text-paymint-green hover:underline tracking-wide"
              >
                View All
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Items Column */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Top 3 Items</h4>
                {topProducts.length > 0 ? topProducts.slice(0, 3).map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between group/item hover:bg-white dark:hover:bg-white/5 hover:border-paymint-green/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-xs font-black text-gray-500 group-hover/item:text-paymint-green transition-colors border border-gray-100 dark:border-white/5">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 dark:text-white group-hover/item:text-paymint-green transition-colors truncate max-w-[120px]">{item.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{item.orders} sold</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.revenue)}
                    </p>
                  </motion.div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
                    <p className="text-xs text-gray-400">No products data</p>
                  </div>
                )}
              </div>

              {/* Top Categories Column */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Top 3 Categories</h4>
                {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? stats.categoryBreakdown.slice(0, 3).map((cat, index) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between group/cat hover:bg-white dark:hover:bg-white/5 hover:border-purple-500/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-xs font-black text-gray-500 group-hover/cat:text-purple-500 transition-colors border border-gray-100 dark:border-white/5">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 dark:text-white group-hover/cat:text-purple-500 transition-colors truncate max-w-[120px]">{cat.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{cat.count || 0} orders</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {formatCurrency(cat.value)}
                    </p>
                  </motion.div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <PieChart className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
                    <p className="text-xs text-gray-400">No category data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="group relative bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-300">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Rush Hours</h3>
                  <p className="text-xs font-bold text-gray-500 tracking-wide">Hourly traffic</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {peakHours.length > 0 && peakHours.some((h: any) => Number(h.total) > 0) ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHours.map(h => ({ ...h, hour: `${h.hour}:00` }))}>
                      <defs>
                        <linearGradient id="barGradientDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7CC39F" stopOpacity={1} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff05" : "#00000005"} vertical={false} />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: isDark ? '#111' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '10px' }}
                        labelStyle={{ color: '#7CC39F', fontWeight: 'bold', marginBottom: '4px', fontSize: '10px' }}
                      />
                      <Bar dataKey="total" name="Revenue" fill="url(#barGradientDash)" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/5">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-black/20">
                    <Clock size={28} className="text-gray-400 dark:text-gray-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">No Traffic Data</p>
                    <p className="text-xs text-gray-500 mt-1">There is no transaction activity recorded.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div id="tour-quick-actions" className="group relative p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-paymint-green/5 via-blue-500/5 to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Links</h3>
            <p className="text-xs font-medium text-gray-500 mt-1">Frequently used</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Products', path: '/dashboard/products', icon: Package },
              { label: 'Orders', path: '/dashboard/orders', icon: ShoppingBag },
              { label: 'Staff', path: '/dashboard/staff', icon: Users },
              { label: 'Reports', path: '/dashboard/reports', icon: FileBarChart },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white font-bold text-xs hover:bg-paymint-green hover:text-black hover:border-paymint-green hover:scale-105 transition-all shadow-sm"
              >
                <action.icon size={16} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tour Guide */}
      <TourGuide
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={() => setIsTourOpen(false)}
      />
    </div>
  );
};
