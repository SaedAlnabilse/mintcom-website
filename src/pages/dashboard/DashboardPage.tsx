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
  Loader2,
  CreditCard,
  Percent,
  RefreshCw,
  Receipt,
  Wallet,
  Activity,
  ChevronRight,
  Zap,
  Target,
  PieChart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RechartsPie, Pie, Cell, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  activeEmployees: number;
  taxCollected: number;
  totalRefunds: number;
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

  useEffect(() => {
    fetchDashboardData();
  }, [currentEstablishment?.id]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch today's sales summary
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = new Date(today).toISOString();
      const endOfDay = new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString();

      const [summaryRes, topItemsRes, peakRes] = await Promise.all([
        api.get('/reports/historical-summary', { params: { startDate: startOfDay, endDate: endOfDay } }).catch(() => ({ data: null })),
        api.get('/reports/top-selling-items', { params: { startDate: startOfDay, endDate: endOfDay, limit: 5 } }).catch(() => ({ data: [] })),
        api.get('/reports/peak-hours', { params: { startDate: startOfDay, endDate: endOfDay } }).catch(() => ({ data: [] }))
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
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ' JOD';
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
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-paymint-green animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }

  // Calculate cash flow
  const netCashFlow = (stats?.totalPayIn || 0) - (stats?.totalPayOut || 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-cream-50 dark:bg-[#0A0A0A] p-10 border border-cream-300 dark:border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-paymint-green/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-paymint-green flex items-center justify-center shadow-2xl shadow-paymint-green/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <Target size={40} className="text-black" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-xl bg-paymint-green/10 text-paymint-green text-[9px] font-black uppercase tracking-[0.2em]">Command Center</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green" />
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{getGreeting()}</h1>
              <div className="flex items-center gap-3 mt-2 text-gray-500 dark:text-gray-400 font-bold text-sm">
                <Calendar size={16} />
                <span>{formatDate()}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                <span className="text-paymint-green">{currentEstablishment?.name || 'Dashboard'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/reports')}
              className="group flex items-center gap-3 px-6 py-4 rounded-2xl bg-cream-100 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-white font-black text-xs uppercase tracking-widest hover:bg-cream-50 dark:hover:bg-white/10 transition-all border border-cream-300 dark:border-white/10 shadow-lg"
            >
              <FileBarChart size={20} className="text-paymint-green" />
              <span>Full Analytics</span>
              <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 -ml-1 transition-opacity" />
            </button>
            <button
              onClick={fetchDashboardData}
              className="w-14 h-14 rounded-2xl bg-paymint-green text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/30 flex items-center justify-center"
            >
              <RefreshCw size={22} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Net Revenue',
            value: formatCurrency(stats?.totalRevenue || 0),
            sub: 'Calculated gross inflow',
            icon: DollarSign,
            color: 'paymint-green',
            pulse: true
          },
          {
            label: 'Transactions',
            value: stats?.totalOrders?.toString() || '0',
            sub: 'Completed orders today',
            icon: Receipt,
            color: 'blue-500',
            pulse: false
          },
          {
            label: 'Avg. Basket',
            value: formatCurrency(stats?.averageOrderValue || 0),
            sub: 'Per transaction average',
            icon: ShoppingBag,
            color: 'purple-500',
            pulse: false
          },
          {
            label: 'Tax Collected',
            value: formatCurrency(stats?.taxCollected || 0),
            sub: 'Accumulated tax total',
            icon: Percent,
            color: 'orange-500',
            pulse: false
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-8 rounded-[2.5rem] bg-cream-50 dark:bg-[#0A0A0A] border border-cream-300 dark:border-white/5 shadow-xl hover:shadow-2xl hover:border-paymint-green/20 transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-${stat.color}/10 flex items-center justify-center text-${stat.color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <stat.icon size={28} />
                </div>
                {stat.pulse && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paymint-green/10">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green" />
                    </span>
                    <span className="text-[9px] font-black text-paymint-green uppercase tracking-tighter">Live</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{stat.value}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-3 flex items-center gap-1 opacity-60">
                <ChevronRight size={10} className="text-paymint-green" /> {stat.sub}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Momentum Chart */}
        <div className="lg:col-span-2 p-10 bg-cream-50 dark:bg-[#0A0A0A] rounded-[3rem] border border-cream-300 dark:border-white/5 shadow-2xl relative">
          <div className="absolute top-0 right-10 w-64 h-64 bg-paymint-green/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  <TrendingUp className="text-paymint-green" size={24} />
                  Today's Revenue Flow
                </h3>
                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Hourly Performance Breakdown</p>
              </div>
              <div className="flex items-center gap-2 bg-cream-100 dark:bg-white/5 px-4 py-2 rounded-full border border-cream-300 dark:border-white/5">
                <Activity size={14} className="text-paymint-green" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time</span>
              </div>
            </div>

            <div className="h-[360px] relative">
              {stats?.dailyBreakdown && stats.dailyBreakdown.length > 0 ? (() => {
                const chartData = stats.dailyBreakdown.map((d: any) => ({ ...d, revenue: Number(d.revenue) || 0 }));
                const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue));
                const maxY = maxRevenue > 0 ? maxRevenue : 100;

                return (
                  <div className="flex h-full relative">
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
                      <div style={{ width: `${Math.max(700, chartData.length * 85)}px`, height: '100%' }}>
                        <AreaChart
                          width={Math.max(700, chartData.length * 85)}
                          height={360}
                          data={chartData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenueDash" x1="0" y1="0" x2="0" y2="1">
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
                            tick={{ fill: "#94a3b8", fontWeight: '700' }}
                            tickFormatter={(val) => {
                              const date = new Date(val);
                              return val.includes(':') ? format(date, 'HH:00') : format(date, 'MMM d');
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
                              const date = new Date(val);
                              return val.includes(':') ? format(date, 'MMM d, HH:00') : format(date, 'MMM d, yyyy');
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#7CC39F"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorRevenueDash)"
                            animationDuration={1500}
                            strokeLinecap="round"
                          />
                        </AreaChart>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Zap size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold">No revenue data yet for today</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
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

            {stats?.paymentMethodBreakdown && stats.paymentMethodBreakdown.length > 0 ? (
              <>
                <div className="h-[180px] -mx-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={stats.paymentMethodBreakdown}
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={1500}
                        stroke="none"
                      >
                        {stats.paymentMethodBreakdown.map((_, index) => (
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
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-4">
                  {stats.paymentMethodBreakdown.map((item, i) => (
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

      {/* Secondary Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cash Flow Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-8 rounded-[2.5rem] border shadow-xl relative overflow-hidden ${netCashFlow >= 0
            ? 'bg-gradient-to-br from-paymint-green/10 to-paymint-green/5 border-paymint-green/20'
            : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${netCashFlow >= 0 ? 'text-paymint-green' : 'text-red-500'}`}>Net Cash Flow</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
              </p>
              <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Pay In - Pay Out Balance</p>
            </div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${netCashFlow >= 0 ? 'bg-paymint-green/20' : 'bg-red-500/20'}`}>
              {netCashFlow >= 0 ? (
                <ArrowUpRight size={32} className="text-paymint-green" />
              ) : (
                <ArrowDownRight size={32} className="text-red-500" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Refunds Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Refunds</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(stats?.totalRefunds || 0)}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Total Returned Value</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <ArrowDownRight size={32} className="text-orange-500" />
            </div>
          </div>
        </motion.div>

        {/* Category Leader Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-purple-500 uppercase tracking-widest mb-2">Top Category</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                {stats?.categoryBreakdown?.[0]?.name || 'No data'}
              </p>
              <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                {stats?.categoryBreakdown?.[0] ? formatCurrency(stats.categoryBreakdown[0].value) : 'Best performer'}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <PieChart size={32} className="text-purple-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Products & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[3rem] border border-cream-300 dark:border-white/5 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-cream-300 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
                <Package size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Top Performers</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Best selling items today</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/reports')}
              className="text-sm font-bold text-paymint-green hover:underline"
            >
              View All
            </button>
          </div>
          <div className="p-6 space-y-4">
            {topProducts.length > 0 ? topProducts.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 rounded-2xl bg-cream-100 dark:bg-white/[0.02] border border-cream-300 dark:border-white/5 flex items-center justify-between group hover:border-paymint-green/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cream-50 dark:bg-white/10 flex items-center justify-center text-lg font-black text-gray-900 dark:text-white border border-cream-300 dark:border-white/10 group-hover:bg-paymint-green group-hover:text-black transition-all">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-black text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.orders} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900 dark:text-white">{formatCurrency(item.revenue)}</p>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No products data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[3rem] border border-cream-300 dark:border-white/5 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-cream-300 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Traffic Heatmap</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hourly order distribution</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {peakHours.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHours.map(h => ({ ...h, hour: `${h.hour}:00` }))}>
                    <defs>
                      <linearGradient id="barGradientDash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7CC39F" stopOpacity={1} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0 0" stroke={isDark ? "#ffffff05" : "#00000005"} vertical={false} />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: isDark ? '#111' : '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                      itemStyle={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}
                      labelStyle={{ color: '#7CC39F', fontWeight: '900', marginBottom: '8px' }}
                    />
                    <Bar dataKey="total" name="Revenue" fill="url(#barGradientDash)" radius={[8, 8, 2, 2]} barSize={24} animationDuration={1500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Clock size={40} className="mb-3 opacity-20" />
                <p className="text-sm font-bold">No traffic data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-8 bg-gradient-to-r from-paymint-green/10 via-blue-500/5 to-purple-500/10 rounded-[3rem] border border-white/10 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Quick Actions</h3>
            <p className="text-sm text-gray-500 mt-1">Jump to frequently used sections</p>
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
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-cream-50 dark:bg-white/10 border border-cream-300 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-paymint-green hover:text-black hover:border-paymint-green transition-all shadow-md"
              >
                <action.icon size={18} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};