import { useState, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RechartsPie, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, startOfDay, endOfDay, isSameDay } from 'date-fns';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { TourGuide, type TourStep } from '../../components/TourGuide';
import { QuickInfo } from '../../components/QuickInfo';

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
  categoryBreakdown: { name: string; value: number }[];
  dailyBreakdown: { date: string; revenue: number }[];
}

interface TopProduct {
  name: string;
  orders: number;
  revenue: number;
}

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899'];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentEstablishment } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);

  // Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);

  const tourSteps: TourStep[] = [
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

  useEffect(() => {
    fetchDashboardData();

    // Check for day change every minute to ensure data resets at midnight
    const checkDayChange = setInterval(() => {
      const lastFetchDate = localStorage.getItem('last_dashboard_fetch');
      if (lastFetchDate && !isSameDay(new Date(lastFetchDate), new Date())) {
        fetchDashboardData();
      }
    }, 60000);

    return () => clearInterval(checkDayChange);
  }, [currentEstablishment?.id]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch today's sales summary using local timezone boundaries
      const start = startOfDay(new Date()).toISOString();
      const end = endOfDay(new Date()).toISOString();

      localStorage.setItem('last_dashboard_fetch', new Date().toISOString());

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
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-JO', {
      style: 'currency',
      currency: 'Jod',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
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

  if (isLoading) {
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

  // Calculate cash flow
  const netCashFlow = (stats?.totalPayIn || 0) - (stats?.totalPayOut || 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black tracking-widest border border-paymint-green/20">
              Live
            </span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green" />
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-widest">Active</span>
            </div>
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
            onClick={fetchDashboardData}
            className="p-3 rounded-xl bg-paymint-green text-black hover:bg-emerald-400 transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div id="tour-kpi-cards" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-[9px] font-black tracking-widest border border-blue-500/20">
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
              sub: "Today",
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
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                    <stat.icon size={20} />
                  </div>
                  <QuickInfo text={stat.sub} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 tracking-wide mb-1 flex items-center gap-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
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
                  Today's Sales
                </h3>
                <p className="text-xs text-gray-500 mt-1">Hourly sales breakdown</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                <Activity size={12} className="text-paymint-green" />
                <span className="text-[10px] font-bold text-gray-500 tracking-wide">Real-time</span>
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Methods</h3>
                <p className="text-[10px] font-bold text-gray-500 tracking-widest">Today's Distribution</p>
              </div>
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

      {/* Secondary Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pay In / Pay Out Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/dashboard/reports', { state: { showPayInOut: true, dateRange: 'today' } })}
          className="p-6 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 w-full">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] font-black tracking-widest text-cyan-600 dark:text-cyan-400">Pay In / Pay Out</p>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                <ArrowUpRight size={20} />
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400">Pay In</span>
                <span className="text-sm font-bold text-paymint-green tracking-tight">+{formatCurrency(stats?.totalPayIn || 0).replace('Jod', '').trim()} Jod</span>
              </div>
              <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400">Pay Out</span>
                <span className="text-sm font-bold text-red-500 tracking-tight">-{formatCurrency(stats?.totalPayOut || 0).replace('Jod', '').trim()} Jod</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200 dark:border-white/10">
              <span className="text-[10px] font-bold text-gray-400">Total</span>
              <span className={`text-sm font-bold ${netCashFlow >= 0 ? 'text-paymint-green' : 'text-red-500'}`}>
                {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow).replace('Jod', '').trim()} Jod
              </span>
            </div>
          </div>
        </motion.div>

        {/* Refunds Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="group relative p-6 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-orange-500 tracking-widest mb-1">Refunds</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.totalRefunds || 0)}</p>
              <p className="text-[10px] font-medium text-gray-400 mt-1">Today's Total</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ArrowDownRight size={20} className="text-orange-500" />
            </div>
          </div>
        </motion.div>

        {/* Category Leader Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="group relative p-6 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-purple-500 tracking-widest mb-1">Top Category</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                {stats?.categoryBreakdown?.[0]?.name || 'No data'}
              </p>
              <p className="text-[10px] font-medium text-gray-400 mt-1">
                {stats?.categoryBreakdown?.[0] ? formatCurrency(stats.categoryBreakdown[0].value) : 'Today'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <PieChart size={20} className="text-purple-500" />
            </div>
          </div>
        </motion.div>
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
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Top Items</h3>
                  <p className="text-[10px] font-bold text-gray-500 tracking-widest">Best sellers today</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/reports')}
                className="text-xs font-bold text-paymint-green hover:underline tracking-wide"
              >
                View All
              </button>
            </div>
            <div className="p-4 space-y-3">
              {topProducts.length > 0 ? topProducts.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between group/item hover:bg-white dark:hover:bg-white/5 hover:border-paymint-green/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-sm font-black text-gray-500 group-hover/item:text-paymint-green transition-colors border border-gray-100 dark:border-white/5">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white group-hover/item:text-paymint-green transition-colors">{item.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{item.orders} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(item.revenue)}</p>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-12">
                  <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-xs font-bold text-gray-500 tracking-wide">No products data</p>
                </div>
              )}
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
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Busy Hours</h3>
                  <p className="text-[10px] font-bold text-gray-500 tracking-widest">Hourly traffic</p>
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
                    <p className="text-xs text-gray-500 mt-1">There is no transaction activity recorded today.</p>
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
