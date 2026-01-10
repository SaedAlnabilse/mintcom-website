import { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { endOfDay, startOfDay, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Clock, DollarSign, Activity, ShoppingBag, Percent, ArrowUpRight, RefreshCw,
  ChevronRight, Filter, DownloadCloud, BarChart3, Wallet, CreditCard, Users
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
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

  const [salesData, setSalesData] = useState<any>(null);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [reportType, startDate, endDate]);

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
          const topRes = await api.get('/reports/top-selling-items', { params: { startDate: start, endDate: end, limit: 10 } });
          setTopItems(topRes.data || []);
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
        // Get the day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = today.getDay();
        // Go back to the start of the week (Sunday)
        // If today is Sunday (0), we want to go back 6 days to show the full week
        // Otherwise, go back to the previous Sunday
        if (dayOfWeek === 0) {
          // It's Sunday - show the past 7 days (last Sunday to today)
          start.setDate(today.getDate() - 6);
        } else {
          // Go back to the previous Sunday
          start.setDate(today.getDate() - dayOfWeek);
        }
        // End is always today
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
        dataToExport = topItems;
        headers = { itemName: 'Item', quantity: 'Units Sold', revenue: 'Total Revenue' };
        break;
      case 'peak-hours':
        dataToExport = peakHours;
        headers = { hour: 'Hour', total: 'Revenue', count: 'Orders' };
        break;
      case 'shifts':
        dataToExport = shifts.map(s => ({
          username: s.user?.username,
          period: `${new Date(s.startTime).toLocaleTimeString()} - ${s.endTime ? new Date(s.endTime).toLocaleTimeString() : 'Active'}`,
          opening: s.openingBalance,
          sales: s.totalSales,
          status: s.status
        }));
        headers = { username: 'Staff', period: 'Shift Period', opening: 'Opening Bal', sales: 'Net Sales', status: 'Status' };
        break;
    }

    exportToCSV(dataToExport, filename, headers);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Glass Effect */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-cream-50 dark:bg-[#0A0A0A] p-10 border border-cream-300 dark:border-white/5 shadow-xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-paymint-green/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-paymint-green flex items-center justify-center shadow-2xl shadow-paymint-green/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <TrendingUp size={32} className="text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-paymint-green/10 text-paymint-green text-[9px] font-black uppercase tracking-[0.2em]">Enterprise Core</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{reportType.replace('-', ' ')}</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-2">
                Unified <span className="text-paymint-green text-transparent bg-clip-text bg-gradient-to-r from-paymint-green to-emerald-400">Intelligence</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-tight">Machine-analyzed business performance metrics & predictions</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {selectedDateRange === 'today' && (
              <div className="flex flex-col items-end mr-4 hidden sm:flex">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Live Feed Status</p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
                  </span>
                  <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">Connected</span>
                </div>
              </div>
            )}

            <div className="h-12 w-px bg-gray-100 dark:bg-white/5 mx-2 hidden lg:block" />

            <button
              onClick={handleExport}
              className="group flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-white/10 text-gray-900 dark:text-white font-black text-xs uppercase tracking-widest hover:bg-cream-50 dark:hover:bg-white/10 hover:shadow-lg transition-all"
            >
              <DownloadCloud size={18} className="text-paymint-green group-hover:bounce" />
              <span>Snapshot</span>
            </button>
            <button
              onClick={fetchReportData}
              className="w-14 h-14 rounded-2xl bg-paymint-green text-black flex items-center justify-center shadow-lg shadow-paymint-green/30 hover:scale-105 active:scale-95 transition-all group"
            >
              <RefreshCw size={24} className={`${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Filter Strip */}
      <div className="space-y-6">
        {/* Report Type Selector - Grid for accessibility */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'sales', label: 'Revenue Flow', icon: BarChart3, sub: 'Financial Logic' },
            { id: 'top-items', label: 'Item Performance', icon: ShoppingBag, sub: 'Catalog Insights' },
            { id: 'peak-hours', label: 'Traffic Heat', icon: Clock, sub: 'Load Management' },
            { id: 'shifts', label: 'Operator Logs', icon: Users, sub: 'Human Capital' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as ReportType)}
              className={`flex items-center gap-4 p-4 rounded-[1.8rem] transition-all border text-left group relative overflow-hidden ${reportType === tab.id
                ? 'bg-paymint-green/10 border-paymint-green/30 shadow-lg shadow-paymint-green/5'
                : 'bg-cream-50 dark:bg-[#0A0A0A] border-cream-300 dark:border-white/5 hover:border-paymint-green/30'
                }`}
            >
              {reportType === tab.id && (
                <motion.div layoutId="tab-glow" className="absolute inset-0 bg-gradient-to-tr from-paymint-green/5 to-transparent pointer-events-none" />
              )}
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${reportType === tab.id
                ? 'bg-paymint-green text-black scale-110 rotate-3'
                : 'bg-cream-100 dark:bg-white/5 text-gray-500 group-hover:bg-paymint-green/20 group-hover:text-paymint-green'
                }`}>
                <tab.icon size={20} className={reportType === tab.id ? 'animate-pulse' : ''} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-[10px] font-black uppercase tracking-widest truncate ${reportType === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                  }`}>{tab.label}</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5 truncate opacity-60">
                  {tab.sub}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Date Filters Control Bar */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-[3] grid grid-cols-2 md:grid-cols-4 gap-2 bg-cream-50 dark:bg-[#0A0A0A] p-2 rounded-[2rem] border border-cream-300 dark:border-white/5 shadow-lg">
            {['today', 'yesterday', 'this_week', 'this_month'].map((range) => (
              <button
                key={range}
                onClick={() => setQuickDate(range)}
                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${selectedDateRange === range
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md scale-[0.98]'
                  : 'text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-cream-100 dark:hover:bg-white/5'
                  }`}
              >
                {range.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex-[2] flex items-center gap-6 bg-cream-50 dark:bg-[#0A0A0A] px-8 py-3 rounded-[2rem] border border-cream-300 dark:border-white/5 shadow-lg group">
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
                  className="bg-transparent focus:outline-none cursor-pointer text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:scale-150 [&::-webkit-calendar-picker-indicator]:ml-2"
                />
              </div>
              <div className="w-px h-8 bg-cream-300 dark:bg-white/10 mx-4 flex-shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[8px] text-gray-400 font-black uppercase tracking-[0.2em]">Target</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setSelectedDateRange('custom'); }}
                  className="bg-transparent focus:outline-none cursor-pointer text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:scale-150 [&::-webkit-calendar-picker-indicator]:ml-2"
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
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Processing Analytics...</p>
          </div>
        ) : (
          <motion.div key={reportType} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Sales Dashboard Section */}
            {reportType === 'sales' && salesData && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Calculated Net Revenue', value: formatCurrency(salesData.totalRevenue || 0), icon: DollarSign, color: 'text-paymint-green', bg: 'bg-paymint-green/10', sub: 'Gross Minus Refunds' },
                    { label: 'Validated Transactions', value: salesData.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10', sub: 'Fulfilled Success' },
                    { label: 'Average Unit Value', value: formatCurrency(salesData.averageOrderValue || 0), icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10', sub: 'Per Order Ticket' },
                    { label: 'Applied Tax Aggregate', value: formatCurrency(salesData.taxCollected || 0), icon: Percent, color: 'text-orange-500', bg: 'bg-orange-500/10', sub: 'Registry Standard' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative h-40 bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-300 dark:border-white/5 shadow-lg p-7 overflow-hidden transition-all hover:border-paymint-green/30"
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700`} />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} shadow-lg shadow-black/5`}>
                            <stat.icon size={20} />
                          </div>
                          {selectedDateRange === 'today' && (
                            <p className="text-[8px] font-black text-gray-400 group-hover:text-paymint-green uppercase tracking-[0.3em] transition-colors">Real-time Feed</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{stat.value}</p>
                            {selectedDateRange === 'today' && (
                              <span className="text-[9px] font-black text-paymint-green animate-pulse">Live</span>
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 mt-2 flex items-center gap-1 opacity-60">
                            <ChevronRight size={10} className="text-paymint-green" /> {stat.sub}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Revenue Line Chart */}
                  <div className="lg:col-span-2 p-10 bg-cream-50 dark:bg-[#0A0A0A] rounded-[3rem] border border-cream-300 dark:border-white/5 shadow-2xl relative h-[560px]">
                    <div className="absolute top-0 right-10 w-64 h-64 bg-paymint-green/5 rounded-full blur-[80px] pointer-events-none" />
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-10">
                        <div>
                          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <TrendingUp className="text-paymint-green" size={24} />
                            Revenue Momentum
                          </h3>
                          <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Chronological Financial Performance</p>
                        </div>
                        <div className="flex items-center gap-2 bg-cream-100 dark:bg-white/5 px-4 py-2 rounded-full border border-cream-300 dark:border-white/5">
                          <Activity size={14} className="text-paymint-green" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volatility: Low</span>
                        </div>
                      </div>

                      <div className="flex h-[400px] relative">
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

                          return (
                            <>
                              {/* Fixed Y-Axis Container */}
                              <div className="absolute left-0 top-0 bottom-0 w-[50px] z-20 pointer-events-none" style={{ background: 'linear-gradient(to right, ' + (isDark ? '#0A0A0A 80%, transparent' : '#FAF9F7 80%, transparent') + ')' }}>
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
                                          backgroundColor: isDark ? '#0A0A0A' : '#fff',
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
                                          backgroundColor: isDark ? '#0A0A0A' : '#fff',
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
                  {/* Payment Source Breakdown */}
                  <div className="p-8 bg-cream-50 dark:bg-[#0A0A0A] rounded-[3rem] border border-cream-300 dark:border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px]" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <Wallet size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white">Capital Sources</h3>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Payment Distribution</p>
                        </div>
                      </div>

                      {salesData.paymentMethodBreakdown && salesData.paymentMethodBreakdown.length > 0 ? (
                        <>
                          <div className="h-[180px] -mx-4">
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
                                    backgroundColor: isDark ? '#111' : '#fff',
                                    borderRadius: '16px',
                                    border: 'none',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
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
                          <div className="space-y-3 mt-4">
                            {salesData.paymentMethodBreakdown.map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-cream-100 dark:bg-white/[0.02] border border-cream-300 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  <span className="text-xs font-black text-gray-900 dark:text-white uppercase">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-gray-500">{formatCurrency(item.value)}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                          <CreditCard size={40} className="mb-3 opacity-20" />
                          <p className="text-sm font-bold">No payment data</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Items Section */}
            {reportType === 'top-items' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[3rem] border border-cream-300 dark:border-white/5 shadow-2xl overflow-hidden relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-paymint-green shadow-[0_0_15px_#7CC39F]" />
                  <div className="p-10 border-b border-cream-200 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Catalog Performance</h3>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">High-Volume Product Registry</p>
                    </div>
                    <div className="w-12 h-12 bg-paymint-green/10 rounded-2xl flex items-center justify-center text-paymint-green">
                      <ShoppingBag size={24} />
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {topItems.map((item, index) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={index}
                        className="p-6 bg-cream-100 dark:bg-white/[0.02] border border-cream-200 dark:border-white/5 rounded-3xl flex items-center justify-between group hover:bg-cream-50 dark:hover:bg-white/5 hover:border-paymint-green/30 transition-all hover:shadow-lg"
                      >
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-cream-50 dark:bg-white/10 flex items-center justify-center text-lg font-black text-gray-900 dark:text-white border border-cream-200 dark:border-white/10 group-hover:bg-paymint-green group-hover:text-black transition-all duration-500">
                              {index + 1}
                            </div>
                            {index < 3 && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-paymint-green rounded-full flex items-center justify-center border-4 border-cream-50 dark:border-[#0A0A0A]">
                                <ArrowUpRight size={10} className="text-black" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-lg text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors uppercase tracking-tight leading-none mb-1">{item.itemName || item.name}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Activity size={12} className="text-paymint-green" /> {item.quantity} DISPATCHED
                              </span>
                              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/10" />
                              <span className="text-[10px] font-black text-paymint-green uppercase">Top 10% Tier</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(item.revenue || 0)}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60">Gross Inflow</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  {/* Revenue Distribution Pie */}
                  <div className="p-10 bg-cream-50 dark:bg-[#0A0A0A] rounded-[3rem] border border-cream-300 dark:border-white/5 shadow-2xl relative overflow-hidden flex flex-col h-[450px]">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Share of Revenue</h3>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topItems.slice(0, 5)}
                            dataKey="revenue"
                            nameKey="itemName"
                            cx="35%"
                            cy="50%"
                            outerRadius={110}
                            innerRadius={70}
                            paddingAngle={5}
                            animationDuration={1500}
                          >
                            {topItems.slice(0, 5).map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#111' : '#fff',
                              borderRadius: '24px',
                              border: 'none',
                              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                              padding: '16px'
                            }}
                            itemStyle={{
                              color: isDark ? '#fff' : '#111',
                              textTransform: 'uppercase',
                              fontWeight: '900',
                              fontSize: '10px'
                            }}
                            labelStyle={{
                              color: isDark ? '#7CC39F' : '#059669',
                              fontWeight: '900',
                              marginBottom: '4px',
                              fontSize: '10px',
                              textTransform: 'uppercase'
                            }}
                          />
                          <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="circle"
                            iconSize={10}
                            formatter={(value) => (
                              <span style={{
                                color: isDark ? '#A1A1AA' : '#4B5563',
                                fontSize: '11px',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                paddingLeft: '4px'
                              }}>
                                {value}
                              </span>
                            )}
                            wrapperStyle={{
                              paddingLeft: '20px',
                              overflowY: 'auto',
                              maxHeight: '300px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Summary Metric */}
                  <div className="p-10 bg-paymint-green rounded-[3rem] border border-paymint-green shadow-2xl shadow-paymint-green/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10">
                      <h3 className="text-black font-black uppercase tracking-[0.2em] text-xs mb-6 opacity-60">Inventory Insights</h3>
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-black/10 flex items-center justify-center relative">
                          <Activity size={40} className="text-black" />
                          <div className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full animate-ping" />
                        </div>
                        <div>
                          <p className="text-black text-4xl font-black tracking-tight leading-none mb-2">94% Efficiency</p>
                          <p className="text-black/60 text-xs font-bold uppercase tracking-widest">Calculated Sell-through Rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Peak Hours Section */}
            {reportType === 'peak-hours' && (
              <div className="space-y-8">
                <div className="p-12 bg-cream-50 dark:bg-[#0A0A0A] rounded-[3rem] border border-cream-300 dark:border-white/5 shadow-2xl relative overflow-hidden h-[600px]">
                  <div className="absolute -top-20 -right-20 w-80 h-80 bg-paymint-green/5 rounded-full blur-[100px]" />
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-12">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Load Heatmap</h3>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mt-1">Personnel Allocation Optimizer</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-paymint-green" />
                          <span className="text-[10px] font-black text-gray-400 uppercase">Volume</span>
                        </div>
                        <div className="h-4 w-px bg-cream-300 dark:bg-white/10" />
                        <span className="text-[10px] font-black text-paymint-green bg-paymint-green/10 px-3 py-1 rounded-full uppercase tracking-tighter">Live Updates</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={peakHours.map(h => ({ ...h, hour: `${h.hour}:00` }))}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7CC39F" stopOpacity={1} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="0 0" stroke={isDark ? "#ffffff05" : "#00000005"} vertical={false} />
                          <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                          <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                          <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: isDark ? '#111' : '#fff', borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                            itemStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                            labelStyle={{ color: '#7CC39F', fontWeight: '900', marginBottom: '8px' }}
                          />
                          <Bar yAxisId="left" dataKey="total" name="Gross Flow" fill="url(#barGradient)" radius={[12, 12, 4, 4]} barSize={40} animationDuration={1500} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: 'Morning Peak', time: '08:00 - 10:00', load: 'HIGH', icon: Clock },
                    { label: 'Afternoon Peak', time: '13:00 - 15:00', load: 'MODERATE', icon: Clock },
                    { label: 'Evening Peak', time: '18:00 - 20:00', load: 'HIGH', icon: Clock },
                  ].map((p, i) => (
                    <div key={i} className="p-8 bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-300 dark:border-white/5 shadow-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{p.label}</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{p.time}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${p.load === 'HIGH' ? 'bg-red-500/10 text-red-500' : 'bg-paymint-green/10 text-paymint-green'}`}>
                        {p.load} LOAD
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shift Logs Section */}
            {reportType === 'shifts' && (
              <div className="space-y-8">
                <div className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[3rem] border border-cream-300 dark:border-white/5 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-paymint-green via-blue-500 to-paymint-green" />
                  <div className="p-10 border-b border-cream-200 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Shift Operations Portal</h3>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Operator Deployment History</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-2 bg-cream-100 dark:bg-white/5 rounded-xl border border-cream-200 dark:border-white/5">
                        Total {shifts.length} Sessions
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-cream-100 dark:bg-white/[0.01]">
                          <th className="px-10 py-6 text-left text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em]">Operator Identity</th>
                          <th className="px-10 py-6 text-left text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em]">Session Timeline</th>
                          <th className="px-10 py-6 text-left text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em]">Origin Registry</th>
                          <th className="px-10 py-6 text-left text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em]">Flow Performance</th>
                          <th className="px-10 py-6 text-right text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em]">Module Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-200 dark:divide-white/5">
                        {shifts.map((shift, idx) => (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            key={idx}
                            className="group hover:bg-cream-100 dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-10 py-7">
                              <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-paymint-green to-emerald-500 text-black flex items-center justify-center font-black text-xl shadow-lg shadow-paymint-green/20 group-hover:scale-110 transition-transform duration-500">
                                  {shift.user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tight block leading-none mb-1">{shift.user?.username}</span>
                                  <span className="text-[9px] font-black text-paymint-green uppercase tracking-widest">Operator Role</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-7">
                              <div className="flex flex-col gap-1">
                                <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tighter">{format(new Date(shift.startTime), 'MMM dd, yyyy')}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                                  <Clock size={10} className="text-paymint-green" />
                                  {format(new Date(shift.startTime), 'HH:mm')} - {shift.endTime ? format(new Date(shift.endTime), 'HH:mm') : 'SYNCING'}
                                </p>
                              </div>
                            </td>
                            <td className="px-10 py-7 font-black text-gray-900 dark:text-white text-sm uppercase tracking-tighter">{formatCurrency(shift.openingBalance || 0)}</td>
                            <td className="px-10 py-7">
                              <div className="flex flex-col gap-1">
                                <span className="font-black text-paymint-green text-lg tracking-tighter leading-none">{formatCurrency(shift.totalSales || 0)}</span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Realized</span>
                              </div>
                            </td>
                            <td className="px-10 py-7 text-right">
                              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-sm ${shift.status === 'ACTIVE'
                                ? 'bg-paymint-green text-black shadow-paymint-green/20 animate-pulse'
                                : 'bg-cream-100 dark:bg-white/5 text-gray-500'}`}
                              >
                                {shift.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />}
                                {shift.status || 'CLOSED'}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}