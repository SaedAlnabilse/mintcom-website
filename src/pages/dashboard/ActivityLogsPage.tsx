import { useState, useEffect } from 'react';
import {
  Search,
  History,
  X,
  Shield,
  FileText,
  Download
} from 'lucide-react';

import api from '../../config/api';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/export';
import { SingleSelect } from '../../components/SingleSelect';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import { Pagination } from '../../components/ui';

interface ActivityLog {
  id: string;
  userId: string;
  performedBy?: {
    username: string;
    name: string;
  };
  action: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

const actionColors: Record<string, string> = {
  // Inventory
  'Added product': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Updated product': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Deleted product': 'bg-paymint-red/10 text-paymint-red border-paymint-red/20',
  'Removed product image': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Deleted all products': 'bg-paymint-red/10 text-paymint-red border-paymint-red/20',
  'Added category': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Updated category': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Deleted category': 'bg-paymint-red/10 text-paymint-red border-paymint-red/20',

  // Staff
  'Added employee': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Deleted employee': 'bg-gray-500/10 text-gray-500 border-gray-500/20',

  // Settings
  'Updated restaurant name': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Updated working hours': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Updated farewell message': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Updated restaurant logo': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Updated tax rate': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Updated loyalty program': 'bg-pink-500/10 text-pink-500 border-pink-500/20',

  // Payments & Discounts
  'Added discount': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  'Updated discount': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Deleted discount': 'bg-paymint-red/10 text-paymint-red border-paymint-red/20',
  'Added payment method': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  'Updated payment method': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Deleted payment method': 'bg-paymint-red/10 text-paymint-red border-paymint-red/20',
};

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Date Filters State
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activePreset, setActivePreset] = useState('today');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, actionFilter, dateRange, searchQuery]);

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);

    if (preset === 'custom') {
      return; // Don't change dates on click if custom
    }

    const { start, end } = calculateDateRange(preset as DatePeriod);
    setDateRange({
      start: formatDateForInput(start),
      end: formatDateForInput(end)
    });
    setPage(1);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    setActivePreset('custom');
    setDateRange(prev => ({ ...prev, [type]: value }));
    setPage(1);
  };

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        page,
        limit: 10,
        search: searchQuery,
      };

      if (actionFilter !== 'all') params.action = actionFilter;

      if (dateRange.start) {
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        params.startDate = start.toISOString();
      }

      if (dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }

      const response = await api.get('/activity-log', { params });

      const logsData = response.data.logs || response.data;
      const validLogs = Array.isArray(logsData) ? logsData : [];

      setLogs(validLogs);
      setTotalPages(response.data.totalPages || 1);
      setTotalLogs(response.data.total || validLogs.length);
    } catch {
      toast.error('Failed to sync logs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const handleExport = () => {
    if (!Array.isArray(logs)) return;
    const exportData = logs.map(l => ({
      time: formatDate(l.timestamp),
      user: l.performedBy?.username || 'Owner',
      action: l.action,
      desc: l.description,
      ip: l.ipAddress
    }));

    exportToCSV(exportData, 'system_activity', {
      time: 'Time',
      user: 'User',
      action: 'Action',
      desc: 'Details',
      ip: 'IP Address'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
              History
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Activity</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">
            See recent changes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          >
            <Download size={18} />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full">
          <div className="flex-1 w-full xl:w-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search logs..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            {/* Action Filter */}
            <div className="w-full md:w-64">
              <SingleSelect
                value={actionFilter === 'all' ? null : actionFilter}
                onChange={(val) => { setActionFilter(val || 'all'); setPage(1); }}
                options={[
                  { label: 'Product: Add', value: 'Added product' },
                  { label: 'Product: Update', value: 'Updated product' },
                  { label: 'Product: Delete', value: 'Deleted product' },
                  { label: 'Product: Remove Image', value: 'Removed product image' },
                  { label: 'Category: Add', value: 'Added category' },
                  { label: 'Category: Update', value: 'Updated category' },
                  { label: 'Category: Delete', value: 'Deleted category' },
                  { label: 'Staff: Add', value: 'Added employee' },
                  { label: 'Staff: Delete', value: 'Deleted employee' },
                  { label: 'Update: Name', value: 'Updated restaurant name' },
                  { label: 'Update: Hours', value: 'Updated working hours' },
                  { label: 'Update: Message', value: 'Updated farewell message' },
                  { label: 'Update: Logo', value: 'Updated restaurant logo' },
                  { label: 'Update: Tax', value: 'Updated tax rate' },
                  { label: 'Update: Loyalty', value: 'Updated loyalty program' },
                  { label: 'Discount: Add', value: 'Added discount' },
                  { label: 'Discount: Update', value: 'Updated discount' },
                  { label: 'Discount: Delete', value: 'Deleted discount' },
                  { label: 'Payment: Add', value: 'Added payment method' },
                  { label: 'Payment: Update', value: 'Updated payment method' },
                  { label: 'Payment: Delete', value: 'Deleted payment method' },
                ]}
                allOptionLabel="All Actions"
                placeholder="All Actions"
              />
            </div>

            {/* Date Filters Container - Split for visual feedback */}
            <div className="flex items-center gap-3">
              {/* Presets Dropdown */}
              <div className={`w-40 rounded-2xl transition-all ${activePreset !== 'custom' ? 'ring-2 ring-paymint-green shadow-lg shadow-paymint-green/10' : ''}`}>
                <SingleSelect
                  value={activePreset === 'custom' ? null : activePreset}
                  onChange={(val) => {
                    if (val) handlePresetChange(val);
                  }}
                  options={DATE_PERIOD_OPTIONS}
                  placeholder="Custom Range"
                  showAllOption={false}
                  allowClear={false}
                />
              </div>

              {/* Custom Date Inputs Group */}
              <div className={`flex-none w-auto min-w-[145px] sm:min-w-[170px] relative z-[60]`}>
                <div className={`flex flex-col justify-center px-3 py-1.5 rounded-xl border transition-all ${activePreset === 'custom' ? 'bg-paymint-green/5 border-paymint-green ring-2 ring-paymint-green shadow-lg shadow-paymint-green/10' : 'bg-gray-50 dark:bg-white/5 border-transparent'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-black tracking-wider transition-colors ${activePreset === 'custom' ? "text-[#7CC39F]" : "text-gray-400"}`}>Date Range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CustomDatePicker
                      value={dateRange.start}
                      onChange={(val) => handleCustomDateChange('start', val)}
                      className="w-[95px] sm:w-[105px]"
                      maxDate={dateRange.end}
                      showIcon={true}
                    />
                    <span className={`text-xs font-light transition-colors flex-shrink-0 ${activePreset === 'custom' ? "text-[#7CC39F]/50" : "text-gray-300 dark:text-white/20"}`}>→</span>
                    <CustomDatePicker
                      value={dateRange.end}
                      onChange={(val) => handleCustomDateChange('end', val)}
                      className="w-[95px] sm:w-[105px]"
                      minDate={dateRange.start}
                      showIcon={true}
                      align="right"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Logs Area */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-[300px] lg:min-h-[250px] lg:min-h-[350px]">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
            {isLoading ? (
              <div className="py-32 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin" />
                  <p className="text-xs font-black text-gray-400 tracking-widest">Loading logs...</p>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-32 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                    <History size={24} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-bold text-xs tracking-widest">No logs found.</p>
                </div>
              </div>
            ) : (
              Array.isArray(logs) && logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black">
                        {log.performedBy?.username?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight truncate max-w-[150px]">{log.performedBy?.username || 'Owner'}</p>
                        <p className="text-xs text-gray-400 font-black">{log.ipAddress || 'Internal'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest border ${getActionColor(log.action)}`}>
                      {log.action?.replace(/_/g, ' ').charAt(0).toUpperCase() + log.action?.replace(/_/g, ' ').slice(1).toLowerCase()}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
                    {log.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{formatDate(log.timestamp).split(',')[1]}</span>
                      <span className="text-[10px] font-bold text-gray-400">{formatDate(log.timestamp).split(',')[0]}</span>
                    </div>
                    {log.metadata && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-green transition-all"
                      >
                        <FileText size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Time</th>
                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 tracking-widest">User</th>
                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Action</th>
                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Details</th>
                <th className="px-8 py-4 text-right text-xs font-black text-gray-400 tracking-widest">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin" />
                        <p className="text-xs font-black text-gray-400 tracking-widest">Loading logs...</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                          <History size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-bold text-xs tracking-widest">No logs found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  Array.isArray(logs) && logs.map((log) => (
                    <tr
                      key={log.id}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatDate(log.timestamp).split(',')[1]}</span>
                          <span className="text-xs font-bold text-gray-400">{formatDate(log.timestamp).split(',')[0]}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                            {log.performedBy?.username?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight truncate max-w-[100px]">{log.performedBy?.username || 'Owner'}</p>
                            <p className="text-xs text-gray-400 font-black">{log.ipAddress || 'Internal'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-black tracking-widest border ${getActionColor(log.action)}`}>
                          {log.action?.replace(/_/g, ' ').charAt(0).toUpperCase() + log.action?.replace(/_/g, ' ').slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 max-w-sm line-clamp-1 group-hover:line-clamp-none transition-all">
                          {log.description}
                        </p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        {log.metadata ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-green transition-all"
                          >
                            <FileText size={16} />
                          </button>
                        ) : (
                          <span className="text-xs font-black text-gray-200 dark:text-white/5 tracking-widest">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-6 mx-8 mb-6" />
      </div>

      {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div
              className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-gray-200 dark:border-white/5 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
            >
              <div className="p-8 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-paymint-green/10 text-paymint-green flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log Details</h2>
                    <p className="text-xs font-black text-paymint-green tracking-widest">{selectedLog.action ? selectedLog.action.replace(/_/g, ' ').charAt(0).toUpperCase() + selectedLog.action.replace(/_/g, ' ').slice(1).toLowerCase() : ''}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-black text-gray-400 tracking-widest mb-2">Time</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 tracking-widest mb-2">User</p>
                    <p className="font-bold text-gray-900 dark:text-white">{selectedLog.performedBy?.name || 'Administrative Account'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black text-gray-400 tracking-widest mb-3">Data</p>
                  <pre className="bg-gray-50 dark:bg-black/40 p-6 rounded-[1.5rem] overflow-x-auto text-xs text-gray-700 dark:text-paymint-green font-mono leading-relaxed border border-gray-200 dark:border-white/5">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-8 border-t border-gray-200 dark:border-white/5">
                <button onClick={() => setSelectedLog(null)} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl tracking-widest text-xs hover:scale-[1.02] transition-transform">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
