import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { endOfDay, startOfDay, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Clock, Activity, ShoppingBag, ArrowUpRight, RefreshCw,
  DownloadCloud, ChevronRight, ChevronLeft, Wallet, CreditCard, ExternalLink, Percent, DollarSign, PieChart as PieChartIcon, Tag, Scale, ArrowUpDown, Calendar, Search, Users
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { PayInPayOutLogModal } from '../../components/dashboard/reports/PayInPayOutLogModal';
import { ReceiptsReport } from '../../components/dashboard/reports/ReceiptsReport';
import { SingleSelect } from '../../components/SingleSelect';
import { exportToCSV } from '../../utils/export';

type ReportType = 'sales' | 'top-items' | 'top-categories' | 'top-modifiers' | 'peak-hours' | 'shifts' | 'employees' | 'payments' | 'discounts' | 'taxes' | 'receipts';

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function ReportsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { currentEstablishment } = useAuth();
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  const location = useLocation();

  const [reportType, setReportType] = useState<ReportType>('sales');
  const [itemReportTab, setItemReportTab] = useState<'items' | 'categories' | 'modifiers'>('items');

  // Sync URL params with internal state
  useEffect(() => {
    if (type) {
      switch (type) {
        case 'sales':
          setReportType('sales');
          break;
        case 'taxes':
          setReportType('taxes');
          break;
        case 'payments':
          setReportType('payments');
          break;
        case 'discounts':
          setReportType('discounts');
          break;
        case 'items':
          setReportType('top-items');
          setItemReportTab('items');
          break;
        case 'categories':
          setReportType('top-items');
          setItemReportTab('categories');
          break;
        case 'modifiers':
          setReportType('top-items');
          setItemReportTab('modifiers');
          break;
        case 'employees':
        case 'shifts':
          setReportType('shifts');
          break;
        case 'peak-hours':
          setReportType('peak-hours');
          break;
        case 'receipts':
          setReportType('receipts');
          break;
        default:
          setReportType('sales');
      }
    } else {
      setReportType('sales');
    }
  }, [type]);

  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [showPayInOutModal, setShowPayInOutModal] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // New states for advanced filtering
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeShifts, setEmployeeShifts] = useState<any[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const effectiveDateRange = useMemo(() => {
    if (selectedShiftId) {
      const shift = employeeShifts.find(s => s.value === selectedShiftId);
      if (shift) {
        return {
          start: shift.startTime,
          end: shift.endTime || new Date().toISOString()
        };
      }
    }
    return {
      start: new Date(`${startDate}T${startTime}`).toISOString(),
      end: new Date(`${endDate}T${endTime}`).toISOString()
    };
  }, [selectedShiftId, employeeShifts, startDate, endDate, startTime, endTime]);

  useEffect(() => {
    if (location.state?.showPayInOut) {
      setShowPayInOutModal(true);
      if (location.state?.dateRange) {
        setQuickDate(location.state.dateRange);
      }
      // Clear state to prevent reopening on generic re-renders if needed
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [salesData, setSalesData] = useState<any>(null);

  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [itemReportData, setItemReportData] = useState<any>(null);
  // itemReportTab moved up
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const sortedItems = useMemo(() => {
    if (!itemReportData?.breakdown) return [];
    let items = [...itemReportData.breakdown];

    // Apply search filter
    if (itemSearchQuery.trim()) {
      const query = itemSearchQuery.toLowerCase();
      items = items.filter(item => {
        const name = (item.itemName || item.name || '').toLowerCase();
        return name.includes(query);
      });
    }

    if (sortConfig) {
      items.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle fallbacks
        if (sortConfig.key === 'name') {
          aValue = a.itemName || a.name;
          bValue = b.itemName || b.name;
        } else if (sortConfig.key === 'revenue') {
          aValue = a.totalSales || a.revenue;
          bValue = b.totalSales || b.revenue;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [itemReportData, sortConfig, itemSearchQuery]);

  const sortedDiscounts = useMemo(() => {
    if (!salesData?.discountBreakdown) return [];
    let items = [...salesData.discountBreakdown];
    if (sortConfig) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [salesData, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter State - (Simplified version, complex filters removed as unused)

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/reports/employees');
      setEmployees(res.data?.map((u: any) => ({ label: u.name, value: u.id })) || []);
    } catch (error) {
      console.error('Failed to load employees', error);
    }
  };

  useEffect(() => {
    const fetchEmployeeShifts = async () => {
      if (!selectedEmployeeId) {
        setEmployeeShifts([]);
        setSelectedShiftId(null);
        return;
      }
      try {
        const res = await api.get('/reports/shifts', {
          params: {
            employeeId: selectedEmployeeId,
            startDate: startOfDay(new Date(startDate)).toISOString(),
            endDate: endOfDay(new Date(endDate)).toISOString(),
            limit: 50
          }
        });
        setEmployeeShifts(res.data?.map((s: any) => ({
          label: `${format(new Date(s.startTime), 'MMM d, HH:mm')} - ${s.endTime ? format(new Date(s.endTime), 'HH:mm') : 'Active'}`,
          value: s.id,
          startTime: s.startTime,
          endTime: s.endTime
        })) || []);
      } catch (error) {
        console.error('Failed to load employee shifts', error);
      }
    };
    fetchEmployeeShifts();
  }, [selectedEmployeeId, startDate, endDate]);

  useEffect(() => {
    // When a shift is selected, we don't overwrite the global date picker state anymore.
    // Instead, we let fetchReportData use the shift's time dynamically.
    if (selectedShiftId) {
      // Intentionally left blank to preserve "This Month" selection visually
    }
  }, [selectedShiftId, employeeShifts]);

  const [isFetching, setIsFetching] = useState(false);
  const prevReportType = useRef<ReportType>(reportType);

  useEffect(() => {
    // Determine if we need a hard loading state (blocking)
    const isMajorSwitch = prevReportType.current !== reportType;
    // Initial load check
    const hasData =
      (reportType === 'sales' && salesData) ||
      (reportType === 'payments' && salesData) ||
      (reportType === 'discounts' && salesData) ||
      (reportType === 'taxes' && salesData) ||
      (reportType === 'top-items' && itemReportData) ||
      (reportType === 'peak-hours' && peakHours.length > 0) ||
      (reportType === 'shifts' && shifts.length > 0) ||
      (reportType === 'receipts' && true); // Receipts are fetched inside the component

    // If switching report types or no data yet, block UI.
    // Otherwise (filters/sub-tabs), just show fetching indicator.
    if (isMajorSwitch || !hasData) {
      setIsLoading(true);
    }

    fetchReportData();
    setCurrentPage(1);
    prevReportType.current = reportType;
  }, [reportType, startDate, endDate, startTime, endTime, selectedEmployeeId, selectedShiftId, itemReportTab, currentEstablishment]);



  const fetchReportData = async () => {
    try {
      setIsFetching(true);

      const commonParams = {
        startDate: effectiveDateRange.start,
        endDate: effectiveDateRange.end,
        employeeId: selectedEmployeeId || ''
      };

      switch (reportType) {
        case 'sales':
        case 'payments':
        case 'taxes':
          const salesRes = await api.get('/reports/historical-summary', { params: commonParams });
          setSalesData(salesRes.data);
          break;
        case 'discounts':
          const discountRes = await api.get('/reports/discounts', { params: commonParams });
          const rawReports = discountRes.data?.reports;
          const discountReports = Array.isArray(rawReports) ? rawReports.filter((r: any) => r) : [];

          setSalesData({
            totalDiscounts: discountRes.data?.totalDiscountGiven || 0,
            totalDiscountCount: discountReports.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0),
            discountBreakdown: discountReports.map((r: any) => ({
              name: r.name || 'Unknown',
              count: r.count || 0,
              value: r.totalAmount || 0
            }))
          });
          break;
        case 'top-items':
          let endpoint = '/reports/item-report';
          if (itemReportTab === 'categories') {
            endpoint = '/reports/category-report';
          } else if (itemReportTab === 'modifiers') {
            endpoint = '/reports/modifier-report';
          }

          const itemRes = await api.get(endpoint, {
            params: {
              ...commonParams,
              categoryId: '',
              itemId: '',
              subAttributeIds: ''
            }
          });
          setItemReportData(itemRes.data);
          break;
        case 'peak-hours':
          const peakRes = await api.get('/reports/peak-hours', { params: commonParams });
          setPeakHours(peakRes.data || []);
          break;
        case 'shifts':
          const shiftsRes = await api.get('/reports/shifts', { params: { ...commonParams, limit: 20 } });
          setShifts(shiftsRes.data || []);
          break;
      }
    } catch (err: any) {
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(3) + ' JOD';
  };

  const setQuickDate = (range: string) => {
    setSelectedDateRange(range);
    setSelectedShiftId(null);
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
    setStartTime('00:00');
    setEndTime('23:59');
  };

  const handleExport = () => {
    let dataToExport = [];
    let filename = `report_${reportType}`;
    let headers = {};

    switch (reportType) {
      case 'sales':
      case 'payments':
      case 'discounts':
      case 'taxes':
        dataToExport = salesData?.dailyBreakdown || [];
        headers = { date: 'Date', revenue: 'Revenue (Jod)', count: 'Orders' };
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
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black tracking-widest border border-paymint-green/20">
              Sales and Reporting
            </span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green" />
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-widest">Live</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Sales and Reporting</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Tracking All Business Performance</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          >
            <DownloadCloud size={18} className="text-paymint-green" />
            <span>Export to CSV</span>
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
      <div className="space-y-2">
        {/* Report Type Selector */}
        <div className="flex w-full gap-2">
          {[
            { id: 'sales', label: 'Overview', icon: TrendingUp },
            { id: 'items-categories', label: 'Items + Categories', icon: ShoppingBag },
            { id: 'addons', label: 'Add-ons', icon: Tag },
            { id: 'employees', label: 'Staff Sales', icon: Activity },
            { id: 'shifts', label: 'Shifts', icon: Clock },
            { id: 'discounts', label: 'Discounts', icon: Percent },
            { id: 'payments', label: 'Payments', icon: CreditCard },
          ].map((type) => {
            const isSelected = type.id === 'items-categories'
              ? (reportType === 'top-items' && (itemReportTab === 'items' || itemReportTab === 'categories'))
              : type.id === 'addons'
                ? (reportType === 'top-items' && itemReportTab === 'modifiers')
                : reportType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => {
                  // Navigate to the appropriate route so sidebar stays in sync
                  if (type.id === 'items-categories') {
                    navigate('/dashboard/reports/items');
                  } else if (type.id === 'addons') {
                    navigate('/dashboard/reports/modifiers');
                  } else {
                    navigate(`/dashboard/reports/${type.id}`);
                  }
                }}
                className={`relative flex-1 flex flex-col xl:flex-row items-center justify-center gap-1.5 xl:gap-2 px-1 py-2.5 xl:py-3 rounded-xl transition-all duration-300 isolate min-w-0 ${isSelected
                  ? 'text-black shadow-lg shadow-paymint-green/20'
                  : 'bg-white dark:bg-[#0B1120] text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-100 dark:border-white/[0.05]'
                  }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="active-report-tab"
                    className="absolute inset-0 bg-[#7CC39F] rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="flex items-center justify-center relative z-10">
                  <type.icon size={14} className={isSelected ? 'text-black' : 'text-gray-400'} />
                </div>
                <span className="text-[10px] font-black tracking-wide truncate relative z-10">{type.label}</span>
              </button>
            );
          })}
        </div>        {/* Unified Filter Dashboard */}
        {/* Unified Filter Control Deck */}
        {/* Unified Filter Control Deck */}
        {/* Premium Command Bar Control Deck */}
        <div className="bg-white dark:bg-[#0B1120] rounded-[20px] shadow-xl shadow-indigo-500/5 dark:shadow-black/20 border border-gray-100 dark:border-white/[0.05] p-2">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 xl:gap-0">

            {/* Sector 1: Quick Period Dropdown */}
            <div className="flex-none w-[180px]">
              <SingleSelect
                value={selectedDateRange === 'custom' ? null : selectedDateRange}
                onChange={(val) => setQuickDate(val || 'today')}
                options={[
                  { label: 'Today', value: 'today' },
                  { label: 'Yesterday', value: 'yesterday' },
                  { label: 'This Week', value: 'this_week' },
                  { label: 'This Month', value: 'this_month' },
                ]}
                placeholder="Select Period"
                className="w-full"
                buttonClassName={`!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10 !rounded-xl !p-3.5 !h-full !text-sm !font-bold ${selectedDateRange !== 'custom' ? '!text-paymint-green' : ''}`}
              />
            </div>

            {/* Vertical Divider (Desktop) */}
            <div className="hidden xl:block w-px h-10 bg-gray-100 dark:bg-white/10 mx-4" />

            {/* Sector 2: Time & Date Controls (Transparent Layout) */}
            {(() => {
              const isDateFiltered = selectedDateRange === 'custom';
              const isTimeFiltered = startTime !== '00:00' || endTime !== '23:59';

              return (
                <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
                  {/* Date Input Group */}
                  <div className="flex-1 w-full bg-transparent flex flex-col justify-center px-2 group">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={12} className={isDateFiltered ? "text-[#7CC39F]" : "text-gray-400"} />
                      <span className={`text-[9px] font-black tracking-widest transition-colors ${isDateFiltered ? "text-[#7CC39F]" : "text-gray-400"}`}>Date Range</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setSelectedDateRange('custom'); setSelectedShiftId(null); }}
                        className={`bg-transparent p-0 text-sm font-bold border-none focus:ring-0 w-full h-auto dark:[color-scheme:dark] cursor-pointer transition-colors ${isDateFiltered ? "text-[#7CC39F]" : "text-gray-400 dark:text-white/40"}`}
                      />
                      <span className={`font-light transition-colors ${isDateFiltered ? "text-[#7CC39F]/50" : "text-gray-300 dark:text-white/10"}`}>/</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setSelectedDateRange('custom'); setSelectedShiftId(null); }}
                        className={`bg-transparent p-0 text-sm font-bold border-none focus:ring-0 w-full h-auto dark:[color-scheme:dark] text-right cursor-pointer transition-colors ${isDateFiltered ? "text-[#7CC39F]" : "text-gray-400 dark:text-white/40"}`}
                      />
                    </div>
                  </div>

                  {/* Vertical Divider (Inner) */}
                  <div className="hidden md:block w-px h-8 bg-gray-100 dark:bg-white/10" />

                  {/* Time Input Group */}
                  <div className="flex-1 w-full bg-transparent flex flex-col justify-center px-2 group">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={12} className={isTimeFiltered ? "text-[#7CC39F]" : "text-gray-400"} />
                      <span className={`text-[9px] font-black tracking-widest transition-colors ${isTimeFiltered ? "text-[#7CC39F]" : "text-gray-400"}`}>Active Hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => { setStartTime(e.target.value); setSelectedShiftId(null); }}
                        className={`bg-transparent p-0 text-sm font-bold border-none focus:ring-0 w-[94px] h-auto dark:[color-scheme:dark] cursor-pointer transition-colors ${isTimeFiltered ? "text-[#7CC39F]" : "text-gray-400 dark:text-white/40"}`}
                      />
                      <span className={`font-light transition-colors ${isTimeFiltered ? "text-[#7CC39F]/50" : "text-gray-300 dark:text-white/10"}`}>-</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => { setEndTime(e.target.value); setSelectedShiftId(null); }}
                        className={`bg-transparent p-0 text-sm font-bold border-none focus:ring-0 w-[94px] h-auto dark:[color-scheme:dark] text-right cursor-pointer transition-colors ${isTimeFiltered ? "text-[#7CC39F]" : "text-gray-400 dark:text-white/40"}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Vertical Divider (Desktop) */}
            <div className="hidden xl:block w-px h-10 bg-gray-100 dark:bg-white/10 mx-4" />

            {/* Sector 3: Dropdowns (Integrated) */}
            <div className="flex-1 flex flex-col sm:flex-row gap-2 xl:max-w-[440px] xl:ml-auto">
              <div className="flex-1 min-w-0 relative z-50">
                <SingleSelect
                  value={selectedEmployeeId}
                  onChange={(val) => {
                    setSelectedEmployeeId(val);
                    setSelectedShiftId(null);
                  }}
                  options={employees}
                  placeholder="All Staff"
                  className="w-full"
                  buttonClassName="!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10 !rounded-xl !p-3.5 !h-full !text-sm !font-bold"
                />
              </div>

              <div className={`flex-1 min-w-0 relative z-20 ${!selectedEmployeeId ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                <SingleSelect
                  value={selectedShiftId}
                  onChange={setSelectedShiftId}
                  options={employeeShifts}
                  placeholder="Select Shift"
                  className="w-full"
                  buttonClassName="!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10 !rounded-xl !p-3.5 !h-full !text-sm !font-bold"
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
            <p className="text-[10px] font-black tracking-widest text-gray-400">Processing Analytics...</p>
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
                        label: 'Total Sales',
                        value: ((salesData.totalRevenue || 0) + (salesData.taxCollected || 0)).toFixed(3),
                        icon: Wallet,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10',
                        sub: 'Total (Inc. Tax)'
                      },
                      {
                        label: 'Net Sales',
                        value: (salesData.totalRevenue || 0).toFixed(3),
                        icon: TrendingUp,
                        color: 'text-paymint-green',
                        bg: 'bg-paymint-green/10',
                        sub: 'Excl. Tax'
                      },
                      {
                        label: 'Profit',
                        value: (salesData.grossProfit || 0).toFixed(3),
                        icon: DollarSign,
                        color: (salesData.grossProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500',
                        bg: (salesData.grossProfit || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
                        sub: 'Net Sales - Cost'
                      },
                      {
                        label: 'Total Tax',
                        value: (salesData.taxCollected || 0).toFixed(3),
                        icon: Percent,
                        color: 'text-orange-500',
                        bg: 'bg-orange-500/10',
                        sub: 'Tax Amount'
                      },
                      {
                        label: 'Number of Orders',
                        value: (salesData.totalOrders || 0).toString(),
                        suffix: 'Ord',
                        icon: ShoppingBag,
                        color: 'text-indigo-500',
                        bg: 'bg-indigo-500/10',
                        sub: 'Completed'
                      },
                      {
                        label: 'Refunds',
                        value: (salesData.totalRefunds || 0).toFixed(3),
                        icon: RefreshCw,
                        color: 'text-red-500',
                        bg: 'bg-red-500/10',
                        sub: 'Returns'
                      },
                      {
                        label: 'Hours',
                        value: (salesData.totalHoursWorked || 0).toFixed(1),
                        suffix: 'Hrs',
                        icon: Clock,
                        color: 'text-orange-500',
                        bg: 'bg-orange-500/10',
                        sub: 'Staff Hours',
                        onClick: () => setReportType('shifts')
                      },
                      {
                        label: 'Cashflow Outside Sales',
                        value: (
                          <div className="w-full mt-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-400">Pay In</span>
                              <span className="text-sm font-bold text-paymint-green tracking-tight">+{formatCurrency(salesData.totalPayIn || 0).replace(' Jod', '')}</span>
                            </div>
                            <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-400">Pay Out</span>
                              <span className="text-sm font-bold text-red-500 tracking-tight">-{formatCurrency(salesData.totalPayOut || 0).replace(' Jod', '')}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200 dark:border-white/10">
                              <span className="text-[10px] font-bold text-gray-400">Net Flow</span>
                              <span className={`text-sm font-bold ${netPayInOut >= 0 ? 'text-paymint-green' : 'text-red-500'}`}>
                                {netPayInOut >= 0 ? '+' : ''}{formatCurrency(netPayInOut).replace(' Jod', '')}
                              </span>
                            </div>
                          </div>
                        ),
                        icon: ArrowUpRight,
                        color: 'text-cyan-500',
                        bg: 'bg-cyan-500/10',
                        sub: null, // Info is now in the card body
                        onClick: () => setShowPayInOutModal(true)
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={stat.onClick}
                        className={`group relative p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col hover:shadow-lg transition-all duration-300 overflow-hidden ${stat.onClick ? 'cursor-pointer' : ''}`}
                      >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                              <stat.icon size={20} />
                            </div>
                            {stat.onClick && (
                              <ExternalLink size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-paymint-green transition-colors" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-gray-400 tracking-wide mb-1 flex items-center gap-1">
                            {stat.label}
                          </p>
                          {typeof stat.value === 'string' ? (
                            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                              {stat.value}
                              {stat.suffix && <span className="text-base ml-1 text-gray-300 dark:text-gray-500">{stat.suffix}</span>}
                            </p>
                          ) : (
                            stat.value
                          )}
                          <p className="text-xs font-medium text-gray-400 mt-1 opacity-70">
                            {stat.sub}
                          </p>
                        </div>
                      </motion.div>
                    ));
                  })()}
                </div>

                <PayInPayOutLogModal
                  isOpen={showPayInOutModal}
                  onClose={() => setShowPayInOutModal(false)}
                  startDate={effectiveDateRange.start}
                  endDate={effectiveDateRange.end}
                  employeeId={selectedEmployeeId}
                />



                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Line Chart */}
                  <div className="lg:col-span-2 p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <TrendingUp className="text-paymint-green" size={20} />
                          Revenue Stats
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Performance over time</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                        <Activity size={12} className="text-paymint-green" />
                        <span className="text-[10px] font-bold text-gray-500 tracking-wide">Real-time</span>
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
                                  <p className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">No Revenue Data</p>
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
                                        itemStyle={{ color: '#7CC39F', fontWeight: '900', fontSize: '12px', textTransform: 'capitalize' }}
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
                                        itemStyle={{ color: '#7CC39F', fontWeight: '900', fontSize: '12px', textTransform: 'capitalize' }}
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
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payment Methods</h3>
                        <p className="text-[10px] font-bold text-gray-500 tracking-widest">Breakdown Chart</p>
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
                                    textTransform: 'capitalize'
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
            )}

            {reportType === 'top-items' && itemReportData && (
              <div className="space-y-6">

                {/* Sub-tabs and Search Bar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Sub-tabs based on mode */}
                  <div className="flex gap-2">
                    {itemReportTab !== 'modifiers' ? (
                      <>
                        <button
                          onClick={() => setItemReportTab('items')}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${itemReportTab === 'items'
                            ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                            : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                            }`}
                        >
                          View All Items
                        </button>
                        <button
                          onClick={() => setItemReportTab('categories')}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${itemReportTab === 'categories'
                            ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                            : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                            }`}
                        >
                          By Category
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Tag size={18} className="text-paymint-green" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Add-ons Report</span>
                      </div>
                    )}
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${itemReportTab === 'categories' ? 'categories' : itemReportTab === 'modifiers' ? 'add-ons' : 'items'}...`}
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                    />
                  </div>
                </div>


                {/* Data Table */}
                <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-white/[0.02]">
                        <tr className="border-b border-gray-200 dark:border-white/5">
                          <th
                            className={`px-8 py-5 text-left text-[10px] font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'name' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            onClick={() => requestSort('name')}
                          >
                            <div className="flex items-center gap-2">
                              {itemReportTab === 'categories' ? 'Category Name' : (itemReportTab === 'modifiers' ? 'Add-on Name' : 'Product Name')}
                              <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'name' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                            </div>
                          </th>
                          <th
                            className={`px-8 py-5 text-right text-[10px] font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'quantity' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            onClick={() => requestSort('quantity')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              Units Sold
                              <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'quantity' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                            </div>
                          </th>
                          <th
                            className={`px-8 py-5 text-right text-[10px] font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'revenue' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            onClick={() => requestSort('revenue')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              Gross Revenue
                              <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'revenue' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {sortedItems.length > 0 ? (
                          sortedItems
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((item: any, idx: number) => (
                              <motion.tr
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isFetching ? 0.5 : 1 }}
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
                                  {formatCurrency((item.totalSales || item.revenue) || 0)}
                                </td>
                              </motion.tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-20 text-center text-gray-400 font-black text-[10px] tracking-[0.2em]">No transactional data identified for this period</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {itemReportData.breakdown && itemReportData.breakdown.length > itemsPerPage && (
                    <div className="flex items-center justify-between px-8 py-4 border-t border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                      <p className="text-[10px] font-black text-gray-400 tracking-widest">
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

            {/* Staff Performance Report Section */}
            {reportType === 'employees' && (
              <div className="space-y-8">

                {/* Staff Breakdown Stats - Show when employee is selected */}
                {selectedEmployeeId && (() => {
                  const selectedEmp = employees.find(e => e.value === selectedEmployeeId);
                  const empName = selectedEmp?.label || 'Employee';

                  // Calculate stats from employee shifts
                  const empTotalHours = employeeShifts.reduce((acc, shift) => {
                    if (shift.startTime) {
                      const start = new Date(shift.startTime);
                      const end = shift.endTime ? new Date(shift.endTime) : new Date();
                      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    }
                    return acc;
                  }, 0);

                  const empTotalOrders = employeeShifts.reduce((acc, shift) => acc + (shift.orderCount || 0), 0);
                  const empTotalSales = employeeShifts.reduce((acc, shift) => acc + (shift.totalSales || 0), 0);
                  const empTotalDiscounts = employeeShifts.reduce((acc, shift) => acc + (shift.totalDiscounts || 0), 0);
                  const empTotalRefunds = employeeShifts.reduce((acc, shift) => acc + (shift.totalRefunds || 0), 0);
                  const empPositiveVariance = employeeShifts.reduce((acc, shift) => {
                    const variance = (shift.variance || 0);
                    return variance > 0 ? acc + variance : acc;
                  }, 0);
                  const empNegativeVariance = employeeShifts.reduce((acc, shift) => {
                    const variance = (shift.variance || 0);
                    return variance < 0 ? acc + Math.abs(variance) : acc;
                  }, 0);

                  return (
                    <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-paymint-green/10 flex items-center justify-center">
                          <Users size={24} className="text-paymint-green" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{empName}'s Performance</h3>
                          <p className="text-xs text-gray-500">Breakdown for selected period</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Total Hours</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{empTotalHours.toFixed(1)}</p>
                          <p className="text-[10px] text-gray-500">By {empName}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Total Orders</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{empTotalOrders}</p>
                          <p className="text-[10px] text-gray-500">By {empName}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-paymint-green/10 border border-paymint-green/20">
                          <p className="text-[10px] font-black text-paymint-green tracking-widest mb-1">Total Sales</p>
                          <p className="text-xl font-bold text-paymint-green">{empTotalSales.toFixed(3)} JOD</p>
                          <p className="text-[10px] text-paymint-green/70">By {empName}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Total Discounts</p>
                          <p className="text-xl font-bold text-orange-500">{empTotalDiscounts.toFixed(3)} JOD</p>
                          <p className="text-[10px] text-gray-500">Issued by {empName}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Total Refunds</p>
                          <p className="text-xl font-bold text-red-500">{empTotalRefunds.toFixed(3)} JOD</p>
                          <p className="text-[10px] text-gray-500">By {empName}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Variances</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-emerald-500">+{empPositiveVariance.toFixed(2)}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-sm font-bold text-red-500">-{empNegativeVariance.toFixed(2)}</span>
                          </div>
                          <p className="text-[10px] text-gray-500">By {empName}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Employee Leaderboard / Scorecards */}
                {shifts.length > 0 && (() => {
                  const employeeStats = shifts.reduce((acc: any, shift: any) => {
                    const username = shift.user?.username || 'Unknown';
                    if (!acc[username]) {
                      acc[username] = {
                        username,
                        totalShifts: 0,
                        totalSales: 0,
                        totalHours: 0,
                        avgTransaction: 0,
                        transactionCount: shift.orderCount || 20, // Fallback if missing
                      };
                    }
                    acc[username].totalShifts += 1;
                    acc[username].totalSales += shift.totalSales || 0;
                    if (shift.startTime) {
                      const start = new Date(shift.startTime);
                      const end = shift.endTime ? new Date(shift.endTime) : new Date();
                      acc[username].totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    }
                    return acc;
                  }, {});

                  const sortedEmployees = Object.values(employeeStats).sort((a: any, b: any) => b.totalSales - a.totalSales);
                  const totalStoreSales = sortedEmployees.reduce((acc: number, curr: any) => acc + curr.totalSales, 0);

                  // Prepare Pie Chart Data (Top 4 + Others)
                  let pieData = sortedEmployees.slice(0, 4).map((emp: any) => ({
                    name: emp.username,
                    value: emp.totalSales,
                    color: '' // Will assign below
                  }));
                  if (sortedEmployees.length > 4) {
                    pieData.push({
                      name: 'Others',
                      value: sortedEmployees.slice(4).reduce((acc: number, curr: any) => acc + curr.totalSales, 0),
                      color: '#94A3B8'
                    });
                  }

                  // Assign colors
                  pieData.forEach((entry: any, index: number) => {
                    if (entry.name !== 'Others') entry.color = COLORS[index % COLORS.length];
                  });

                  return (
                    <div className="space-y-6">
                      {/* Visual Analytics Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* 1. Revenue Share Chart (The "Slice" View) */}
                        <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[24px] border border-gray-100 dark:border-white/[0.05] shadow-sm flex flex-col">
                          <div className="mb-4">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Sales Share</h3>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest">By Staff</p>
                          </div>
                          <div className="flex-1 min-h-[200px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {pieData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value: number | undefined) => formatCurrency(value || 0)}
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            {/* Center Stat */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="text-center">
                                <p className="text-[10px] font-black text-gray-400">Total</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(totalStoreSales).replace(' Jod', '')}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {pieData.map((entry: any) => (
                              <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <p className="text-[10px] font-bold text-gray-500 truncate">{entry.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Top Performer Spotlight (The "Star" View) */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sortedEmployees.slice(0, 2).map((emp: any, idx: number) => (
                            <motion.div
                              key={emp.username}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`relative overflow-hidden p-6 rounded-[24px] border shadow-lg flex flex-col justify-between ${idx === 0
                                ? 'bg-gradient-to-br from-[#7CC39F] to-[#5FAF87] text-black border-transparent'
                                : 'bg-white dark:bg-[#0B1120] border-gray-100 dark:border-white/[0.05]'
                                }`}
                            >
                              <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-black/10' : 'bg-paymint-green/10 text-paymint-green'}`}>
                                    {emp.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${idx === 0 ? 'bg-black/10 text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                    {idx === 0 ? '🏆 #1 Top' : '🥈 #2'}
                                  </div>
                                </div>

                                <div>
                                  <h3 className={`text-xl font-black mb-1 ${idx === 0 ? 'text-black' : 'text-gray-900 dark:text-white'}`}>{emp.username}</h3>
                                  <div className="flex gap-4 mt-4">
                                    <div>
                                      <p className={`text-[9px] font-black tracking-widest mb-1 ${idx === 0 ? 'text-black/60' : 'text-gray-400'}`}>Revenue</p>
                                      <p className={`text-2xl font-black ${idx === 0 ? 'text-black' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(emp.totalSales).replace(' Jod', '')}</p>
                                    </div>
                                    <div>
                                      <p className={`text-[9px] font-black tracking-widest mb-1 ${idx === 0 ? 'text-black/60' : 'text-gray-400'}`}>Avg Ticket</p>
                                      <p className={`text-2xl font-black ${idx === 0 ? 'text-black' : 'text-gray-900 dark:text-white'}`}>
                                        {formatCurrency(emp.totalSales / (emp.transactionCount || 1)).replace(' Jod', '')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {idx === 0 && <Activity className="absolute -right-6 -bottom-6 w-40 h-40 text-black/5 rotate-12" />}
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Detailed Metrics Table */}
                      <div className="bg-white dark:bg-[#0B1120] rounded-[24px] border border-gray-100 dark:border-white/[0.05] overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Staff Analysis</h3>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest">Performance Metrics</p>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50/50 dark:bg-white/[0.01]">
                              <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Rank</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Staff</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Sales</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Share</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Avg Order</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Sales/Hr</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.03]">
                              {sortedEmployees.map((emp: any, idx: number) => {
                                const share = ((emp.totalSales / totalStoreSales) * 100).toFixed(1);
                                const avgTicket = emp.totalSales / (emp.transactionCount || 1);
                                const efficiency = emp.totalSales / (emp.totalHours || 1);

                                return (
                                  <tr key={emp.username} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-left">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-[#7CC39F]/20 text-[#7CC39F]' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                        {idx + 1}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="font-bold text-gray-900 dark:text-white text-sm">{emp.username}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                                      {formatCurrency(emp.totalSales)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <div className="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${share}%` }} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">{share}%</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                      {formatCurrency(avgTicket).replace(' Jod', '')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <span className="text-xs font-bold text-gray-500">
                                        {formatCurrency(efficiency).replace(' Jod', '')} / hr
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Shifts Report Section (Operational Audit) */}
            {reportType === 'shifts' && (
              <div className="space-y-6">
                {/* Audit Oversight Cards */}
                {shifts.length > 0 && (() => {
                  const totalVariance = shifts.reduce((acc: number, shift: any) => acc + (shift.discrepancy || 0), 0);
                  const activeShifts = shifts.filter((s: any) => s.status === 'OPEN').length;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-100 dark:border-white/[0.05] shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-orange-500">
                          <Activity size={20} />
                          <h4 className="text-[10px] font-black tracking-widest text-gray-400">Cash Variance</h4>
                        </div>
                        <p className={`text-3xl font-black ${totalVariance < -0.01 ? 'text-red-500' : 'text-paymint-green'}`}>
                          {totalVariance > 0 ? '+' : ''}{formatCurrency(totalVariance)}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 mt-2">Total over/short</p>
                      </div>
                      <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-100 dark:border-white/[0.05] shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-blue-500">
                          <Clock size={20} />
                          <h4 className="text-[10px] font-black tracking-widest text-gray-400">Shifts</h4>
                        </div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{shifts.length}</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-2">{activeShifts} active shifts</p>
                      </div>
                      <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-100 dark:border-white/[0.05] shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-paymint-green">
                          <Wallet size={20} />
                          <h4 className="text-[10px] font-black tracking-widest text-gray-400">Audited</h4>
                        </div>
                        <p className="text-3xl font-black text-paymint-green">100%</p>
                        <p className="text-[10px] font-bold text-gray-500 mt-2">Shifts closed</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Shifts Table */}
                <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-white/[0.02]">
                        <tr className="border-b border-gray-200 dark:border-white/5">
                          <th className="px-5 py-5 text-left text-[10px] font-black text-gray-400 tracking-widest">Staff</th>
                          <th className="px-5 py-5 text-left text-[10px] font-black text-gray-400 tracking-widest">Time</th>
                          <th className="px-5 py-5 text-right text-[10px] font-black text-gray-400 tracking-widest">Opening</th>
                          <th className="px-5 py-5 text-right text-[10px] font-black text-gray-400 tracking-widest">Sales</th>
                          <th className="px-5 py-5 text-right text-[10px] font-black text-gray-400 tracking-widest">Closing</th>
                          <th className="px-5 py-5 text-center text-[10px] font-black text-gray-400 tracking-widest">Variance</th>
                          <th className="px-5 py-5 text-center text-[10px] font-black text-gray-400 tracking-widest">Status</th>
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
                                  <span className="text-[10px] font-black text-gray-400 tracking-widest">Active</span>
                                )}
                              </td>
                              <td className="px-5 py-5 text-center">
                                {shift.status === 'CLOSED' && shift.discrepancy !== null && shift.discrepancy !== undefined ? (
                                  <div className="flex flex-col items-center">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest border ${shift.discrepancy > 0.001
                                      ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                                      : shift.discrepancy < -0.001
                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10'
                                      }`}>
                                      {shift.discrepancy > 0.001
                                        ? `+${formatCurrency(shift.discrepancy).replace(' Jod', '')} Over`
                                        : shift.discrepancy < -0.001
                                          ? `${formatCurrency(shift.discrepancy).replace(' Jod', '')} Short`
                                          : '0'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-black text-gray-400 tracking-widest">—</span>
                                )}
                              </td>
                              <td className="px-5 py-5 text-center">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest border transition-all ${shift.status === 'OPEN'
                                  ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10'
                                  }`}>
                                  {shift.status.charAt(0).toUpperCase() + shift.status.slice(1).toLowerCase()}
                                </span>
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-20 text-center text-gray-400 font-black text-[10px] tracking-[0.2em]">No shift records found in cluster</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
            }

            {/* Receipts Report Table */}
            {reportType === 'receipts' && (
              <ReceiptsReport
                startDate={effectiveDateRange.start}
                endDate={effectiveDateRange.end}
                employeeId={selectedEmployeeId}
              />
            )}

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
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Busy Times</h3>
                        <p className="text-[10px] font-bold text-gray-500 tracking-widest">Sales by hour</p>
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
                            tickFormatter={(val) => formatCurrency(val).replace(' Jod', '')}
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
                            itemStyle={{ color: '#f97316', fontWeight: 'bold', fontSize: '12px', textTransform: 'capitalize' }}
                            labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold', marginBottom: '4px', fontSize: '10px' }}
                            formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                          />
                          <Bar dataKey="total" name="Revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center space-y-4 bg-gray-50/50 dark:bg-[#0B1120]/50 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.03]">
                        <div className="p-5 rounded-full bg-gray-100 dark:bg-white/5">
                          <Clock size={36} className="text-gray-400 dark:text-gray-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">No Traffic Data</p>
                          <p className="text-xs text-gray-500 mt-1">There is no transaction activity recorded for the selected period.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {
              reportType === 'payments' && salesData && (
                <div className="space-y-6">
                  {/* Summary Cards for Payments */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Total Collected</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {formatCurrency(salesData.totalRevenue || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Across all payment channels</p>
                      </div>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-paymint-green/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>

                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Top Method</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {salesData.paymentMethodBreakdown?.sort((a: any, b: any) => b.value - a.value)[0]?.name || '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Highest volume channel</p>
                      </div>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>

                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Transaction Count</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {salesData.totalOrders || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Total processed payments</p>
                      </div>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Detailed Distribution Chart */}
                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <PieChartIcon size={20} className="text-paymint-green" />
                        Distribution
                      </h3>
                      <div className="h-[300px] w-full relative">
                        {salesData.paymentMethodBreakdown && salesData.paymentMethodBreakdown.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={salesData.paymentMethodBreakdown}
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={4}
                                dataKey="value"
                                animationDuration={1000}
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
                                  padding: '12px',
                                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                }}
                                itemStyle={{
                                  color: isDark ? '#fff' : '#111',
                                  fontWeight: '800',
                                  fontSize: '12px',
                                  textTransform: 'capitalize'
                                }}
                                formatter={(val: any) => formatCurrency(val)}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400 flex-col gap-2">
                            <CreditCard size={32} className="opacity-20" />
                            <span className="text-xs font-bold tracking-widest">No Data Available</span>
                          </div>
                        )}
                        {/* Center Stats */}
                        {salesData.paymentMethodBreakdown && salesData.paymentMethodBreakdown.length > 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-gray-900 dark:text-white">
                              {salesData.paymentMethodBreakdown.length}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 tracking-widest">Methods</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm overflow-hidden flex flex-col">
                      <div className="p-6 border-b border-gray-100 dark:border-white/5">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Activity size={20} className="text-blue-500" />
                          Details
                        </h3>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-white/[0.02]">
                            <tr>
                              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Method</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Revenue</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Share</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {salesData.paymentMethodBreakdown?.map((item: any, i: number) => {
                              const total = salesData.totalRevenue || 1;
                              const percentage = ((item.value / total) * 100).toFixed(1);

                              return (
                                <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-500" style={{ color: COLORS[i % COLORS.length], backgroundColor: `${COLORS[i % COLORS.length]}20` }}>
                                        <Wallet size={16} />
                                      </div>
                                      <span className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(item.value)}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span className="text-xs font-bold text-gray-500">{percentage}%</span>
                                      <div className="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            {
              reportType === 'discounts' && salesData && (
                <div className="space-y-6">
                  {/* Summary Cards for Discounts */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Total Discounted</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {formatCurrency(salesData.totalDiscounts || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Total value reduced from sales</p>
                      </div>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-paymint-green/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>

                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Top Discount</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {salesData.discountBreakdown?.sort((a: any, b: any) => b.value - a.value)[0]?.name || '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Most utilized promotion</p>
                      </div>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>

                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Usage Count</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {salesData.totalDiscountCount || salesData.discountBreakdown?.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0) || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Times discounts applied</p>
                      </div>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Detailed Distribution Chart */}
                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <PieChartIcon size={20} className="text-paymint-green" />
                        Usage Distribution
                      </h3>
                      <div className="h-[300px] w-full relative">
                        {salesData.discountBreakdown && salesData.discountBreakdown.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={salesData.discountBreakdown}
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={4}
                                dataKey="value"
                                animationDuration={1000}
                                stroke="none"
                              >
                                {salesData.discountBreakdown.map((_: any, index: number) => (
                                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: isDark ? '#0B1120' : '#fff',
                                  borderRadius: '16px',
                                  border: 'none',
                                  padding: '12px',
                                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                }}
                                itemStyle={{
                                  color: isDark ? '#fff' : '#111',
                                  fontWeight: '800',
                                  fontSize: '12px',
                                  textTransform: 'capitalize'
                                }}
                                formatter={(val: any) => formatCurrency(val)}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400 flex-col gap-2">
                            <Percent size={32} className="opacity-20" />
                            <span className="text-xs font-bold tracking-widest">No Discounts Applied</span>
                          </div>
                        )}
                        {/* Center Stats */}
                        {salesData.discountBreakdown && salesData.discountBreakdown.length > 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-gray-900 dark:text-white">
                              {salesData.discountBreakdown.length}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 tracking-widest">Types</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm overflow-hidden flex flex-col">
                      <div className="p-6 border-b border-gray-100 dark:border-white/5">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Activity size={20} className="text-purple-500" />
                          Detailed Performance
                        </h3>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-white/[0.02]">
                            <tr>
                              <th
                                className={`px-6 py-4 text-left text-[10px] font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'name' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                onClick={() => requestSort('name')}
                              >
                                <div className="flex items-center gap-2">
                                  Promotion Name
                                  <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'name' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                                </div>
                              </th>
                              <th
                                className={`px-6 py-4 text-right text-[10px] font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'count' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                onClick={() => requestSort('count')}
                              >
                                <div className="flex items-center justify-end gap-2">
                                  Usage Count
                                  <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'count' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                                </div>
                              </th>
                              <th
                                className={`px-6 py-4 text-right text-[10px] font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'value' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                onClick={() => requestSort('value')}
                              >
                                <div className="flex items-center justify-end gap-2">
                                  Total Value
                                  <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'value' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {sortedDiscounts.map((item: any, i: number) => {
                              return (
                                <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-500" style={{ color: COLORS[i % COLORS.length], backgroundColor: `${COLORS[i % COLORS.length]}20` }}>
                                        <Tag size={16} />
                                      </div>
                                      <span className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-gray-700 dark:text-gray-300">
                                    {item.count || 0}
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-paymint-green">
                                    {formatCurrency(item.value)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {(!salesData.discountBreakdown || salesData.discountBreakdown.length === 0) && (
                          <div className="p-8 text-center text-gray-400 text-xs font-bold tracking-widest">
                            No discount data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            {
              reportType === 'taxes' && salesData && (
                <div className="space-y-6">
                  {/* Summary Cards for Taxes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Total Tax</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {formatCurrency(salesData.taxCollected || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Total tax amount</p>
                      </div>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>

                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Taxable Sales</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {formatCurrency(salesData.totalRevenue || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Sales with tax</p>
                      </div>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>

                    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Avg. Rate</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {salesData.totalRevenue > 0
                            ? ((salesData.taxCollected / salesData.totalRevenue) * 100).toFixed(1)
                            : '0.0'}%
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Average tax percentage</p>
                      </div>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-paymint-green/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tax Breakdown Main Card */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm overflow-hidden flex flex-col">
                      <div className="p-6 border-b border-gray-100 dark:border-white/5">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Scale size={20} className="text-orange-500" />
                          Tax Details
                        </h3>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-white/[0.02]">
                            <tr>
                              <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Type</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Rate</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Taxable</th>
                              <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Tax</th>
                              <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 tracking-widest">Share</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {/* NOTE: If backend doesn't provide granular tax breakdown, we reconstruct a "Sales Tax" default row */}
                            {salesData.taxBreakdown && salesData.taxBreakdown.length > 0 ? (
                              salesData.taxBreakdown.map((tax: any, i: number) => {
                                const contribution = salesData.taxCollected > 0 ? (tax.collected / salesData.taxCollected) * 100 : 0;
                                return (
                                  <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-500 font-bold">
                                          {tax.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="font-bold text-sm text-gray-900 dark:text-white">{tax.name}</span>
                                          <span className="text-[10px] text-gray-400 font-bold">{tax.transactions || 0} Txns</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-500">
                                      {(tax.rate * 100).toFixed(1)}%
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                      {formatCurrency(tax.taxableAmount)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-orange-500">
                                      {formatCurrency(tax.collected)}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-2 max-w-[100px] mx-auto">
                                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${contribution}%` }} />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              // Default Fallback Row if no granular data
                              <tr className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-500 font-bold">
                                      S
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-sm text-gray-900 dark:text-white">Sales Tax (Standard)</span>
                                      <span className="text-[10px] text-gray-400 font-bold">{salesData.totalOrders || 0} Txns</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-500">
                                  {(salesData.totalRevenue > 0 ? (salesData.taxCollected / salesData.totalRevenue) * 100 : 16).toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(salesData.totalRevenue || 0)}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-orange-500">
                                  {formatCurrency(salesData.taxCollected || 0)}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 max-w-[100px] mx-auto">
                                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `100%` }} />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Exemptions Panel */}
                    <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm p-6 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        Exemptions
                      </h3>
                      <p className="text-xs text-gray-500 mb-6">Tax-free sales</p>

                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300 dark:text-white/20">
                          <Scale size={24} />
                        </div>
                        <div>
                          <p className="text-2xl font-black text-gray-900 dark:text-white">
                            {formatCurrency(salesData.taxExemptSales || 0)}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-1">Tax-Free Sales</p>
                        </div>
                        <div className="w-full h-px bg-gray-100 dark:bg-white/5 my-4" />
                        <div className="w-full space-y-3">
                          {/* Mock list of exemptions or actual data if available */}
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-500">Resale Certificates</span>
                            <span className="font-bold text-gray-900 dark:text-white">—</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-500">Non-Profit</span>
                            <span className="font-bold text-gray-900 dark:text-white">—</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-500">Gov. Entities</span>
                            <span className="font-bold text-gray-900 dark:text-white">—</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
