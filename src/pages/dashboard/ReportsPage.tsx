import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { endOfDay, startOfDay } from 'date-fns';
import api from '../../config/api';
import toast from 'react-hot-toast';

type ReportType = 'sales' | 'top-items' | 'peak-hours' | 'shifts' | 'employees';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('week');

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
          const salesRes = await api.get('/reports/historical-summary', {
            params: {
              startDate: start,
              endDate: end
            },
          });
          setSalesData(salesRes.data);
          break;

        case 'top-items':
          const topRes = await api.get('/reports/top-selling-items', {
            params: {
              startDate: start,
              endDate: end,
              limit: 10
            },
          });
          setTopItems(topRes.data || []);
          break;

        case 'peak-hours':
          const peakRes = await api.get('/reports/peak-hours', {
            params: {
              startDate: start,
              endDate: end
            },
          });
          setPeakHours(peakRes.data || []);
          break;

        case 'shifts':
          const shiftsRes = await api.get('/reports/shifts', {
            params: {
              startDate: start,
              endDate: end,
              limit: 20
            },
          });
          setShifts(shiftsRes.data || []);
          break;

        case 'employees':
          const empRes = await api.get('/reports/employees', {
            params: {
              startDate: start,
              endDate: end,
            },
          });
          setEmployees(empRes.data || []);
          break;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'JOD',
      minimumFractionDigits: 2,
    }).format(value).replace('JOD', '').trim() + ' JOD';
  };

  const setQuickDate = (range: string) => {
    setSelectedDateRange(range);
    const today = new Date();
    let start = new Date();

    switch (range) {
      case 'today':
        start = today;
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        today.setDate(today.getDate() - 1);
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(today.getMonth() - 3);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const reportTabs = [
    { id: 'sales', label: 'Sales Summary', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'top-items', label: 'Top Sellers', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'peak-hours', label: 'Peak Hours', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'shifts', label: 'Shift Reports', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'employees', label: 'Employee Performance', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-gray-400 text-sm">Analyze your business performance</p>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as ReportType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${reportType === tab.id
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Range Filters */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {['today', 'yesterday', 'week', 'month', 'quarter'].map((range) => (
              <button
                key={range}
                onClick={() => setQuickDate(range)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${selectedDateRange === range
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
              >
                {range === 'week' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : range === 'quarter' ? 'Last 90 Days' : range}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={fetchReportData}
            className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-green-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <>
          {/* Sales Summary */}
          {reportType === 'sales' && salesData && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(salesData.totalRevenue || 0)}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <p className="text-gray-400 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{salesData.totalOrders || 0}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <p className="text-gray-400 text-sm">Average Order Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(salesData.averageOrderValue || 0)}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <p className="text-gray-400 text-sm">Tax Collected</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(salesData.taxCollected || 0)}</p>
                </div>
              </div>

              {/* Daily Sales Chart */}
              {salesData.dailyBreakdown && (
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Daily Sales Trend</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData.dailyBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `${value} JOD`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                          formatter={(value) => formatCurrency(Number(value))}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Breakdowns Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Methods */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Sales by Payment Method</h3>
                  <div className="h-80">
                    {(!salesData.paymentMethodBreakdown || salesData.paymentMethodBreakdown.length === 0) ? (
                      <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesData.paymentMethodBreakdown}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          >
                            {salesData.paymentMethodBreakdown.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                            formatter={(value) => formatCurrency(Number(value))}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Sales by Category</h3>
                  <div className="h-80">
                    {(!salesData.categoryBreakdown || salesData.categoryBreakdown.length === 0) ? (
                      <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={salesData.categoryBreakdown}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                          <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `${value} JOD`} />
                          <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={12} width={100} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            formatter={(value) => formatCurrency(Number(value))}
                          />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Selling Items */}
          {reportType === 'top-items' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Top 10 Best Sellers</h3>
                <div className="space-y-3">
                  {topItems.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No data available</p>
                  ) : (
                    topItems.map((item, index) => (
                      <div key={item.itemId || index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </span>
                          <span className="text-white font-medium">{item.itemName || item.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{item.quantity || item.count} sold</p>
                          <p className="text-gray-400 text-sm">{formatCurrency(item.revenue || item.total || 0)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Sales Distribution</h3>
                <div className="h-80">
                  {topItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topItems.slice(0, 6)}
                          dataKey="quantity"
                          nameKey="itemName"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name?.slice(0, 10)}... ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {topItems.slice(0, 6).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Peak Hours */}
          {reportType === 'peak-hours' && (
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Sales by Hour</h3>
              <div className="h-80">
                {peakHours.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHours.map((h) => ({ ...h, hour: `${h.hour}:00` }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="total" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="count" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Shifts Report */}
          {reportType === 'shifts' && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Staff</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Start</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">End</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Opening</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Closing</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Sales</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {shifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No shifts found</td>
                    </tr>
                  ) : (
                    shifts.map((shift) => (
                      <tr key={shift.id} className="hover:bg-gray-700/30">
                        <td className="px-6 py-4 text-white">{shift.user?.username || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-300">{new Date(shift.startTime).toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-300">{shift.endTime ? new Date(shift.endTime).toLocaleString() : '-'}</td>
                        <td className="px-6 py-4 text-white">{formatCurrency(shift.openingBalance || 0)}</td>
                        <td className="px-6 py-4 text-white">{formatCurrency(shift.closingBalance || 0)}</td>
                        <td className="px-6 py-4 text-green-400 font-medium">{formatCurrency(shift.totalSales || 0)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded ${shift.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {shift.status || 'Closed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Employee Performance */}
          {reportType === 'employees' && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Employee</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Role</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Total Orders</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Total Sales</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No employee data found</td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-700/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">{emp.username?.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-white font-medium">{emp.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{emp.role}</td>
                        <td className="px-6 py-4 text-white">{emp.totalOrders || 0}</td>
                        <td className="px-6 py-4 text-green-400 font-medium">{formatCurrency(emp.totalSales || 0)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded ${emp.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
