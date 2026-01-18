import { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { endOfDay, startOfDay, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Clock, Activity, ShoppingBag, ArrowUpRight, RefreshCw,
  Filter, DownloadCloud, ChevronRight, ChevronLeft, BarChart3, Users, Wallet, CreditCard, ExternalLink, Percent, DollarSign
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { PayInPayOutLogModal } from '../../components/dashboard/reports/PayInPayOutLogModal';
import { MultiSelect } from '../../components/MultiSelect';
import { SingleSelect } from '../../components/SingleSelect';
import { exportToCSV } from '../../utils/export';

type ReportType = 'sales' | 'top-items' | 'peak-hours' | 'shifts';

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function ReportsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [showPayInOutModal, setShowPayInOutModal] = useState(false);

  const [salesData, setSalesData] = useState<any>(null);

  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [itemReportData, setItemReportData] = useState<any>(null);
  const [itemReportTab, setItemReportTab] = useState<'items' | 'categories' | 'modifiers'>('items');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter State
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [availableModifiers, setAvailableModifiers] = useState<any[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);

  useEffect(() => {
    if (reportType === 'top-items') {
      fetchFilterOptions();
    }
  }, [reportType]);

  useEffect(() => {
    fetchReportData();
    setCurrentPage(1);
  }, [reportType, startDate, endDate, selectedCategoryId, selectedItemIds, selectedModifierIds, itemReportTab]);



  const fetchFilterOptions = async () => {
    try {
      const [catsRes, itemsRes, attrsRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/items'),
        api.get('/api/attributes')
      ]);

      setAvailableCategories(catsRes.data?.map((c: any) => ({ label: c.name, value: c.id })) || []);
      // Include categoryId for filtering items by category (matching frontend)
      setAvailableItems(itemsRes.data?.map((i: any) => ({ label: i.name, value: i.id, categoryId: i.categoryId })) || []);

      // Flatten sub-attributes for modifiers
      const modifiers = attrsRes.data?.flatMap((attr: any) =>
        attr.subAttributes?.map((sub: any) => ({ label: sub.name, value: sub.id })) || []
      ) || [];
      setAvailableModifiers(modifiers);

    } catch (error) {
      console.error('Failed to load filter options', error);
      toast.error('Failed to load filters');
    }
  };

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const start = startOfDay(new Date(startDate)).toISOString();
      const end = endOfDay(new Date(endDate)).toISOString();

      switch (reportType) {
        case 'sales':
          const salesRes = await api.get('/reports/historical-summary', { params: { startDate: start, endDate: end } });
          setSalesData(salesRes.data);
          break;
        case 'top-items':
          const itemRes = await api.get('/reports/item-report', {
            params: {
              startDate: start,
              endDate: end,
              categoryId: selectedCategoryId || '',
              itemId: selectedItemIds.join(','),
              subAttributeIds: selectedModifierIds.join(',')
            }
          });
          setItemReportData(itemRes.data);
          break;
        case 'peak-hours':
          const peakRes = await api.get('/reports/peak-hours', { params: { startDate: start, endDate: end } });
          setPeakHours(peakRes.data || []);
          break;
        case 'shifts':
          const shiftsRes = await api.get('/reports/shifts', { params: { startDate: start, endDate: end, limit: 20 } });
          setShifts(shiftsRes.data || []);
          break;
      }
    } catch (err: any) {
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'JOD',
    }).format(value).replace('JOD', '').trim() + ' JOD';
  };

  const setQuickDate = (range: string) => {
    setSelectedDateRange(range);
    const today = new Date();
    let start = new Date();
    let end = new Date();
    switch (range) {
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'this_week':
        const dayOfWeek = today.getDay();
        if (dayOfWeek === 0) {
          start.setDate(today.getDate() - 6);
        } else {
          start.setDate(today.getDate() - dayOfWeek);
        }
        end = new Date(today);
        break;
      case 'this_month':
        start.setDate(1);
        end = new Date(today);
        break;
      case 'last_30':
        start.setDate(today.getDate() - 30);
        end = new Date(today);
        break;
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleExport = () => {
    let dataToExport = [];
    let filename = `report_${reportType}`;
    let headers = {};

    switch (reportType) {
      case 'sales':
        dataToExport = salesData?.dailyBreakdown || [];
        headers = { date: 'Date', revenue: 'Revenue (JOD)', count: 'Orders' };
        break;
      case 'top-items':
        dataToExport = itemReportData?.breakdown || [];
        headers = { itemName: 'Item', quantity: 'Units Sold', totalSales: 'Total Revenue' };
        break;
      case 'peak-hours':
        dataToExport = peakHours;
        headers = { hour: 'Hour', total: 'Revenue', count: 'Orders' };
        break;
      case 'shifts':
        dataToExport = shifts.map(s => {
          const start = new Date(s.startTime);
          const end = s.endTime ? new Date(s.endTime) : new Date();
          const hoursWorked = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);
          const cashOverShort = s.discrepancy !== null && s.discrepancy !== undefined
            ? (s.discrepancy > 0.001 ? `+${s.discrepancy.toFixed(3)} Over` : s.discrepancy < -0.001 ? `${s.discrepancy.toFixed(3)} Short` : '0')
            : 'Active';
          return {
            username: s.user?.username,
            period: `${start.toLocaleTimeString()} - ${s.endTime ? end.toLocaleTimeString() : 'Active'}`,
            hoursWorked: hoursWorked,
            opening: s.openingBalance,
            sales: s.totalSales,
            closing: s.closingBalance !== null && s.closingBalance !== undefined ? s.closingBalance : 'Active',
            cashOverShort: cashOverShort,
            status: s.status
          };
        });
        headers = { username: 'Staff', period: 'Shift Period', hoursWorked: 'Hours Worked', opening: 'Opening Bal', sales: 'Net Sales', closing: 'Closing Bal', cashOverShort: 'Cash Over/Short', status: 'Status' };
        break;
    }

    exportToCSV(dataToExport, filename, headers);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-widest border border-paymint-green/20">
              Analytics
            </span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green" />
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Data</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Reports & Analytics</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Business performance metrics & insights</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          >
            <DownloadCloud size={18} className="text-paymint-green" />
            <span>Export</span>
          </button>
          <button
            onClick={fetchReportData}
            className="p-3 rounded-xl bg-paymint-green text-black hover:bg-emerald-400 transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Dynamic Filter Strip */}
      <div className="space-y-6">
        {/* Report Type Selector - Premium Sliding Switcher */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-100 dark:bg-[#0B1120] p-1.5 rounded-2xl border border-gray-200 dark:border-white/[0.03] relative isolate shadow-sm">
          {[
            { id: 'sales', label: 'Revenue Flow', icon: BarChart3, sub: 'Financial Logic' },
            { id: 'top-items', label: 'Item Performance', icon: ShoppingBag, sub: 'Catalog Insights' },
            { id: 'peak-hours', label: 'Traffic Heat', icon: Clock, sub: 'Load Management' },
            { id: 'shifts', label: 'Operator Logs', icon: Users, sub: 'Human Capital' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as ReportType)}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all text-left group relative overflow-hidden ${reportType === tab.id
                ? 'text-black'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {reportType === tab.id && (
                <motion.div
                  layoutId="active-report-tab"
                  className="absolute inset-0 bg-paymint-green rounded-xl -z-10 shadow-sm shadow-paymint-green/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${reportType === tab.id
                ? 'bg-white/20 text-black scale-110'
                : 'bg-gray-50 dark:bg-white/5 text-gray-500 group-hover:bg-paymint-green/20 group-hover:text-paymint-green'
                }`}>
                <tab.icon size={20} className={reportType === tab.id ? 'animate-pulse' : ''} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-[10px] font-black uppercase tracking-widest truncate`}>{tab.label}</span>
                <span className={`text-[8px] font-black uppercase tracking-tighter mt-0.5 truncate ${reportType === tab.id ? 'text-black/60' : 'text-gray-400 opacity-60'
                  }`}>
                  {tab.sub}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Date Filters Control Bar */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-[3] grid grid-cols-2 md:grid-cols-4 gap-2 bg-gray-100 dark:bg-[#0B1120] p-1.5 rounded-2xl border border-gray-200 dark:border-white/[0.03] relative isolate shadow-sm">
            {['today', 'yesterday', 'this_week', 'this_month'].map((range) => (
              <button
                key={range}
                onClick={() => setQuickDate(range)}
                className={`relative py-3 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all duration-300 ${selectedDateRange === range
                  ? 'text-white dark:text-black'
                  : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {selectedDateRange === range && (
                  <motion.div
                    layoutId="active-date-range"
                    className="absolute inset-0 bg-gray-900 dark:bg-white rounded-xl -z-10 shadow-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {range.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex-[2] flex items-center gap-6 bg-white dark:bg-[#0B1120] px-6 py-3 rounded-2xl border border-gray-200 dark:border-white/[0.03] group shadow-sm transition-all hover:border-paymint-green/30">
            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Filter size={18} className="text-paymint-green" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[8px] text-gray-400 font-black uppercase tracking-[0.2em]">Origin</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setSelectedDateRange('custom'); }}
                  className="bg-transparent focus:outline-none cursor-pointer text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tighter dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:scale-150 [&::-webkit-calendar-picker-indicator]:ml-2"
                />
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-white/10 mx-4 flex-shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[8px] text-gray-400 font-black uppercase tracking-[0.2em]">Target</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setSelectedDateRange('custom'); }}
                  className="bg-transparent focus:outline-none cursor-pointer text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tighter dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:scale-150 [&::-webkit-calendar-picker-indicator]:ml-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Processing Analytics...</p>
          </div>
        ) : (
          <motion.div key={reportType} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Sales Dashboard Section */}
            {reportType === 'sales' && salesData && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    const netPayInOut = (salesData.totalPayIn || 0) - (salesData.totalPayOut || 0);

                    return [
                      {
                        label: 'Net Sales',
                        value: (salesData.totalRevenue || 0).toFixed(3),
                        icon: TrendingUp,
                        color: 'text-paymint-green',
                        bg: 'bg-paymint-green/10',
                        sub: 'Gross Minus Refunds'
                      },
                      {
                        label: 'Total Orders',
                        value: (salesData.totalOrders || 0).toString(),
                        suffix: 'ORD',
                        icon: ShoppingBag,
                        color: 'text-indigo-500',
                        bg: 'bg-indigo-500/10',
                        sub: 'Completed Sales'
                      },
                      {
                        label: 'Refunds',
                        value: (salesData.totalRefunds || 0).toFixed(3),
                        icon: RefreshCw,
                        color: 'text-red-500',
                        bg: 'bg-red-500/10',
                        sub: 'Returned Items'
                      },
                      {
                        label: 'Tax Collected',
                        value: (salesData.taxCollected || 0).toFixed(3),
                        icon: Percent,
                        color: 'text-purple-500',
                        bg: 'bg-purple-500/10',
                        sub: 'Accumulated Tax'
                      },
                      {
                        label: 'Gross Profit',
                        value: (salesData.grossProfit || 0).toFixed(3),
                        icon: DollarSign,
                        color: (salesData.grossProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500',
                        bg: (salesData.grossProfit || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
                        sub: 'Sales - Cost - Tax'
                      },
                      {
                        label: 'Time Worked',
                        value: (salesData.totalHoursWorked || 0).toFixed(1),
                        suffix: 'HRS',
                        icon: Clock,
                        color: 'text-orange-500',
                        bg: 'bg-orange-500/10',
                        sub: 'Staff Hours',
                        onClick: () => setReportType('shifts')
                      },
                      {
                        label: 'Pay In / Pay Out',
                        value: (
                          <div className="flex flex-col -mt-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-bold text-paymint-green">+{formatCurrency(salesData.totalPayIn || 0).replace(' JOD', '')}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-bold text-red-500">-{formatCurrency(salesData.totalPayOut || 0).replace(' JOD', '')}</span>
                            </div>
                          </div>
                        ),
                        icon: ArrowUpRight,
                        color: 'text-cyan-500',
                        bg: 'bg-cyan-500/10',
                        sub: `Net Flow: ${formatCurrency(netPayInOut).replace(' JOD', '')}`,
                        onClick: () => setShowPayInOutModal(true)
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={stat.onClick}
                        className={`p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col hover:border-paymint-green/30 transition-all group ${stat.onClick ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <stat.icon size={20} />
                          </div>
                          {stat.onClick && (
                            <ExternalLink size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-paymint-green transition-colors" />
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{stat.label}</p>
                        {typeof stat.value === 'string' ? (
                          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {stat.value}
                            {stat.suffix && <span className="text-sm ml-1 text-gray-300 dark:text-gray-500">{stat.suffix}</span>}
                          </p>
                        ) : (
                          stat.value
                        )}
                        <p className="text-[10px] font-medium text-gray-400 mt-1 opacity-70">
                          {stat.sub}
                        </p>
                      </motion.div>
                    ));
                  })()}
                </div>

                <PayInPayOutLogModal
                  isOpen={showPayInOutModal}
                  onClose={() => setShowPayInOutModal(false)}
                  startDate={startOfDay(new Date(startDate)).toISOString()}
                  endDate={endOfDay(new Date(endDate)).toISOString()}
                />



                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Line Chart */}
                  <div className="lg:col-span-2 p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <TrendingUp className="text-paymint-green" size={20} />
                          Revenue Trend
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Financial performance over time</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <Activity size={12} className="text-paymint-green" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Real-time</span>
                      </div>
                    </div>
                    <div className="h-[300px]">

                      <div className="flex h-full relative">
                        {(() => {
                          const isHourly = salesData.dailyBreakdown?.some((d: any) => d.date.includes(':'));
                          let chartData = salesData.dailyBreakdown || [];

                          // Determine if we need daily aggregation (for week/month views)
                          const needsDailyAggregation = ['this_week', 'this_month', 'last_30'].includes(selectedDateRange) && isHourly;

                          // If it's "Yesterday" and we have hourly data, fill in the missing hours to show a full 24h timeline
                          if (selectedDateRange === 'yesterday' && isHourly) {
                            const allHours = Array.from({ length: 24 }, (_, i) => {
                              const hourStr = `${String(i).padStart(2, '0')}:00`;
                              const existing = chartData.find((d: any) => {
                                // Direct match
                                if (d.date === hourStr) return true;

                                // Parse date string to check hour match
                                const date = new Date(d.date);
                                if (!isNaN(date.getTime())) {
                                  const h = String(date.getHours()).padStart(2, '0');
                                  const m = String(date.getMinutes()).padStart(2, '0');
                                  return `${h}:${m}` === hourStr;
                                }
                                return false;
                              });

                              // Preserve the original date if found (for tooltips), otherwise use hourStr
                              return existing ? { ...existing, date: hourStr } : { date: hourStr, revenue: 0 };
                            });
                            chartData = allHours;
                          }

                          // For week/month views, aggregate hourly data into daily data
                          if (needsDailyAggregation) {
                            const dailyMap: { [key: string]: { date: string; revenue: number; displayDate: string } } = {};

                            chartData.forEach((d: any) => {
                              const dateObj = new Date(d.date);
                              if (!isNaN(dateObj.getTime())) {
                                // Create a day key (YYYY-MM-DD)
                                const dayKey = dateObj.toISOString().split('T')[0];
                                const dayName = format(dateObj, 'EEE'); // Mon, Tue, etc.
                                const fullDate = format(dateObj, 'MMM d'); // Jan 5, etc.

                                if (!dailyMap[dayKey]) {
                                  dailyMap[dayKey] = {
                                    date: dayKey,
                                    revenue: 0,
                                    displayDate: selectedDateRange === 'this_week' ? dayName : fullDate
                                  };
                                }
                                dailyMap[dayKey].revenue += Number(d.revenue) || 0;
                              }
                            });

                            // Sort by date and convert to array
                            chartData = Object.values(dailyMap).sort((a, b) =>
                              new Date(a.date).getTime() - new Date(b.date).getTime()
                            );
                          }

                          const maxRevenue = chartData.length > 0
                            ? Math.max(...chartData.map((d: any) => Number(d.revenue) || 0))
                            : 100;
                          const maxY = maxRevenue > 0 ? maxRevenue : 100;

                          // Check if there's any actual revenue data
                          const hasRevenueData = chartData.length > 0 && chartData.some((d: any) => Number(d.revenue) > 0);

                          if (!hasRevenueData) {
                            return (
                              <div className="h-full w-full flex flex-col items-center justify-center space-y-4 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.03]">
                                <div className="p-5 rounded-full bg-gray-100 dark:bg-white/5">
                                  <Activity size={36} className="text-gray-400 dark:text-gray-600" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">No Revenue Data</p>
                                  <p className="text-xs text-gray-500 mt-1">There are no sales recorded for the selected period.</p>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <>
                              {/* Fixed Y-Axis Container */}
                              <div className="absolute left-0 top-0 bottom-0 w-[50px] z-20 pointer-events-none" style={{ background: 'linear-gradient(to right, ' + (isDark ? '#0B1120 80%, transparent' : '#FAF9F7 80%, transparent') + ')' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={chartData}
                                    margin={{ top: 10, right: 0, left: 0, bottom: 60 }}
                                  >
                                    <YAxis
                                      stroke="#94a3b8"
                                      fontSize={10}
                                      tickLine={false}
                                      axisLine={false}
                                      tickFormatter={(val) => Math.round(val) === val ? val.toString() : val.toFixed(1)}
                                      domain={[0, maxY]}
                                      ticks={[0, maxY / 2, maxY]}
                                      width={40}
                                    />
                                    {/* Dummy Area to force render */}
                                    <Area dataKey="revenue" stroke="none" fill="none" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Scrollable Chart Area */}
                              <div className="flex-1 overflow-x-auto overflow-y-hidden pl-[50px] custom-scrollbar scroll-smooth">
                                {isHourly && !needsDailyAggregation ? (
                                  <div style={{ width: `${Math.max(800, chartData.length * 85)}px`, height: '100%' }}>
                                    <AreaChart
                                      width={Math.max(800, chartData.length * 85)}
                                      height={400}
                                      data={chartData}
                                      margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                                    >
                                      <defs>
                                        <linearGradient id="colorRevenuePremium" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#7CC39F" stopOpacity={0.4} />
                                          <stop offset="60%" stopColor="#7CC39F" stopOpacity={0.1} />
                                          <stop offset="100%" stopColor="#7CC39F" stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="0 0" stroke={isDark ? "#ffffff05" : "#00000005"} vertical={false} />
                                      <XAxis
                                        dataKey="date"
                                        stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={{ stroke: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)", strokeWidth: 1 }}
                                        tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontWeight: '700' }}
                                        tickFormatter={(val) => {
                                          if (val.length === 5 && val.includes(':')) return val; // Already HH:00
                                          const date = new Date(val);
                                          return !isNaN(date.getTime()) ? format(date, 'HH:00') : val;
                                        }}
                                        dy={15}
                                        interval={0}
                                      />
                                      <YAxis hide domain={[0, maxY]} />
                                      <Tooltip
                                        cursor={{ stroke: '#7CC39F', strokeWidth: 2, strokeDasharray: '6 6' }}
                                        contentStyle={{
                                          backgroundColor: isDark ? '#0B1120' : '#fff',
                                          borderRadius: '24px',
                                          border: '1px solid rgba(255,255,255,0.05)',
                                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                          padding: '16px'
                                        }}
                                        itemStyle={{ color: '#7CC39F', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }}
                                        labelStyle={{ fontWeight: '900', color: isDark ? '#fff' : '#000', marginBottom: '8px', fontSize: '10px' }}
                                        labelFormatter={(val) => {
                                          if (val.length === 5 && val.includes(':')) return val;
                                          const date = new Date(val);
                                          return !isNaN(date.getTime()) ? format(date, 'MMM d, HH:00') : val;
                                        }}
                                      />
                                      <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#7CC39F"
                                        strokeWidth={6}
                                        fillOpacity={1}
                                        fill="url(#colorRevenuePremium)"
                                        animationDuration={1500}
                                        strokeLinecap="round"
                                      />
                                    </AreaChart>
                                  </div>
                                ) : (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                      data={chartData}
                                      margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                                    >
                                      <defs>
                                        <linearGradient id="colorRevenuePremium" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#7CC39F" stopOpacity={0.4} />
                                          <stop offset="60%" stopColor="#7CC39F" stopOpacity={0.1} />
                                          <stop offset="100%" stopColor="#7CC39F" stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="0 0" stroke={isDark ? "#ffffff05" : "#00000005"} vertical={false} />
                                      <XAxis
                                        dataKey={needsDailyAggregation ? "displayDate" : "date"}
                                        stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={{ stroke: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)", strokeWidth: 1 }}
                                        tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontWeight: '700' }}
                                        tickFormatter={(val) => {
                                          // If it's already a display value (like "Mon" or "Jan 5"), return as-is
                                          if (needsDailyAggregation) return val;
                                          // Otherwise format the date
                                          const date = new Date(val);
                                          return !isNaN(date.getTime()) ? format(date, 'MMM d') : val;
                                        }}
                                        dy={15}
                                        interval="preserveStartEnd"
                                      />
                                      <YAxis hide domain={[0, maxY]} />
                                      <Tooltip
                                        cursor={{ stroke: '#7CC39F', strokeWidth: 2, strokeDasharray: '6 6' }}
                                        contentStyle={{
                                          backgroundColor: isDark ? '#0B1120' : '#fff',
                                          borderRadius: '24px',
                                          border: '1px solid rgba(255,255,255,0.05)',
                                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                          padding: '16px'
                                        }}
                                        itemStyle={{ color: '#7CC39F', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }}
                                        labelStyle={{ fontWeight: '900', color: isDark ? '#fff' : '#000', marginBottom: '8px', fontSize: '10px' }}
                                        labelFormatter={(val, payload) => {
                                          // For aggregated data, show the full date from the date field
                                          if (needsDailyAggregation && payload && payload[0]) {
                                            const dateStr = payload[0].payload?.date;
                                            if (dateStr) {
                                              const date = new Date(dateStr);
                                              return !isNaN(date.getTime()) ? format(date, 'EEEE, MMM d, yyyy') : val;
                                            }
                                          }
                                          const date = new Date(val);
                                          return !isNaN(date.getTime()) ? format(date, 'MMM d, yyyy') : val;
                                        }}
                                      />
                                      <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#7CC39F"
                                        strokeWidth={6}
                                        fillOpacity={1}
                                        fill="url(#colorRevenuePremium)"
                                        animationDuration={1500}
                                        strokeLinecap="round"
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Payment Source Breakdown */}
                  <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Capital Sources</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Today's Payment Distribution</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">

                      {salesData.paymentMethodBreakdown && salesData.paymentMethodBreakdown.length > 0 ? (
                        <>
                          <div className="h-[160px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={salesData.paymentMethodBreakdown}
                                  innerRadius={50}
                                  outerRadius={80}
                                  paddingAngle={4}
                                  dataKey="value"
                                  animationDuration={1500}
                                  stroke="none"
                                >
                                  {salesData.paymentMethodBreakdown.map((_: any, index: number) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: isDark ? '#0B1120' : '#fff',
                                    borderRadius: '16px',
                                    border: 'none',
                                    padding: '12px'
                                  }}
                                  itemStyle={{
                                    color: isDark ? '#fff' : '#111',
                                    fontWeight: '800',
                                    fontSize: '10px',
                                    textTransform: 'uppercase'
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2 mt-4">
                            {salesData.paymentMethodBreakdown.slice(0, 3).map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">{item.name}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrency(item.value)}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <CreditCard size={32} className="mb-3 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-wide">No payment data</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Item Report Section */}
            {reportType === 'top-items' && itemReportData && (
              <div className="space-y-6">
                {/* Premium Segmented Toggle Switch */}
                <div className="flex justify-center w-full">
                  <div className="flex items-center bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/[0.03] p-1.5 shadow-sm relative isolate overflow-hidden">
                    {/* Sliding Background Pill */}
                    <motion.div
                      className="absolute top-1.5 bottom-1.5 left-1.5 bg-paymint-green rounded-xl shadow-md shadow-paymint-green/20 -z-10"
                      initial={false}
                      animate={{
                        x: itemReportTab === 'items' ? '0%' : itemReportTab === 'modifiers' ? '100%' : '200%' // Simplified logic for 2 tabs, extend for 3
                      }}
                      // Since we only have 2 visible buttons in the previous truncated code, let's stick to 2 for now or restore 3 if needed. 
                      // The original code had 3 tabs but the UI only showed buttons for 'items' and 'modifiers'. 
                      // I'll stick to 'items' and 'modifiers' as they are the primary ones.
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{ width: 'calc(50% - 6px)' }}
                    />

                    <button
                      onClick={() => {
                        setSelectedModifierIds([]);
                        setItemReportTab('items');
                      }}
                      className={`relative flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-colors duration-300 z-10 ${itemReportTab === 'items' ? 'text-black' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                      Products
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategoryId(null);
                        setSelectedItemIds([]);
                        setItemReportTab('modifiers');
                      }}
                      className={`relative flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-colors duration-300 z-10 ${itemReportTab === 'modifiers' ? 'text-black' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                      Add-ons
                    </button>
                  </div>
                </div>

                {/* Filters Container - Clean Card Look */}
                <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-4 shadow-sm">
                  {itemReportTab !== 'modifiers' ? (
                    // Products Mode Filters
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <SingleSelect
                        label="Category"
                        placeholder="All Categories"
                        allOptionLabel="All Categories"
                        options={availableCategories}
                        value={selectedCategoryId}
                        onChange={(val) => {
                          setSelectedCategoryId(val);
                          setSelectedItemIds([]);
                        }}
                        className="w-full"
                      />
                      {/* Items filter - matching disabled state visual */}
                      <div className={`relative transition-opacity duration-300 ${!selectedCategoryId ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <MultiSelect
                          label="Items"
                          placeholder={!selectedCategoryId ? 'Select a category first' : 'All Items'}
                          options={
                            selectedCategoryId
                              ? availableItems.filter((item: any) => item.categoryId === selectedCategoryId)
                              : []
                          }
                          value={selectedItemIds}
                          onChange={setSelectedItemIds}
                        />
                      </div>
                    </div>
                  ) : (
                    // Add-ons Mode Filters
                    <div className="grid grid-cols-1 gap-8">
                      <MultiSelect
                        label="Add-ons / Modifiers"
                        placeholder="All Add-ons"
                        options={availableModifiers}
                        value={selectedModifierIds}
                        onChange={setSelectedModifierIds}
                      />
                    </div>
                  )}
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-white/[0.02]">
                        <tr className="border-b border-gray-200 dark:border-white/5">
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {itemReportTab === 'modifiers' ? 'Add-on Name' : 'Product Name'}
                          </th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Units Sold</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {itemReportData.breakdown && itemReportData.breakdown.length > 0 ? (
                          itemReportData.breakdown
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((item: any, idx: number) => (
                              <motion.tr
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center font-black text-[10px] text-gray-500 border border-gray-200 dark:border-white/5 shadow-sm">
                                      {(currentPage - 1) * itemsPerPage + idx + 1}
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{item.itemName || item.name}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-5 text-right font-bold text-gray-700 dark:text-gray-300">
                                  {item.quantity}
                                </td>
                                <td className="px-8 py-5 text-right font-bold text-paymint-green">
                                  {formatCurrency(item.totalSales || item.revenue)}
                                </td>
                              </motion.tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-20 text-center text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">No transactional data identified for this period</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {itemReportData.breakdown && itemReportData.breakdown.length > itemsPerPage && (
                    <div className="flex items-center justify-between px-8 py-4 border-t border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Page {currentPage} of {Math.ceil(itemReportData.breakdown.length / itemsPerPage)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 transition-all"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(itemReportData.breakdown.length / itemsPerPage), p + 1))}
                          disabled={currentPage === Math.ceil(itemReportData.breakdown.length / itemsPerPage)}
                          className="p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 transition-all"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
            }

            {/* Shifts Report Section */}
            {
              reportType === 'shifts' && (
                <div className="space-y-6">
                  {/* Employee Shift Summary Cards */}
                  {shifts.length > 0 && (() => {
                    // Aggregate shifts by employee
                    const employeeStats = shifts.reduce((acc: any, shift: any) => {
                      const username = shift.user?.username || 'Unknown';
                      if (!acc[username]) {
                        acc[username] = {
                          username,
                          totalShifts: 0,
                          totalSales: 0,
                          totalHours: 0,
                          lastShift: null,
                          lastClosingBalance: null
                        };
                      }
                      acc[username].totalShifts += 1;
                      acc[username].totalSales += shift.totalSales || 0;

                      // Calculate hours worked
                      if (shift.startTime) {
                        const start = new Date(shift.startTime);
                        const end = shift.endTime ? new Date(shift.endTime) : new Date();
                        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        acc[username].totalHours += hours;
                      }

                      // Track last shift for closing balance
                      const shiftDate = new Date(shift.startTime);
                      if (!acc[username].lastShift || shiftDate > new Date(acc[username].lastShift)) {
                        acc[username].lastShift = shift.startTime;
                        acc[username].lastClosingBalance = shift.closingBalance;
                      }

                      return acc;
                    }, {});

                    const employeeList = Object.values(employeeStats);

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {employeeList.map((emp: any, idx: number) => (
                          <motion.div
                            key={emp.username}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-sm">
                                {emp.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{emp.username}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operator</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Shifts</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{emp.totalShifts}</p>
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Hours Worked</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{emp.totalHours.toFixed(1)}<span className="text-sm text-gray-400 ml-0.5">hrs</span></p>
                              </div>
                              <div className="p-3 bg-paymint-green/10 rounded-xl">
                                <p className="text-[9px] font-black text-paymint-green/70 uppercase tracking-widest mb-1">Total Sales</p>
                                <p className="text-lg font-bold text-paymint-green">{formatCurrency(emp.totalSales).replace(' JOD', '')}</p>
                              </div>
                              <div className="p-3 bg-blue-500/10 rounded-xl">
                                <p className="text-[9px] font-black text-blue-500/70 uppercase tracking-widest mb-1">Last Closing</p>
                                <p className="text-lg font-bold text-blue-500">
                                  {emp.lastClosingBalance !== null ? formatCurrency(emp.lastClosingBalance).replace(' JOD', '') : '—'}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Shifts Table */}
                  <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-white/[0.02]">
                          <tr className="border-b border-gray-200 dark:border-white/5">
                            <th className="px-5 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Staff Member</th>
                            <th className="px-5 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift Period</th>
                            <th className="px-5 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Opening Bal</th>
                            <th className="px-5 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Sales</th>
                            <th className="px-5 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Closing Bal</th>
                            <th className="px-5 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Cash Over/Short</th>
                            <th className="px-5 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {shifts.length > 0 ? (
                            shifts.map((shift: any, idx: number) => (
                              <motion.tr
                                key={shift.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="px-5 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-[10px]">
                                      {shift.user?.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{shift.user?.username || 'Unknown'}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-5">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                      {format(new Date(shift.startTime), 'MMM d, HH:mm')}
                                    </span>
                                    <span className="text-[10px] font-medium text-gray-500">
                                      to {shift.endTime ? format(new Date(shift.endTime), 'HH:mm') : 'Present'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-5 text-right font-medium text-gray-500">
                                  {formatCurrency(shift.openingBalance)}
                                </td>
                                <td className="px-5 py-5 text-right font-bold text-paymint-green">
                                  {formatCurrency(shift.totalSales)}
                                </td>
                                <td className="px-5 py-5 text-right">
                                  {shift.status === 'CLOSED' ? (
                                    <span className="font-bold text-blue-500">
                                      {shift.closingBalance !== null && shift.closingBalance !== undefined
                                        ? formatCurrency(shift.closingBalance)
                                        : '—'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</span>
                                  )}
                                </td>
                                <td className="px-5 py-5 text-center">
                                  {shift.status === 'CLOSED' && shift.discrepancy !== null && shift.discrepancy !== undefined ? (
                                    <div className="flex flex-col items-center">
                                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${shift.discrepancy > 0.001
                                        ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                                        : shift.discrepancy < -0.001
                                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                          : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10'
                                        }`}>
                                        {shift.discrepancy > 0.001
                                          ? `+${formatCurrency(shift.discrepancy).replace(' JOD', '')} Over`
                                          : shift.discrepancy < -0.001
                                            ? `${formatCurrency(shift.discrepancy).replace(' JOD', '')} Short`
                                            : '0'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">—</span>
                                  )}
                                </td>
                                <td className="px-5 py-5 text-center">
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${shift.status === 'OPEN'
                                    ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10'
                                    }`}>
                                    {shift.status}
                                  </span>
                                </td>
                              </motion.tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-20 text-center text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">No shift records found in cluster</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            }

            {/* Peak Hours Section */}
            {
              reportType === 'peak-hours' && (
                <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Traffic Heatmap</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hourly distribution</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-[400px]">
                    {peakHours.length > 0 && peakHours.some((h: any) => Number(h.total) > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={peakHours.map((h: any) => ({ ...h, hourFormatted: `${h.hour}:00` }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                              <stop offset="100%" stopColor="#ec4899" stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#ffffff10" : "#00000010"} />
                          <XAxis
                            dataKey="hourFormatted"
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => formatCurrency(val).replace(' JOD', '')}
                          />
                          <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                              backgroundColor: isDark ? '#0B1120' : '#fff',
                              borderRadius: '16px',
                              border: 'none',
                              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                              padding: '12px'
                            }}
                            itemStyle={{ color: '#f97316', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}
                            labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold', marginBottom: '4px', fontSize: '10px' }}
                            formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                          />
                          <Bar dataKey="total" name="Revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center space-y-4 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.03]">
                        <div className="p-5 rounded-full bg-gray-100 dark:bg-white/5">
                          <Clock size={36} className="text-gray-400 dark:text-gray-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">No Traffic Data</p>
                          <p className="text-xs text-gray-500 mt-1">There is no transaction activity recorded for the selected period.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
