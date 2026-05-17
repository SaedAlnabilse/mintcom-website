import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { endOfDay, startOfDay, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Clock, ShoppingBag,
  Download, CreditCard, Percent, Scale,
  Users, PlusCircle
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../utils/dateLocale';
import { useAuth } from '../../context/AuthContext';
import { checkPermission, usePermissionGuard } from '../../hooks/usePermissionGuard';

import { ReceiptsReport } from '../../components/dashboard/reports/ReceiptsReport';
import { SingleSelect } from '../../components/SingleSelect';
import { exportToCSV } from '../../utils/export';
import { DateRangePicker } from '../../components/DateRangePicker';
import { CustomTimePicker } from '../../components/CustomTimePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import type { SalesSummary, Shift, ItemReportData, PeakHour, ShiftOption } from '../../types';
import {
  emptyItemReportData,
  emptySalesSummary,
  normalizeItemReportData,
  normalizePeakHours,
  normalizeSalesSummary,
  normalizeShifts,
} from '../../utils/reportFallbacks';

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
import { formatInputPlaceholder } from '../../utils/textCase';

type ReportType = 'sales' | 'top-items' | 'top-categories' | 'top-modifiers' | 'peak-hours' | 'shifts' | 'staff-sales' | 'payments' | 'discounts' | 'taxes' | 'receipts' | 'cash-discrepancy';

interface EmployeeOption {
  label: string;
  value: string;
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { account, currentEstablishment } = useAuth();
  const { currencySymbol } = useCurrency();
  usePermissionGuard(['view_reports']);

  const canExport = useMemo(() => checkPermission(account, ['export_data']), [account]);

  const browserTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

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

  // Tooltip State for Pills
  const [hoveredReportId, setHoveredReportId] = useState<string | null>(null);
  const [tooltipCoords, setTooltipCoords] = useState({ top: 0, left: 0 });

  const handlePillMouseEnter = (e: React.MouseEvent, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipCoords({
      top: rect.top - 12,
      left: rect.left + rect.width / 2
    });
    setHoveredReportId(id);
  };

  const localizedDateOptions = useMemo(() =>
    DATE_PERIOD_OPTIONS.map(opt => ({
      ...opt,
      label: t(`common.datePeriods.${opt.value}`)
    })), [t]);

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
    } else if (reportIndex !== -1) {
      navigate(`/dashboard/${locationSlug}/reports/sales`, { replace: true });
    }
  }, [location, locationSlug, navigate]);

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

  const [salesData, setSalesData] = useState<SalesSummary>(emptySalesSummary);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [itemReportData, setItemReportData] = useState<ItemReportData>(emptyItemReportData);

  // Filter State - (Simplified version, complex filters removed as unused)

  useEffect(() => {
    if (!currentEstablishment?.id) {
      setEmployees([]);
      return;
    }

    fetchEmployees();
  }, [currentEstablishment?.id]);

  const fetchEmployees = async () => {
    try {
      if (!currentEstablishment?.id) {
        return;
      }

      const res = await api.get('/reports/employees');
      setEmployees(res.data?.map((u: any) => ({ label: u.name, value: u.id })) || []);
    } catch (error: any) {
      console.error('[Reports] Failed to load employees', error?.response?.status, error?.response?.data || error);
    }
  };

  useEffect(() => {
    const fetchEmployeeShifts = async () => {
      if (!currentEstablishment?.id || !selectedEmployeeId) {
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
        const sortedShifts = (res.data || []).sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setEmployeeShifts(sortedShifts.map((s: any) => ({
          label: `${format(new Date(s.startTime), 'MMM d, HH:mm', { locale: getDateLocale(t('common.locale')) })} - ${s.endTime ? format(new Date(s.endTime), 'HH:mm', { locale: getDateLocale(t('common.locale')) }) : t('dashboard.shiftStatus.activeOnly')}`,
          value: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          totalSales: s.totalSales || 0,
          orderCount: s.orderCount || 0,
          totalDiscounts: s.totalDiscounts || 0,
          totalRefunds: s.totalRefunds || 0,
          variance: s.variance || s.discrepancy || 0,
        })) || []);
      } catch (error: any) {
        console.error('[Reports] Failed to load employee shifts', error?.response?.status, error?.response?.data || error);
      }
    };
    fetchEmployeeShifts();
  }, [currentEstablishment?.id, selectedEmployeeId, startDate, endDate]);

  const [isFetching, setIsFetching] = useState(false);
  const prevReportType = useRef<ReportType>(reportType);

  useEffect(() => {
    if (!currentEstablishment?.id) {
      return;
    }

    // Determine if we need a hard loading state (blocking)
    const isMajorSwitch = prevReportType.current !== reportType;
    // Initial load check
    const hasData =
      (reportType === 'sales' && salesData) ||
      (reportType === 'payments' && salesData) ||
      (reportType === 'discounts' && salesData) ||
      (reportType === 'taxes' && salesData) ||
      (reportType === 'top-items' && itemReportData) ||
      (reportType === 'peak-hours' && true) ||
      (reportType === 'staff-sales' && true) ||
      (reportType === 'shifts' && true) ||
      (reportType === 'receipts' && true); // Receipts are fetched inside the component

    // If switching report types or no data yet, block UI.
    // Otherwise (filters/sub-tabs), just show fetching indicator.
    if (isMajorSwitch || !hasData) {
      setIsLoading(true);
    }

    fetchReportData();
    prevReportType.current = reportType;
  }, [reportType, startDate, endDate, startTime, endTime, selectedEmployeeId, selectedShiftId, itemReportTab, currentEstablishment?.id]);

  const fetchReportData = async () => {
    try {
      if (!currentEstablishment?.id) {
        return;
      }

      setIsFetching(true);

      const commonParams: Record<string, string> = {
        startDate: effectiveDateRange.start,
        endDate: effectiveDateRange.end,
      };

      if (selectedEmployeeId) {
        commonParams.employeeId = selectedEmployeeId;
      }

      switch (reportType) {
        case 'sales':
        case 'payments':
        case 'taxes': {
          const salesRes = await api.get('/reports/historical-summary', { params: commonParams });
          setSalesData(normalizeSalesSummary(salesRes.data));
          break;
        }
        case 'discounts': {
          const discountRes = await api.get('/reports/discounts', { params: commonParams });
          const rawReports = discountRes.data?.reports;
          const discountReports = Array.isArray(rawReports) ? rawReports.filter((r: any) => r) : [];

          setSalesData(normalizeSalesSummary({
            totalDiscounts: discountRes.data?.totalDiscountGiven || 0,
            totalDiscountCount: (Array.isArray(discountReports) ? discountReports : []).reduce((acc: number, curr: any) => acc + (curr.count || 0), 0),
            discountBreakdown: (Array.isArray(discountReports) ? discountReports : []).map((r: any) => ({
                name: r.name || 'Unknown',
                count: r.count || 0,
                value: r.totalAmount || 0
              }))
          }));
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
            params: commonParams,
          });
          setItemReportData(normalizeItemReportData(itemRes.data));
          break;
        }
        case 'peak-hours': {
          const peakRes = await api.get('/reports/peak-hours', { params: { ...commonParams, timezone: browserTimeZone } });
          setPeakHours(normalizePeakHours(peakRes.data));
          break;
        }
        case 'staff-sales': {
          const staffSalesRes = await api.get('/reports/shifts', { params: { ...commonParams, limit: 50 } });
          setShifts(normalizeShifts(staffSalesRes.data));
          break;
        }
        case 'shifts': {
          const shiftsRes = await api.get('/reports/shifts', { params: { ...commonParams, limit: 20 } });
          setShifts(normalizeShifts(shiftsRes.data));
          break;
        }
        case 'cash-discrepancy': {
          const shiftsRes = await api.get('/reports/shifts', { params: { ...commonParams, limit: 100 } });
          setShifts(normalizeShifts(shiftsRes.data));
          break;
        }
      }
    } catch (error: any) {
      console.error('[Reports] Failed to load report data', {
        reportType,
        establishmentId: currentEstablishment?.id,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      if (reportType === 'sales' || reportType === 'payments' || reportType === 'discounts' || reportType === 'taxes') {
        setSalesData(emptySalesSummary());
      }
      if (reportType === 'top-items') {
        setItemReportData(emptyItemReportData());
      }
      if (reportType === 'peak-hours') {
        setPeakHours([]);
      }
      if (reportType === 'staff-sales' || reportType === 'shifts' || reportType === 'cash-discrepancy') {
        setShifts([]);
      }
      toast.error(t('dashboard.messages.loadFailed'));
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
        headers = {
          date: t('orders.exportFields.date'),
          revenue: `${t('dashboard.stats.revenue')} (${currencySymbol})`,
          count: t('orders.exportFields.orderNumber')
        };
        break;
      case 'top-items':
        dataToExport = itemReportData?.breakdown || [];
        headers = {
          itemName: t('orders.table.order'),
          quantity: t('orders.reports.items.unitsSold'),
          totalSales: t('orders.reports.items.grossRevenue')
        };
        break;
      case 'peak-hours':
        dataToExport = peakHours;
        headers = {
          hour: t('orders.reports.sales.hours'),
          total: t('dashboard.stats.revenue'),
          count: t('orders.exportFields.orderNumber')
        };
        break;
      case 'shifts':
        dataToExport = shifts.map(s => {
          const start = new Date(s.startTime);
          const end = s.endTime ? new Date(s.endTime) : new Date();
          const hoursWorked = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toLocaleString(t('common.locale'), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          const cashOverShort = s.discrepancy !== null && s.discrepancy !== undefined
            ? (s.discrepancy > 0.001 ? `+${s.discrepancy.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('dashboard.stats.over')}` : s.discrepancy < -0.001 ? `${s.discrepancy.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('dashboard.stats.short')}` : '0')
            : t('dashboard.shiftStatus.live');
          return {
            username: s.user?.username,
            period: `${start.toLocaleTimeString()} - ${s.endTime ? end.toLocaleTimeString() : t('dashboard.shiftStatus.live')}`,
            hoursWorked: hoursWorked,
            opening: s.openingBalance,
            sales: s.totalSales,
            closing: s.closingBalance !== null && s.closingBalance !== undefined ? s.closingBalance : t('dashboard.shiftStatus.live'),
            cashOverShort: cashOverShort,
            status: s.status
          };
        });
        headers = {
          username: t('orders.table.staff'),
          period: t('orders.reports.shifts.time'),
          hoursWorked: t('orders.reports.sales.hours'),
          opening: t('orders.reports.shifts.opening'),
          sales: t('orders.reports.shifts.sales'),
          closing: t('orders.reports.shifts.closing'),
          cashOverShort: t('orders.reports.shifts.variance'),
          status: t('orders.reports.shifts.status')
        };
        break;
    }

    exportToCSV(dataToExport, filename, headers);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('dashboard.menu.salesAndReporting')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('dashboard.trackingPerformance')}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green label-strong font-outfit border border-mintcom-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
                    </p>
        </div>

        <div className="flex items-center gap-3">
          {canExport && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
            >
              <Download size={18} className="text-gray-900 dark:text-white" />
              <span>{t('orders.export')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Filter Strip */}
      <div className="space-y-2">
        {/* Report Type Selector - Improved Pills */}
        <div className="flex w-full gap-2 overflow-x-auto scrollbar-none pb-2">
          {[
            { id: 'sales', label: t('dashboard.menu.salesSummary'), icon: TrendingUp },
            { id: 'items-categories', label: t('dashboard.menu.salesByItems'), icon: ShoppingBag },
            { id: 'addons', label: t('dashboard.menu.salesByAddons'), icon: PlusCircle },
            { id: 'staff-sales', label: t('dashboard.menu.salesByStaff'), icon: Users },
            { id: 'shifts', label: t('dashboard.menu.shiftsReports'), icon: Clock },
            { id: 'cash-discrepancy', label: t('dashboard.menu.cashGapReports'), icon: Scale },
            { id: 'payments', label: t('dashboard.menu.paymentsReports'), icon: CreditCard },
            { id: 'discounts', label: t('dashboard.menu.discountReports'), icon: Percent },
          ].map((type) => {
            const isSelected = type.id === 'items-categories'
              ? (reportType === 'top-items' && (itemReportTab === 'items' || itemReportTab === 'categories'))
              : type.id === 'addons'
                ? (reportType === 'top-items' && (itemReportTab === 'modifiers' || itemReportTab === 'attributes'))
                : reportType === type.id;

            return (
              <button
                key={type.id}
                onMouseEnter={(e) => handlePillMouseEnter(e, type.id)}
                onMouseLeave={() => setHoveredReportId(null)}
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
                className={`relative flex-none lg:flex-1 flex flex-col xl:flex-row items-center justify-center gap-1.5 xl:gap-2 px-3 py-2.5 xl:py-3 rounded-xl transition-none isolate min-w-[60px] lg:min-w-0 ${isSelected
                  ? 'text-black shadow-lg shadow-mintcom-green/20'
                  : 'bg-white dark:bg-[#1E293B] text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'
                  }`}
              >
                {isSelected && (
                  <div className="absolute inset-0 bg-[#7dc6a2] rounded-xl" />
                )}
                <div className="flex items-center justify-center relative z-10">
                  <type.icon size={14} className={isSelected ? 'text-black' : 'text-gray-400'} />
                </div>
                <span className="text-xs font-black tracking-wide truncate relative z-10">{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Portal for Pill Tooltips */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {hoveredReportId && (
              <div
                className="fixed z-[9999] pointer-events-none"
                style={{
                  top: tooltipCoords.top,
                  left: tooltipCoords.left,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-bold text-center rounded-lg shadow-2xl whitespace-nowrap relative"
                >
                  {[
                    { id: 'sales', label: t('dashboard.menu.salesSummary') },
                    { id: 'items-categories', label: t('dashboard.menu.salesByItems') },
                    { id: 'addons', label: t('dashboard.menu.salesByAddons') },
                    { id: 'staff-sales', label: t('dashboard.menu.salesByStaff') },
                    { id: 'shifts', label: t('dashboard.menu.shiftsReports') },
                    { id: 'cash-discrepancy', label: t('dashboard.menu.cashGapReports') },
                    { id: 'payments', label: t('dashboard.menu.paymentsReports') },
                    { id: 'discounts', label: t('dashboard.menu.discountReports') },
                  ].find(r => r.id === hoveredReportId)?.label}
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gray-900 dark:border-t-white"></div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
        {/* Unified Filter Dashboard */}

        {/* Unified Filter Control Deck */}
        <div className="bg-white dark:bg-[#1E293B] rounded-[20px] shadow-xl shadow-indigo-500/5 dark:shadow-black/20 border border-gray-100 dark:border-white/[0.05] p-2">
          {/* Single Row Layout - wraps on smaller screens */}
          <div className="flex flex-wrap items-stretch gap-2">

            {/* Quick Period Dropdown */}
            <div className="w-full xs:w-auto xs:flex-1 sm:flex-none sm:w-[130px] md:w-[150px]">
              <SingleSelect
                value={selectedDateRange === 'custom' ? null : selectedDateRange}
                onChange={(val) => setQuickDate(val || 'today')}
                options={localizedDateOptions}
                showAllOption={false}
                placeholder={formatInputPlaceholder(t('owner.overview.selectPeriod'), t('common.locale'))}
                className="w-full h-full"
                buttonClassName={`!h-12 !rounded-xl !px-4 !text-xs sm:!text-sm !font-bold border transition-all ${selectedDateRange !== 'custom'
                  ? '!bg-mintcom-green/5 !border-mintcom-green !text-mintcom-green ring-2 ring-mintcom-green shadow-lg shadow-mintcom-green/10'
                  : '!bg-white dark:!bg-[#1E293B] !border-gray-200 dark:!border-white/10 hover:!bg-gray-50 dark:hover:!bg-white/10'
                  }`}
              />
            </div>

            {/* Date Range Picker */}
            <div className="flex-none min-w-[180px] sm:min-w-[220px] relative z-[60]">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onRangeChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                  setSelectedDateRange('custom');
                  setSelectedShiftId(null);
                }}
                onClear={() => setQuickDate('today')}
                isActive={selectedDateRange === 'custom'}
                align="left"
              />
            </div>

            {/* Time Range Group */}
            {(() => {
              const isTimeFiltered = startTime !== '00:00' || endTime !== '23:59';
              return (
                <div className={`flex-none w-auto min-w-[155px] sm:min-w-[180px] relative z-[55]`}>
                  <div className={`flex flex-col justify-center px-3 h-12 rounded-xl border transition-all shadow-sm ${isTimeFiltered
                    ? 'bg-mintcom-green/5 border-mintcom-green ring-2 ring-mintcom-green shadow-lg shadow-mintcom-green/10'
                    : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-white/10 hover:border-mintcom-green/50'
                    }`}>
                    <div className="flex items-center gap-2 justify-between relative">
                      <CustomTimePicker
                        value={startTime}
                        onChange={(val) => { setStartTime(val); setSelectedShiftId(null); }}
                        className="w-[85px] sm:w-[95px]"
                        showIcon={true}
                        isActive={isTimeFiltered}
                      />
                      <span className={`text-xs font-bold transition-colors flex-shrink-0 ${isTimeFiltered ? "text-[#7dc6a2]/50" : "text-gray-300 dark:text-white/10"}`}>-</span>
                      <CustomTimePicker
                        value={endTime}
                        onChange={(val) => { setEndTime(val); setSelectedShiftId(null); }}
                        className="w-[85px] sm:w-[95px]"
                        showIcon={true}
                        isActive={isTimeFiltered}
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
                placeholder={formatInputPlaceholder(t('common.allStaff'), t('common.locale'))}
                className="w-full h-full"
                buttonClassName={`!h-12 !rounded-xl !px-4 !text-xs sm:!text-sm !font-bold border transition-all ${selectedEmployeeId
                  ? '!bg-mintcom-green/5 !border-mintcom-green !text-mintcom-green ring-2 ring-mintcom-green shadow-lg shadow-mintcom-green/10'
                  : '!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10'
                  }`}
              />
            </div>

            {/* Shift Dropdown */}
            <div className={`flex-1 min-w-[120px] sm:min-w-[150px] relative z-40 ${!selectedEmployeeId ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
              <SingleSelect
                value={selectedShiftId}
                onChange={setSelectedShiftId}
                options={employeeShifts}
                placeholder={formatInputPlaceholder(t('common.selectShift'), t('common.locale'))}
                className="w-full h-full"
                buttonClassName={`!h-12 !rounded-xl !px-4 !text-xs sm:!text-sm !font-bold border transition-all ${selectedShiftId
                  ? '!bg-mintcom-green/5 !border-mintcom-green !text-mintcom-green ring-2 ring-mintcom-green shadow-lg shadow-mintcom-green/10'
                  : '!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10'
                  }`}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-mintcom-green/10 border-t-mintcom-green rounded-full animate-spin mb-4" />
            <p className="label-strong font-outfit">{t('dashboard.processing')}</p>
          </div>
        ) : (
          <motion.div key={reportType} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {(reportType === 'sales' || reportType === 'taxes') && (
              <SalesView
                salesData={salesData}
                selectedDateRange={selectedDateRange}
                setShowPayInOutModal={setShowPayInOutModal}
              />
            )}

            {reportType === 'top-items' && (
              <ItemsView
                itemReportData={itemReportData}
                itemReportTab={itemReportTab}
                setItemReportTab={setItemReportTab}
                itemSearchQuery={itemSearchQuery}
                setItemSearchQuery={setItemSearchQuery}
                isFetching={isFetching}
                startDate={effectiveDateRange.start}
                endDate={effectiveDateRange.end}
                selectedEmployeeId={selectedEmployeeId}
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

            {reportType === 'payments' && (
              <PaymentsView
                salesData={salesData}
                effectiveDateRange={effectiveDateRange}
                selectedDateRange={selectedDateRange}
              />
            )}

            {reportType === 'discounts' && (
              <DiscountsView salesData={salesData} isFetching={isFetching} />
            )}

            {reportType === 'taxes' && (
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


