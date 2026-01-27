import { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  History,
  X,
  Shield,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/export';
import { CustomSelect } from '../../components/CustomSelect';

interface ActivityLog {
  id: string;
  userId: string;
  performedBy?: {
    username: string;
    name: string;
  };
  action: string;
  description: string;
  metadata?: any;
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
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, actionFilter, dateRange, searchQuery]);

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        // Start/End are already now
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
        break;
      case 'week':
        const day = now.getDay(); // 0 is Sunday
        const diff = now.getDate() - day; // adjust when day is sunday
        start.setDate(diff);
        break;
      case 'month': // This Month
        start.setDate(1);
        break;
      case 'custom':
        return; // Don't change dates on click if custom
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
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
      const params: any = {
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
    } catch (err: any) {
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
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black tracking-widest border border-paymint-green/20">
              History
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Activity</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            See recent changes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
          <button
            onClick={() => { setPage(1); fetchLogs(); }}
            className="p-3 rounded-xl bg-paymint-green text-black hover:bg-emerald-400 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
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
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            {/* Action Filter */}
            <div className="w-full md:w-64">
              <CustomSelect
                value={actionFilter}
                onChange={(val) => { setActionFilter(val as string); setPage(1); }}
                options={[
                  { label: 'All Actions', value: 'all' },
                  ...[
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
                  ]
                ]}
              />
            </div>

            {/* Date Filters Container */}
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 w-full md:w-auto overflow-x-auto">
              <div className="flex items-center gap-1">
                {['today', 'yesterday', 'week'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetChange(preset)}
                    className={`
                      px-3 py-2 rounded-lg text-[10px] font-bold tracking-wide transition-all whitespace-nowrap
                      ${activePreset === preset
                        ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}
                    `}
                  >
                    {preset === 'week' ? 'This Week' : preset}
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-gray-200 dark:bg-white/10" />

              <div className="flex items-center gap-2 px-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  className="bg-transparent border-none text-gray-900 dark:text-white font-bold text-xs p-0 focus:ring-0 cursor-pointer w-[85px]"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="bg-transparent border-none text-gray-900 dark:text-white font-bold text-xs p-0 focus:ring-0 cursor-pointer w-[85px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Logs Area */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Time</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">User</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Action</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Details</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              <AnimatePresence mode='popLayout'>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-gray-400 tracking-widest">Loading logs...</p>
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
                        <p className="text-gray-500 font-bold text-[10px] tracking-widest">No logs found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  Array.isArray(logs) && logs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatDate(log.timestamp).split(',')[1]}</span>
                          <span className="text-[10px] font-bold text-gray-400">{formatDate(log.timestamp).split(',')[0]}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                            {log.performedBy?.username?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight truncate max-w-[100px]">{log.performedBy?.username || 'Owner'}</p>
                            <p className="text-[9px] text-gray-400 font-black">{log.ipAddress || 'Internal'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest border ${getActionColor(log.action)}`}>
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
                          <span className="text-[10px] font-black text-gray-200 dark:text-white/5 tracking-widest">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="shrink-0 px-8 py-4 border-t border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-[#1E293B] flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 tracking-widest">
              Showing <span className="text-gray-900 dark:text-white">{(page - 1) * 10 + 1} - {Math.min(page * 10, totalLogs)}</span> of {totalLogs}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-black text-gray-900 dark:text-white px-2">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-gray-200 dark:border-white/5 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
            >
              <div className="p-8 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-paymint-green/10 text-paymint-green flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Log Details</h2>
                    <p className="text-[10px] font-black text-paymint-green tracking-widest">{selectedLog.action ? selectedLog.action.replace(/_/g, ' ').charAt(0).toUpperCase() + selectedLog.action.replace(/_/g, ' ').slice(1).toLowerCase() : ''}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">Time</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">User</p>
                    <p className="font-bold text-gray-900 dark:text-white">{selectedLog.performedBy?.name || 'Administrative Account'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 tracking-widest mb-3">Data</p>
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
