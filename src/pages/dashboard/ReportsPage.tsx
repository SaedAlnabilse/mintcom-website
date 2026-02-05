import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { endOfDay, startOfDay, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Clock, Activity, ShoppingBag,
  Download, CreditCard, Percent, Tag, Scale
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../../context/CurrencyContext';

import { ReceiptsReport } from '../../components/dashboard/reports/ReceiptsReport';
import { SingleSelect } from '../../components/SingleSelect';
import { exportToCSV } from '../../utils/export';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { CustomTimePicker } from '../../components/CustomTimePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import type { SalesSummary, Shift, ItemReportData, PeakHour, ShiftOption } from '../../types';

// View Components
import { SalesView } from '../../components/dashboard/reports/views/SalesView';
import { ItemsView } from '../../components/dashboard/reports/views/ItemsView';
import { StaffView } from '../../components/dashboard/reports/views/StaffView';
import { ShiftsView } from '../../components/dashboard/reports/views/ShiftsView';
import { PeakHoursView } from '../../components/dashboard/reports/views/PeakHoursView';
import { PaymentsView } from '../../components/dashboard/reports/views/PaymentsView';
import { DiscountsView } from '../../components/dashboard/reports/views/DiscountsView';
import { TaxesView } from '../../components/dashboard/reports/views/TaxesView';
import { CashDiscrepancyView } from '../../components/dashboard/reports/views/CashDiscrepancyView';
import { PayInPayOutLogModal } from '../../components/dashboard/reports/PayInPayOutLogModal';

type ReportType = 'sales' | 'top-items' | 'top-categories' | 'top-modifiers' | 'peak-hours' | 'shifts' | 'staff-sales' | 'payments' | 'discounts' | 'taxes' | 'receipts' | 'cash-discrepancy';

interface EmployeeOption {
  label: string;
  value: string;
}

export function ReportsPage() {
  const { currencySymbol } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const locationSlug = params.locationSlug || params.slug;

  // Date & Time State
  const [startDate, setStartDate] = useState(formatDateForInput(startOfDay(new Date())));
  const [endDate, setEndDate] = useState(formatDateForInput(endOfDay(new Date())));
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');

  // Report State
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [itemReportTab, setItemReportTab] = useState<'items' | 'categories' | 'modifiers' | 'attributes'>('items');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPayInOutModal, setShowPayInOutModal] = useState(false);

  // Advanced Filtering
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeShifts, setEmployeeShifts] = useState<ShiftOption[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Current Establishment context
  const [currentEstablishment, setCurrentEstablishment] = useState<any>(null);

  useEffect(() => {
    try {
      const est = sessionStorage.getItem('currentEstablishment');
      if (est) setCurrentEstablishment(JSON.parse(est));
    } catch (e) { console.error(e); }
  }, []);

  // Sync Report Type from URL
  useEffect(() => {
    const path = location.pathname;
    const parts = path.split('/');
    const reportIndex = parts.indexOf('reports');

    if (reportIndex !== -1 && parts[reportIndex + 1]) {
      const type = parts[reportIndex + 1];

      if (['items', 'categories', 'modifiers', 'attributes'].includes(type) || type === 'items-categories' || type === 'addons') {
        setReportType('top-items');
        if (type === 'items') setItemReportTab('items');
        else if (type === 'categories') setItemReportTab('categories');
        else if (type === 'modifiers') setItemReportTab('modifiers');
        else if (type === 'attributes') setItemReportTab('attributes');
        else if (type === 'items-categories') setItemReportTab('items');
        else if (type === 'addons') setItemReportTab('modifiers');
      } else {
        const validTypes: ReportType[] = ['sales', 'top-items', 'peak-hours', 'shifts', 'staff-sales', 'payments', 'discounts', 'taxes', 'receipts', 'cash-discrepancy'];
        if (validTypes.includes(type as ReportType)) {
          setReportType(type as ReportType);
        }
      }
    }
  }, [location]);

  // Handle PayInOut redirect state
  useEffect(() => {
    if (location.state && (location.state as any).showPayInOut) {
      setShowPayInOutModal(true);
      // Clean up state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const effectiveDateRange = useMemo(() => {
    if (selectedShiftId) {
      const shift = employeeShifts.find(s => s.value === selectedShiftId);
      if (shift) {
        return { start: shift.startTime, end: shift.endTime || new Date().toISOString() };
      }
    }
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    return { start: start.toISOString(), end: end.toISOString() };
  }, [selectedShiftId, employeeShifts, startDate, endDate, startTime, endTime]);

  const [salesData, setSalesData] = useState<SalesSummary | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [itemReportData, setItemReportData] = useState<ItemReportData | null>(null);

  // Filter State - (Simplified version, complex filters removed as unused)

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/reports/employees');
      setEmployees(res.data?.map((u: any) => ({ label: u.name, value: u.id })) || []);
    } catch {
      console.error('Failed to load employees');
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
          endTime: s.endTime,
          totalSales: s.totalSales || 0,
          orderCount: s.orderCount || 0,
          totalDiscounts: s.totalDiscounts || 0,
          totalRefunds: s.totalRefunds || 0,
          variance: s.variance || s.discrepancy || 0,
        })) || []);
      } catch (error) {
        console.error('Failed to load employee shifts', error);
      }
    };
    fetchEmployeeShifts();
  }, [selectedEmployeeId, startDate, endDate]);

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
      (reportType === 'staff-sales' && shifts.length > 0) ||
      (reportType === 'shifts' && shifts.length > 0) ||
      (reportType === 'receipts' && true); // Receipts are fetched inside the component

    // If switching report types or no data yet, block UI.
    // Otherwise (filters/sub-tabs), just show fetching indicator.
    if (isMajorSwitch || !hasData) {
      setIsLoading(true);
    }

    fetchReportData();
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
        case 'taxes': {
          const salesRes = await api.get('/reports/historical-summary', { params: commonParams });
          setSalesData(salesRes.data);
          break;
        }
        case 'discounts': {
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
          } as any);
          break;
        }
        case 'top-items': {
          let endpoint = '/reports/item-report';
          if (itemReportTab === 'categories') {
            endpoint = '/reports/category-report';
          } else if (itemReportTab === 'modifiers') {
            endpoint = '/reports/modifier-report';
          } else if (itemReportTab === 'attributes') {
            endpoint = '/reports/attribute-report';
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
        }
        case 'peak-hours': {
          const peakRes = await api.get('/reports/peak-hours', { params: commonParams });
          setPeakHours(peakRes.data || []);
          break;
        }
        case 'staff-sales': {
          const staffSalesRes = await api.get('/reports/shifts', { params: { ...commonParams, limit: 50 } });
          setShifts(staffSalesRes.data || []);
          break;
        }
        case 'shifts': {
          const shiftsRes = await api.get('/reports/shifts', { params: { ...commonParams, limit: 20 } });
          setShifts(shiftsRes.data || []);
          break;
        }
        case 'cash-discrepancy': {
          const shiftsRes = await api.get('/reports/shifts', { params: { ...commonParams, limit: 100 } });
          setShifts(shiftsRes.data || []);
          break;
        }
      }
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const setQuickDate = (range: string) => {
    setSelectedDateRange(range);
    setSelectedShiftId(null);
    const { start, end } = calculateDateRange(range as DatePeriod);
    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
    setStartTime('00:00');
    setEndTime('23:59');
  };

  const handleExport = () => {
    let dataToExport: any[] = [];
    const filename = `report_${reportType}`;
    let headers = {};

    switch (reportType) {
      case 'sales':
      case 'payments':
      case 'discounts':
      case 'taxes':
        dataToExport = salesData?.dailyBreakdown || [];
        headers = { date: 'Date', revenue: `Revenue (${currencySymbol})`, count: 'Orders' };
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
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-wide border border-paymint-green/20">
              Sales and Reporting
            </span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green" />
              </span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wide">Live</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Sales and Reporting</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">Tracking All Business Performance</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          >
            <Download size={18} className="text-gray-900 dark:text-white" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Dynamic Filter Strip */}
      <div className="space-y-2">
        {/* Report Type Selector - Improved Pills */}
        <div className="flex w-full gap-2 overflow-x-auto scrollbar-none pb-2">
          {[
            { id: 'sales', label: 'Sales Summary', icon: TrendingUp },
            { id: 'items-categories', label: 'Sales by Items', icon: ShoppingBag },
            { id: 'addons', label: 'Sales by Add-Ons', icon: Tag },
            { id: 'staff-sales', label: 'Sales by Staff', icon: Activity },
            { id: 'shifts', label: 'Shifts', icon: Clock },
            { id: 'cash-discrepancy', label: 'Cash Gap Reports', icon: Scale },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'discounts', label: 'Discounts', icon: Percent },
          ].map((type) => {
            const isSelected = type.id === 'items-categories'
              ? (reportType === 'top-items' && (itemReportTab === 'items' || itemReportTab === 'categories'))
              : type.id === 'addons'
                ? (reportType === 'top-items' && (itemReportTab === 'modifiers' || itemReportTab === 'attributes'))
                : reportType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => {
                  // Navigate to the appropriate route so sidebar stays in sync
                  if (type.id === 'items-categories') {
                    setItemReportTab('items');
                    navigate(`/dashboard/${locationSlug}/reports/items`);
                  } else if (type.id === 'addons') {
                    setItemReportTab('modifiers');
                    navigate(`/dashboard/${locationSlug}/reports/modifiers`);
                  } else {
                    navigate(`/dashboard/${locationSlug}/reports/${type.id}`);
                  }
                }}
                className={`relative flex-none lg:flex-1 flex flex-col xl:flex-row items-center justify-center gap-1.5 xl:gap-2 px-3 py-2.5 xl:py-3 rounded-xl transition-all duration-300 isolate min-w-[120px] lg:min-w-0 ${isSelected
                  ? 'text-black shadow-lg shadow-paymint-green/20'
                  : 'bg-white dark:bg-[#0B1120] text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'
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
                <span className="text-xs font-black tracking-wide truncate relative z-10">{type.label}</span>
              </button>
            );
          })}
        </div>
        {/* Unified Filter Dashboard */}

        {/* Unified Filter Control Deck */}
        <div className="bg-white dark:bg-[#0B1120] rounded-[20px] shadow-xl shadow-indigo-500/5 dark:shadow-black/20 border border-gray-100 dark:border-white/[0.05] p-2">
          {/* Single Row Layout - wraps on smaller screens */}
          <div className="flex flex-wrap items-stretch gap-2">

            {/* Quick Period Dropdown */}
            <div className="w-full xs:w-auto xs:flex-1 sm:flex-none sm:w-[130px] md:w-[150px]">
              <SingleSelect
                value={selectedDateRange === 'custom' ? null : selectedDateRange}
                onChange={(val) => setQuickDate(val || 'today')}
                options={DATE_PERIOD_OPTIONS}
                showAllOption={false}
                placeholder="Period"
                className="w-full h-full"
                buttonClassName={`!rounded-xl !px-3 !py-2 !h-full !text-xs sm:!text-sm !font-bold border transition-all ${selectedDateRange !== 'custom'
                  ? '!bg-paymint-green/5 !border-paymint-green !text-paymint-green ring-2 ring-paymint-green shadow-lg shadow-paymint-green/10'
                  : '!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10'
                  }`}
              />
            </div>

            {/* Date Range Group */}
            {(() => {
              const isDateFiltered = selectedDateRange === 'custom';
              return (
                <div className={`flex-none w-auto min-w-[145px] sm:min-w-[170px] relative z-[60]`}>
                  <div className={`flex flex-col justify-center px-3 py-1.5 rounded-xl border transition-all ${isDateFiltered ? 'bg-paymint-green/5 border-paymint-green ring-2 ring-paymint-green shadow-lg shadow-paymint-green/10' : 'bg-gray-50 dark:bg-white/5 border-transparent'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-black tracking-wider transition-colors ${isDateFiltered ? "text-[#7CC39F]" : "text-gray-400"}`}>Date Range</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CustomDatePicker
                        value={startDate}
                        onChange={(val) => { setStartDate(val); setSelectedDateRange('custom'); setSelectedShiftId(null); }}
                        className="w-[95px] sm:w-[105px]"
                        maxDate={endDate}
                        showIcon={true}
                      />
                      <span className={`text-xs font-light transition-colors flex-shrink-0 ${isDateFiltered ? "text-[#7CC39F]/50" : "text-gray-300 dark:text-white/20"}`}>→</span>
                      <CustomDatePicker
                        value={endDate}
                        onChange={(val) => { setEndDate(val); setSelectedDateRange('custom'); setSelectedShiftId(null); }}
                        className="w-[95px] sm:w-[105px]"
                        minDate={startDate}
                        showIcon={true}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Time Range Group */}
            {(() => {
              const isTimeFiltered = startTime !== '00:00' || endTime !== '23:59';
              return (
                <div className={`flex-none w-auto min-w-[155px] sm:min-w-[180px] relative z-[55]`}>
                  <div className={`flex flex-col justify-center px-3 py-1.5 rounded-xl border transition-all ${isTimeFiltered ? 'bg-paymint-green/5 border-paymint-green ring-2 ring-paymint-green shadow-lg shadow-paymint-green/10' : 'bg-gray-50 dark:bg-white/5 border-transparent'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-black tracking-wider transition-colors ${isTimeFiltered ? "text-[#7CC39F]" : "text-gray-400"}`}>Active Hours</span>
                    </div>
                    <div className="flex items-center gap-2 justify-between relative">
                      <CustomTimePicker
                        value={startTime}
                        onChange={(val) => { setStartTime(val); setSelectedShiftId(null); }}
                        className="w-[85px] sm:w-[95px]"
                        showIcon={true}
                      />
                      <span className={`text-xs font-bold transition-colors flex-shrink-0 ${isTimeFiltered ? "text-[#7CC39F]/50" : "text-gray-300 dark:text-white/10"}`}>-</span>
                      <CustomTimePicker
                        value={endTime}
                        onChange={(val) => { setEndTime(val); setSelectedShiftId(null); }}
                        className="w-[85px] sm:w-[95px]"
                        showIcon={true}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Vertical Divider (visible on larger screens) */}
            <div className="hidden xl:block w-px self-stretch bg-gray-100 dark:bg-white/10 my-1" />

            {/* Staff Dropdown */}
            <div className="flex-1 min-w-[120px] sm:min-w-[150px] relative z-50">
              <SingleSelect
                value={selectedEmployeeId}
                onChange={(val) => {
                  setSelectedEmployeeId(val);
                  setSelectedShiftId(null);
                }}
                options={employees}
                placeholder="All Staff"
                className="w-full h-full"
                buttonClassName="!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10 !rounded-xl !px-3 !py-2 !h-full !text-xs sm:!text-sm !font-bold"
              />
            </div>

            {/* Shift Dropdown */}
            <div className={`flex-1 min-w-[120px] sm:min-w-[150px] relative z-40 ${!selectedEmployeeId ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
              <SingleSelect
                value={selectedShiftId}
                onChange={setSelectedShiftId}
                options={employeeShifts}
                placeholder="Select Shift"
                className="w-full h-full"
                buttonClassName="!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10 !rounded-xl !px-3 !py-2 !h-full !text-xs sm:!text-sm !font-bold"
              />
            </div>

          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black text-gray-400 tracking-widest">Processing Analytics...</p>
          </div>
        ) : (
          <motion.div key={reportType} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {(reportType === 'sales' || reportType === 'taxes') && salesData && (
              <SalesView 
                salesData={salesData} 
                selectedDateRange={selectedDateRange}
                setShowPayInOutModal={setShowPayInOutModal}
              />
            )}

            {reportType === 'top-items' && itemReportData && (
              <ItemsView 
                itemReportData={itemReportData}
                itemReportTab={itemReportTab}
                setItemReportTab={setItemReportTab}
                itemSearchQuery={itemSearchQuery}
                setItemSearchQuery={setItemSearchQuery}
                isFetching={isFetching}
              />
            )}

            {reportType === 'staff-sales' && (
              <StaffView 
                shifts={shifts}
                selectedEmployeeId={selectedEmployeeId}
                employees={employees}
                employeeShifts={employeeShifts}
              />
            )}

            {reportType === 'shifts' && (
              <ShiftsView shifts={shifts} />
            )}

            {reportType === 'cash-discrepancy' && (
              <CashDiscrepancyView shifts={shifts} />
            )}

            {reportType === 'receipts' && (
              <ReceiptsReport
                startDate={effectiveDateRange.start}
                endDate={effectiveDateRange.end}
                employeeId={selectedEmployeeId}
              />
            )}

            {reportType === 'peak-hours' && (
              <PeakHoursView peakHours={peakHours} />
            )}

            {reportType === 'payments' && salesData && (
              <PaymentsView 
                salesData={salesData}
                effectiveDateRange={effectiveDateRange}
                selectedDateRange={selectedDateRange}
              />
            )}

            {reportType === 'discounts' && salesData && (
              <DiscountsView salesData={salesData} isFetching={isFetching} />
            )}

            {reportType === 'taxes' && salesData && (
              <TaxesView salesData={salesData} />
            )}

          </motion.div>
        )}
      </AnimatePresence>

      <PayInPayOutLogModal
        isOpen={showPayInOutModal}
        onClose={() => setShowPayInOutModal(false)}
        startDate={effectiveDateRange.start}
        endDate={effectiveDateRange.end}
        employeeId={selectedEmployeeId}
      />
    </div>
  );
}
