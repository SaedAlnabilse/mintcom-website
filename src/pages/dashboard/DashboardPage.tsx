import { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { startOfDay, endOfDay } from 'date-fns';
import api from '../../config/api';
import { OrderDetailModal } from '../../components/OrderDetailModal';

interface DashboardData {
  totalSales: number;
  totalOrders: number;
  revenue: number;
  averageOrderValue: number;
  activeShift: any;
  topSellingItems: any[];
  recentOrders: any[];
  salesByHour: any[];
  paymentMethodBreakdown: any[];
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch Dashboard Summary to get Active Shift
      const dashboardRes = await api.get('/reports/owner-dashboard');
      const ownerData = dashboardRes.data;
      const metrics = ownerData.metrics || {};
      const activeShift = metrics.activeShift;

      // Determine time range from active/last shift
      let startDate = startOfDay(new Date()).toISOString();
      let endDate = endOfDay(new Date()).toISOString();

      if (activeShift && activeShift.startTime) {
        startDate = activeShift.startTime;
        endDate = activeShift.endTime || new Date().toISOString();
      }

      // 2. Fetch details based on shift timing
      const [topItemsRes, ordersRes, peakHoursRes] = await Promise.all([
        api.get('/reports/top-selling-items', {
          params: {
            limit: 5,
            startDate,
            endDate,
          },
        }),
        api.get('/reports/orders-history', {
          params: {
            limit: 5,
            startDate,
            endDate,
          },
        }),
        api.get('/reports/peak-hours', {
          params: {
            startDate,
            endDate,
          },
        }).catch(() => ({ data: [] })),
      ]);

      // Transform peak hours data for chart
      const salesByHour = (peakHoursRes.data || []).map((item: any) => ({
        hour: item.hour,
        sales: item.total || 0,
        orders: item.orders || 0,
      }));

      const paymentMethodBreakdown = [
        { method: 'Cash', total: metrics.cashSales || 0 },
        { method: 'Card', total: metrics.cardSales || 0 },
        { method: 'Other', total: metrics.otherSales || metrics.otherPayments || 0 },
      ].filter((p) => p.total > 0);

      // Map metrics from dashboard summary
      // Note: metrics keys depend on backend implementation. 
      // Based on dashboard.service: netSales, numberOfOrders, etc might be used if totalSales undefined.
      const totalSales = metrics.totalSales ?? metrics.netSales ?? 0;
      const totalOrders = metrics.orderCount ?? metrics.numberOfOrders ?? 0;

      setData({
        totalSales: totalSales,
        totalOrders: totalOrders,
        revenue: totalSales,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
        activeShift: activeShift,
        topSellingItems: topItemsRes.data || [],
        recentOrders: ordersRes.data?.orders || ordersRes.data || [],
        salesByHour,
        paymentMethodBreakdown,
      });

      setError('');
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading && !data) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-green-500 mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Real-time overview of your restaurant</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title="Refresh"
            disabled={isLoading}
          >
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Active Shift Banner */}
      {data?.activeShift && (
        <div className="mb-6 p-4 bg-green-600/20 border border-green-500/50 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <p className="text-white font-medium">Active Shift</p>
              <p className="text-green-300 text-sm">
                Started by {data.activeShift.user?.username || 'Staff'} at{' '}
                {new Date(data.activeShift.startTime).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-semibold">{formatCurrency(data.totalSales || 0)}</p>
            <p className="text-green-300 text-sm">Shift Sales</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Shift Revenue</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(data?.revenue || 0)}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Shift Orders</p>
          <p className="text-2xl font-bold text-white">{data?.totalOrders || 0}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Avg. Order Value</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(data?.averageOrderValue || 0)}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Total Sales</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(data?.totalSales || 0)}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales by Hour Chart */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Sales by Hour</h3>
          <div className="h-64">
            {data?.salesByHour && data.salesByHour.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="sales" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>
          <div className="h-64">
            {data?.paymentMethodBreakdown && data.paymentMethodBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.paymentMethodBreakdown}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {data.paymentMethodBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {data?.topSellingItems && data.topSellingItems.length > 0 ? (
              data.topSellingItems.map((item, index) => (
                <div
                  key={item.itemId || index}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-white font-medium">{item.itemName || item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{item.totalQuantitySold || item.quantity || item.count} sold</p>
                    <p className="text-gray-400 text-sm">{formatCurrency(item.totalRevenue || item.revenue || item.total || 0)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No sales data yet</div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">Order #{order.orderNumber}</p>
                    <p className="text-gray-400 text-sm">
                      {order.items?.length || 0} items • {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{formatCurrency(order.total || 0)}</p>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${order.status === 'COMPLETED'
                        ? 'bg-green-500/20 text-green-400'
                        : order.status === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                        }`}
                    >
                      {order.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No recent orders</div>
            )}
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefundSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
}
