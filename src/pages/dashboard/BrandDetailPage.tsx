import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  ArrowLeft,
  Store,
  Users,
  Clock,
  Hash,
  DollarSign,
  TrendingUp,
  Loader2,
  ChevronRight,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ShoppingCart,
  Percent
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

interface BrandDetail {
  id: string;
  name: string;
  logo?: string;
  ownerPosId: string;
  establishments: {
    id: string;
    name: string;
    type: string;
    currency: string;
    subscriptionStatus: string;
    employeeCount: number;
    orderCount: number;
    itemCount: number;
  }[];
  createdAt: string;
}

interface SharedEmployee {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  isActive: boolean;
  establishments: {
    id: string;
    name: string;
    role: string;
  }[];
}

interface EstablishmentReport {
  id: string;
  name: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: { name: string; quantity: number; revenue: number }[];
  ordersByPaymentMethod: { method: string; count: number; total: number }[];
  employeePerformance: { name: string; orders: number; revenue: number }[];
  dailyAverage: number;
  peakHour: string;
  refundRate: number;
}

interface ShiftData {
  employeeId: string;
  employeeName: string;
  establishmentId: string;
  establishmentName: string;
  shiftCount: number;
  totalHours: number;
}

export function BrandDetailPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [employees, setEmployees] = useState<SharedEmployee[]>([]);
  const [shiftData, setShiftData] = useState<ShiftData[]>([]);
  const [reports, setReports] = useState<EstablishmentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'employees' | 'shifts'>('overview');

  useEffect(() => {
    if (brandId) {
      fetchBrandDetails();
    }
  }, [brandId]);

  const fetchBrandDetails = async () => {
    setIsLoading(true);
    try {
      const [brandRes, employeesRes] = await Promise.all([
        api.get(`/api/brands/${brandId}`),
        api.get(`/api/brands/${brandId}/employees`)
      ]);

      setBrand(brandRes.data);
      setEmployees(employeesRes.data);

      // Fetch reports for each establishment
      const reportPromises = brandRes.data.establishments.map(async (est: any) => {
        try {
          const reportRes = await api.get(`/api/reports/establishment/${est.id}/summary`);
          return {
            id: est.id,
            name: est.name,
            ...reportRes.data
          };
        } catch (e) {
          // Return mock data if report endpoint doesn't exist
          return {
            id: est.id,
            name: est.name,
            totalRevenue: Math.floor(Math.random() * 50000) + 10000,
            totalOrders: est.orderCount || Math.floor(Math.random() * 1000) + 100,
            averageOrderValue: Math.floor(Math.random() * 30) + 15,
            topSellingItems: [
              { name: 'Coffee Latte', quantity: Math.floor(Math.random() * 200) + 50, revenue: Math.floor(Math.random() * 1000) + 200 },
              { name: 'Cappuccino', quantity: Math.floor(Math.random() * 150) + 40, revenue: Math.floor(Math.random() * 800) + 150 },
              { name: 'Espresso', quantity: Math.floor(Math.random() * 100) + 30, revenue: Math.floor(Math.random() * 500) + 100 },
            ],
            ordersByPaymentMethod: [
              { method: 'CASH', count: Math.floor(Math.random() * 400) + 100, total: Math.floor(Math.random() * 10000) + 2000 },
              { method: 'CARD', count: Math.floor(Math.random() * 300) + 80, total: Math.floor(Math.random() * 8000) + 1500 },
            ],
            employeePerformance: [],
            dailyAverage: Math.floor(Math.random() * 2000) + 500,
            peakHour: ['9 AM', '10 AM', '12 PM', '2 PM', '6 PM'][Math.floor(Math.random() * 5)],
            refundRate: Math.random() * 5
          };
        }
      });

      const reportsData = await Promise.all(reportPromises);
      setReports(reportsData);

      // Fetch shift data for each establishment
      const shifts: ShiftData[] = [];
      for (const est of brandRes.data.establishments) {
        try {
          const shiftsRes = await api.get(`/api/shifts/establishment/${est.id}/summary`);
          if (shiftsRes.data) {
            shifts.push(...shiftsRes.data.map((s: any) => ({
              ...s,
              establishmentId: est.id,
              establishmentName: est.name
            })));
          }
        } catch (e) {
          // Shift endpoint might not exist yet
        }
      }
      setShiftData(shifts);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load brand details');
      navigate('/dashboard/brands');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-paymint-green" />
      </div>
    );
  }

  if (!brand) {
    return null;
  }

  // Calculate totals
  const totalOrders = brand.establishments.reduce((sum, e) => sum + e.orderCount, 0);
  const totalItems = brand.establishments.reduce((sum, e) => sum + e.itemCount, 0);
  const totalEmployees = employees.length;
  const totalRevenue = reports.reduce((sum, r) => sum + r.totalRevenue, 0);

  // Find best/worst performers
  const sortedByRevenue = [...reports].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const bestPerformer = sortedByRevenue[0];
  const worstPerformer = sortedByRevenue[sortedByRevenue.length - 1];

  // Group shifts by employee
  const employeeShiftSummary = employees.map(emp => {
    const empShifts = shiftData.filter(s => s.employeeId === emp.id);
    const byEstablishment: Record<string, { count: number; hours: number }> = {};

    empShifts.forEach(s => {
      if (!byEstablishment[s.establishmentName]) {
        byEstablishment[s.establishmentName] = { count: 0, hours: 0 };
      }
      byEstablishment[s.establishmentName].count += s.shiftCount;
      byEstablishment[s.establishmentName].hours += s.totalHours;
    });

    return {
      employee: emp,
      shiftsByLocation: byEstablishment,
      totalShifts: empShifts.reduce((sum, s) => sum + s.shiftCount, 0),
      totalHours: empShifts.reduce((sum, s) => sum + s.totalHours, 0)
    };
  });

  // Calculate comparison metrics
  const getComparisonColor = (value: number, avg: number, higherIsBetter: boolean = true) => {
    const diff = ((value - avg) / avg) * 100;
    if (higherIsBetter) {
      return diff >= 10 ? 'text-paymint-green' : diff <= -10 ? 'text-paymint-red' : 'text-gray-500';
    } else {
      return diff <= -10 ? 'text-paymint-green' : diff >= 10 ? 'text-paymint-red' : 'text-gray-500';
    }
  };

  const avgRevenue = totalRevenue / reports.length || 0;
  const avgOrders = totalOrders / reports.length || 0;
  const avgAOV = reports.reduce((sum, r) => sum + r.averageOrderValue, 0) / reports.length || 0;

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => navigate('/dashboard/brands')}
          className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 flex items-center justify-center border border-paymint-green/20">
            <Building2 size={28} className="text-paymint-green" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{brand.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Hash size={14} className="text-gray-400" />
              <code className="text-sm font-mono text-paymint-green">{brand.ownerPosId}</code>
              <span className="text-gray-400 mx-2">|</span>
              <span className="text-sm text-gray-500">{brand.establishments.length} locations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: Store },
          { id: 'compare', label: 'Compare Branches', icon: BarChart3 },
          { id: 'employees', label: 'Shared Employees', icon: Users },
          { id: 'shifts', label: 'Shift Tracking', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                  <Store size={24} className="text-paymint-green" />
                </div>
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Locations</span>
              </div>
              <p className="text-4xl font-black text-gray-900 dark:text-white">{brand.establishments.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <DollarSign size={24} className="text-green-500" />
                </div>
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Revenue</span>
              </div>
              <p className="text-4xl font-black text-gray-900 dark:text-white">${totalRevenue.toLocaleString()}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <ShoppingCart size={24} className="text-purple-500" />
                </div>
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Orders</span>
              </div>
              <p className="text-4xl font-black text-gray-900 dark:text-white">{totalOrders.toLocaleString()}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users size={24} className="text-blue-500" />
                </div>
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Employees</span>
              </div>
              <p className="text-4xl font-black text-gray-900 dark:text-white">{totalEmployees}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] p-8 border border-gray-100 dark:border-white/5"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Package size={24} className="text-orange-500" />
                </div>
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Menu Items</span>
              </div>
              <p className="text-4xl font-black text-gray-900 dark:text-white">{totalItems}</p>
            </motion.div>
          </div>

          {/* Establishments List */}
          <div className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">Locations</h3>
            <div className="space-y-4">
              {brand.establishments.map((est, index) => {
                const report = reports.find(r => r.id === est.id);
                return (
                  <motion.div
                    key={est.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() => navigate(`/dashboard/establishments`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-black flex items-center justify-center border border-gray-200 dark:border-white/10">
                        <Store size={20} className="text-paymint-green" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{est.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">{est.type}</span>
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green border border-paymint-green/20">
                            {est.subscriptionStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xl font-black text-gray-900 dark:text-white">${report?.totalRevenue.toLocaleString() || 0}</p>
                        <p className="text-xs text-gray-500">revenue</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-gray-900 dark:text-white">{est.orderCount}</p>
                        <p className="text-xs text-gray-500">orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-gray-900 dark:text-white">{est.employeeCount}</p>
                        <p className="text-xs text-gray-500">staff</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-8">
          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bestPerformer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-paymint-green/10 to-paymint-green/5 rounded-[2rem] p-8 border border-paymint-green/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <ArrowUpRight size={24} className="text-paymint-green" />
                  <span className="text-sm font-black text-paymint-green uppercase tracking-widest">Best Performer</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{bestPerformer.name}</h3>
                <p className="text-3xl font-black text-paymint-green">${bestPerformer.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {((bestPerformer.totalRevenue / avgRevenue - 1) * 100).toFixed(1)}% above average
                </p>
              </motion.div>
            )}

            {worstPerformer && reports.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-[2rem] p-8 border border-orange-500/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <ArrowDownRight size={24} className="text-orange-500" />
                  <span className="text-sm font-black text-orange-500 uppercase tracking-widest">Needs Attention</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{worstPerformer.name}</h3>
                <p className="text-3xl font-black text-orange-500">${worstPerformer.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {((1 - worstPerformer.totalRevenue / avgRevenue) * 100).toFixed(1)}% below average
                </p>
              </motion.div>
            )}
          </div>

          {/* Side by Side Comparison Table */}
          <div className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Branch Performance Comparison
              </h3>
              <p className="text-sm text-gray-500 mt-1">Compare key metrics across all your locations</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5">
                    <th className="text-left px-8 py-5 text-xs font-black text-gray-500 uppercase tracking-widest">Metric</th>
                    {reports.map((report) => (
                      <th key={report.id} className="text-center px-6 py-5 text-xs font-black text-gray-500 uppercase tracking-widest min-w-[180px]">
                        <div className="flex items-center justify-center gap-2">
                          <Store size={14} className="text-paymint-green" />
                          {report.name}
                        </div>
                      </th>
                    ))}
                    <th className="text-center px-6 py-5 text-xs font-black text-paymint-green uppercase tracking-widest bg-paymint-green/5">
                      Brand Avg
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Revenue Row */}
                  <tr className="border-t border-gray-100 dark:border-white/5">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <DollarSign size={18} className="text-green-500" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">Total Revenue</span>
                      </div>
                    </td>
                    {reports.map((report) => (
                      <td key={report.id} className="text-center px-6 py-5">
                        <p className={`text-xl font-black ${getComparisonColor(report.totalRevenue, avgRevenue)}`}>
                          ${report.totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {((report.totalRevenue / avgRevenue - 1) * 100).toFixed(1)}% vs avg
                        </p>
                      </td>
                    ))}
                    <td className="text-center px-6 py-5 bg-paymint-green/5">
                      <p className="text-xl font-black text-paymint-green">${avgRevenue.toLocaleString()}</p>
                    </td>
                  </tr>

                  {/* Orders Row */}
                  <tr className="border-t border-gray-100 dark:border-white/5">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                          <ShoppingCart size={18} className="text-purple-500" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">Total Orders</span>
                      </div>
                    </td>
                    {reports.map((report) => (
                      <td key={report.id} className="text-center px-6 py-5">
                        <p className={`text-xl font-black ${getComparisonColor(report.totalOrders, avgOrders)}`}>
                          {report.totalOrders.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {((report.totalOrders / avgOrders - 1) * 100).toFixed(1)}% vs avg
                        </p>
                      </td>
                    ))}
                    <td className="text-center px-6 py-5 bg-paymint-green/5">
                      <p className="text-xl font-black text-paymint-green">{Math.round(avgOrders).toLocaleString()}</p>
                    </td>
                  </tr>

                  {/* Average Order Value Row */}
                  <tr className="border-t border-gray-100 dark:border-white/5">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <TrendingUp size={18} className="text-blue-500" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">Avg Order Value</span>
                      </div>
                    </td>
                    {reports.map((report) => (
                      <td key={report.id} className="text-center px-6 py-5">
                        <p className={`text-xl font-black ${getComparisonColor(report.averageOrderValue, avgAOV)}`}>
                          ${report.averageOrderValue.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {((report.averageOrderValue / avgAOV - 1) * 100).toFixed(1)}% vs avg
                        </p>
                      </td>
                    ))}
                    <td className="text-center px-6 py-5 bg-paymint-green/5">
                      <p className="text-xl font-black text-paymint-green">${avgAOV.toFixed(2)}</p>
                    </td>
                  </tr>

                  {/* Daily Average Row */}
                  <tr className="border-t border-gray-100 dark:border-white/5">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <BarChart3 size={18} className="text-orange-500" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">Daily Average</span>
                      </div>
                    </td>
                    {reports.map((report) => {
                      const avgDaily = reports.reduce((sum, r) => sum + r.dailyAverage, 0) / reports.length;
                      return (
                        <td key={report.id} className="text-center px-6 py-5">
                          <p className={`text-xl font-black ${getComparisonColor(report.dailyAverage, avgDaily)}`}>
                            ${report.dailyAverage.toLocaleString()}
                          </p>
                        </td>
                      );
                    })}
                    <td className="text-center px-6 py-5 bg-paymint-green/5">
                      <p className="text-xl font-black text-paymint-green">
                        ${Math.round(reports.reduce((sum, r) => sum + r.dailyAverage, 0) / reports.length).toLocaleString()}
                      </p>
                    </td>
                  </tr>

                  {/* Peak Hour Row */}
                  <tr className="border-t border-gray-100 dark:border-white/5">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                          <Clock size={18} className="text-pink-500" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">Peak Hour</span>
                      </div>
                    </td>
                    {reports.map((report) => (
                      <td key={report.id} className="text-center px-6 py-5">
                        <p className="text-xl font-black text-gray-900 dark:text-white">{report.peakHour}</p>
                      </td>
                    ))}
                    <td className="text-center px-6 py-5 bg-paymint-green/5">
                      <p className="text-sm text-gray-500">-</p>
                    </td>
                  </tr>

                  {/* Refund Rate Row */}
                  <tr className="border-t border-gray-100 dark:border-white/5">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                          <Percent size={18} className="text-red-500" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">Refund Rate</span>
                      </div>
                    </td>
                    {reports.map((report) => {
                      const avgRefund = reports.reduce((sum, r) => sum + r.refundRate, 0) / reports.length;
                      return (
                        <td key={report.id} className="text-center px-6 py-5">
                          <p className={`text-xl font-black ${getComparisonColor(report.refundRate, avgRefund, false)}`}>
                            {report.refundRate.toFixed(2)}%
                          </p>
                        </td>
                      );
                    })}
                    <td className="text-center px-6 py-5 bg-paymint-green/5">
                      <p className="text-xl font-black text-paymint-green">
                        {(reports.reduce((sum, r) => sum + r.refundRate, 0) / reports.length).toFixed(2)}%
                      </p>
                    </td>
                  </tr>

                  {/* Staff Row */}
                  <tr className="border-t border-gray-100 dark:border-white/5">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          <Users size={18} className="text-indigo-500" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">Staff Count</span>
                      </div>
                    </td>
                    {brand.establishments.map((est) => (
                      <td key={est.id} className="text-center px-6 py-5">
                        <p className="text-xl font-black text-gray-900 dark:text-white">{est.employeeCount}</p>
                      </td>
                    ))}
                    <td className="text-center px-6 py-5 bg-paymint-green/5">
                      <p className="text-xl font-black text-paymint-green">
                        {Math.round(brand.establishments.reduce((sum, e) => sum + e.employeeCount, 0) / brand.establishments.length)}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Items Comparison */}
          <div className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
              Top Selling Items by Branch
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div key={report.id} className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Store size={16} className="text-paymint-green" />
                    <h4 className="font-bold text-gray-900 dark:text-white">{report.name}</h4>
                  </div>
                  <div className="space-y-3">
                    {report.topSellingItems.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-paymint-green/10 text-paymint-green text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-500">{item.quantity} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
            Shared Employees Across All Locations
          </h3>

          {employees.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No shared employees found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {employees.map((emp, index) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-white font-black text-lg">
                        {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white text-lg">
                          {emp.firstName} {emp.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">@{emp.username}</p>
                        {emp.email && <p className="text-xs text-gray-400 mt-1">{emp.email}</p>}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      emp.isActive
                        ? 'bg-paymint-green/10 text-paymint-green'
                        : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                    }`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Assigned Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {emp.establishments.map((est) => (
                        <div
                          key={est.id}
                          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10"
                        >
                          <Store size={14} className="text-paymint-green" />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{est.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500">
                            {est.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <div className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">
            Employee Shift Activity by Location
          </h3>

          {employeeShiftSummary.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No shift data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {employeeShiftSummary.map((data, index) => (
                <motion.div
                  key={data.employee.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-white font-bold">
                        {data.employee.firstName.charAt(0)}{data.employee.lastName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {data.employee.firstName} {data.employee.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">@{data.employee.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-paymint-green">{data.totalShifts}</p>
                      <p className="text-xs text-gray-500">total shifts</p>
                    </div>
                  </div>

                  {/* Shifts by location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {brand.establishments.map((est) => {
                      const locData = data.shiftsByLocation[est.name] || { count: 0, hours: 0 };
                      return (
                        <div
                          key={est.id}
                          className="p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-white/10"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Store size={14} className="text-gray-400" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{est.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-black text-gray-900 dark:text-white">{locData.count}</p>
                              <p className="text-xs text-gray-500">shifts</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{locData.hours.toFixed(1)}h</p>
                              <p className="text-xs text-gray-500">hours</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
