import { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { endOfDay, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Clock, Users, Calendar, DollarSign, Activity, FileText, ShoppingBag, Percent, ArrowUpRight, Download, RefreshCw 
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { exportToCSV } from '../../utils/export';

type ReportType = 'sales' | 'top-items' | 'peak-hours' | 'shifts' | 'employees';

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function ReportsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');

  const [salesData, setSalesData] = useState<any>(null);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

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
        case 'employees':
          const empRes = await api.get('/reports/employees', { params: { startDate: start, endDate: end } });
          setEmployees(empRes.data || []);
          break;
      }
    } catch (err: any) {
      toast.error('Failed to load intelligence data');
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
      case 'yesterday': start.setDate(today.getDate() - 1); end.setDate(today.getDate() - 1); break;
      case 'this_week': start.setDate(today.getDate() - today.getDay()); break;
      case 'this_month': start.setDate(1); break;
      case 'last_30': start.setDate(today.getDate() - 30); break;
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
        dataToExport = salesData.dailyBreakdown || [];
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
      case 'employees':
        dataToExport = employees;
        headers = { username: 'Name', role: 'Role', totalOrders: 'Orders', totalSales: 'Sales (JOD)' };
        break;
    }

    exportToCSV(dataToExport, filename, headers);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Business Intelligence</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Advanced reporting and performance analytics suite.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Download size={18} />
            <span>Export Report</span>
          </button>
          <button onClick={fetchReportData} className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-paymint-green/20 hover:text-paymint-green transition-all">
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 rounded-[1.5rem] shadow-md">
          {[
            { id: 'sales', label: 'Sales Overview', icon: DollarSign },
            { id: 'top-items', label: 'Top Products', icon: TrendingUp },
            { id: 'peak-hours', label: 'Hourly Traffic', icon: Clock },
            { id: 'shifts', label: 'Shift Logs', icon: FileText },
            { id: 'employees', label: 'Team Perf.', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as ReportType)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                reportType === tab.id ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="flex bg-white dark:bg-[#0A0A0A] p-1.5 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-md overflow-x-auto">
            {['today', 'yesterday', 'this_week', 'this_month'].map((range) => (
              <button
                key={range}
                onClick={() => setQuickDate(range)}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedDateRange === range ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {range.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-[#0A0A0A] px-5 py-2.5 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-md">
            <Calendar size={18} className="text-paymint-green" />
            <div className="flex items-center gap-2 text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent focus:outline-none" />
              <span className="opacity-30">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent focus:outline-none" />
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
            {reportType === 'sales' && salesData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Net Revenue', value: formatCurrency(salesData.totalRevenue || 0), icon: DollarSign, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
                    { label: 'Transactions', value: salesData.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Avg Basket', value: formatCurrency(salesData.averageOrderValue || 0), icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Tax Total', value: formatCurrency(salesData.taxCollected || 0), icon: Percent, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 bg-white dark:bg-[#0A0A0A] rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-md hover:shadow-lg hover:border-gray-300 dark:hover:border-white/10 transition-all">
                      <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4 ${stat.color}`}>
                        <stat.icon size={20} />
                      </div>
                      <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 p-8 bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-md h-[450px]">
                    <h3 className="font-black text-gray-900 dark:text-white mb-8 flex items-center justify-between">
                      Revenue Trajectory
                      <span className="text-[10px] font-black text-paymint-green uppercase tracking-widest bg-paymint-green/10 px-3 py-1 rounded-full">Growth Trend</span>
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesData.dailyBreakdown || []}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7CC39F" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#7CC39F" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff05" : "#f1f5f9"} vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day:'numeric', month:'short'})} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#0A0A0A' : '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#7CC39F" strokeWidth={4} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-8 bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-md flex flex-col">
                    <h3 className="font-black text-gray-900 dark:text-white mb-8">Settlement Methods</h3>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={salesData.paymentMethodBreakdown || []} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                            {(salesData.paymentMethodBreakdown || []).map((_: any, index: number) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-8 space-y-3">
                      {(salesData.paymentMethodBreakdown || []).map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-xs font-bold text-gray-500 uppercase">{item.name}</span>
                          </div>
                          <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {reportType === 'top-items' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-md overflow-hidden">
                  <div className="p-8 border-b border-gray-100 dark:border-white/5">
                    <h3 className="font-black text-gray-900 dark:text-white">Elite Product Performance</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {topItems.map((item, index) => (
                      <div key={index} className="px-8 py-5 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-transparent flex items-center justify-center text-xs font-black text-gray-600 dark:text-gray-400 group-hover:text-paymint-green group-hover:border-paymint-green/30 transition-colors">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">{item.itemName || item.name}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.quantity} units sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-gray-900 dark:text-white">{formatCurrency(item.revenue || 0)}</p>
                          <div className="flex items-center justify-end gap-1 text-[10px] text-paymint-green font-black uppercase">
                            <ArrowUpRight size={10} /> Market Share
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-md flex flex-col h-[600px]">
                  <h3 className="font-black text-gray-900 dark:text-white mb-8">Market Penetration</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={topItems.slice(0, 5)} dataKey="revenue" nameKey="itemName" cx="50%" cy="50%" outerRadius={120} innerRadius={80} paddingAngle={5}>
                          {topItems.slice(0, 5).map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'peak-hours' && (
              <div className="p-8 bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-md h-[550px]">
                <h3 className="font-black text-gray-900 dark:text-white mb-8">Temporal Demand Density</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHours.map(h => ({...h, hour: `${h.hour}:00`}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff05" : "#f1f5f9"} vertical={false} />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#0A0A0A' : '#fff', borderRadius: '16px', border: 'none' }} />
                    <Bar yAxisId="left" dataKey="total" name="Revenue Volume" fill="#7CC39F" radius={[8, 8, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {(reportType === 'shifts' || reportType === 'employees') && (
              <div className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/5">
                        {reportType === 'shifts' ? (
                          <>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Staff & Station</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Operating Period</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Opening Capital</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Net Performance</th>
                            <th className="px-8 py-6 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Status</th>
                          </>
                        ) : (
                          <>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Team Member</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Role Assignment</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Trans. Vol</th>
                            <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Total Contribution</th>
                            <th className="px-8 py-6 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">State</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {reportType === 'shifts' ? (
                        shifts.map((shift, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black">{shift.user?.username.charAt(0).toUpperCase()}</div>
                                <span className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{shift.user?.username}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <p className="font-bold text-gray-900 dark:text-white text-sm">{new Date(shift.startTime).toLocaleDateString()}</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(shift.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} ONWARD</p>
                            </td>
                            <td className="px-8 py-5 font-bold text-gray-700 dark:text-gray-300 text-sm">{formatCurrency(shift.openingBalance || 0)}</td>
                            <td className="px-8 py-5 font-black text-paymint-green">{formatCurrency(shift.totalSales || 0)}</td>
                            <td className="px-8 py-5 text-right">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${shift.status === 'ACTIVE' ? 'bg-paymint-green text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                                {shift.status || 'CLOSED'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        employees.map((emp, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black">{emp.username.charAt(0).toUpperCase()}</div>
                                <span className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{emp.username}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                                <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest">{emp.role}</span>
                            </td>
                            <td className="px-8 py-5 font-black text-gray-900 dark:text-white">{emp.totalOrders}</td>
                            <td className="px-8 py-5 font-black text-paymint-green">{formatCurrency(emp.totalSales)}</td>
                            <td className="px-8 py-5 text-right">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${emp.isActive ? 'bg-paymint-green text-black' : 'bg-paymint-red text-white'}`}>
                                {emp.isActive ? 'Active' : 'Offline'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}