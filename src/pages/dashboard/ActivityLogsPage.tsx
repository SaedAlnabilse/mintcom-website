import { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  History,
  X,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/export';

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
  LOGIN: 'bg-paymint-green/10 text-paymint-green border-paymint-green/20',
  LOGOUT: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  CREATE_ORDER: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  REFUND_ORDER: 'bg-paymint-red/10 text-paymint-red border-paymint-red/20',
  START_SHIFT: 'bg-paymint-green/10 text-paymint-green border-paymint-green/20',
  OPEN_SHIFT: 'bg-paymint-green/10 text-paymint-green border-paymint-green/20',
  END_SHIFT: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  UPDATE_SETTINGS: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  CREATE_CUSTOMER: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  ADDED_PRODUCT: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  UPDATED_PRODUCT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DELETED_PRODUCT: 'bg-paymint-red/10 text-paymint-red border-paymint-red/20',
  PRINT_RECEIPT: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
};

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('week');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, actionFilter, dateFilter, searchQuery]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: 15,
        search: searchQuery,
      };

      if (actionFilter !== 'all') params.action = actionFilter;

      const now = new Date();
      if (dateFilter === 'today') {
        params.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.startDate = monthAgo.toISOString();
      }

      const response = await api.get('/activity-log', { params });
      setLogs(response.data.logs || response.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalLogs(response.data.total || (response.data.logs?.length || 0));
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
    const exportData = logs.map(l => ({
      time: formatDate(l.timestamp),
      user: l.performedBy?.username || 'Owner',
      action: l.action,
      desc: l.description,
      ip: l.ipAddress
    }));

    exportToCSV(exportData, 'system_activity', {
      time: 'Execution Time',
      user: 'Operative',
      action: 'Protocol',
      desc: 'Event Description',
      ip: 'IP Address'
    });
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6">
      {/* Header - Fixed */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cream-50 via-cream-100 to-cream-50 dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-cream-300 dark:border-white/5 shadow-sm shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
              <History size={28} className="text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">System Activity</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Audit trail of all administrative operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-white/10 text-gray-900 dark:text-gray-300 font-bold text-sm hover:scale-105 hover:bg-cream-50 dark:hover:bg-white/10 transition-all shadow-sm"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => { setPage(1); fetchLogs(); }}
              className="p-3.5 rounded-xl bg-cream-50 dark:bg-white/5 border border-cream-300 dark:border-white/10 text-gray-500 hover:text-paymint-green shadow-sm hover:shadow-md transition-all hover:scale-105"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel - Fixed */}
      <div className="shrink-0 p-4 bg-cream-50 dark:bg-[#0A0A0A] rounded-[2rem] border border-cream-200 dark:border-white/5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-paymint-green transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search operative, protocol, or event..."
              className="w-full pl-12 pr-4 py-3 bg-cream-100 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-paymint-green/20 transition-all font-medium"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="pl-11 pr-8 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-bold text-xs cursor-pointer appearance-none min-w-[140px] focus:ring-2 focus:ring-paymint-green/20"
              >
                <option value="all">All Operations</option>
                <optgroup label="Authentication" className="bg-white dark:bg-[#1a1a1a]">
                  <option value="LOGIN">Sign In</option>
                  <option value="LOGOUT">Sign Out</option>
                </optgroup>
                <optgroup label="Inventory" className="bg-white dark:bg-[#1a1a1a]">
                  <option value="ADDED_PRODUCT">Product: Added</option>
                  <option value="UPDATED_PRODUCT">Product: Updated</option>
                  <option value="DELETED_PRODUCT">Product: Deleted</option>
                </optgroup>
                <optgroup label="Sales & Terminal" className="bg-white dark:bg-[#1a1a1a]">
                  <option value="CREATE_ORDER">Order: Created</option>
                  <option value="PRINT_RECEIPT">Receipt: Printed</option>
                  <option value="OPEN_SHIFT">Terminal: Shift Open</option>
                  <option value="END_SHIFT">Terminal: Shift End</option>
                </optgroup>
                <optgroup label="CRM" className="bg-white dark:bg-[#1a1a1a]">
                  <option value="CREATE_CUSTOMER">Customer: Created</option>
                </optgroup>
              </select>
            </div>

            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                className="pl-11 pr-8 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-bold text-xs cursor-pointer appearance-none min-w-[140px] focus:ring-2 focus:ring-paymint-green/20"
              >
                <option value="today">Today</option>
                <option value="week">Past 7d</option>
                <option value="month">Past 30d</option>
                <option value="all">Full Hist.</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Logs Area - Flexible and Scrollable */}
      <div className="flex-1 bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-cream-50 dark:bg-[#0A0A0A] border-b border-cream-200 dark:border-white/5">
              <tr className="border-b border-cream-200 dark:border-white/5">
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Execution Time</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operative</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Protocol</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Event Description</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 dark:divide-white/5">
              <AnimatePresence mode='popLayout'>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Syncing Intelligence...</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-cream-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center">
                          <History size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">No matching sequences found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-cream-100 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 dark:text-white whitespace-nowrap">{formatDate(log.timestamp).split(',')[1]}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{formatDate(log.timestamp).split(',')[0]}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                            {log.performedBy?.username?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight truncate max-w-[100px]">{log.performedBy?.username || 'Owner'}</p>
                            <p className="text-[9px] text-gray-400 font-black uppercase">{log.ipAddress || 'Internal'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getActionColor(log.action)}`}>
                          {log.action?.replace(/_/g, ' ')}
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
                            className="p-2 rounded-lg bg-cream-100 dark:bg-white/5 text-gray-400 hover:text-paymint-green transition-all"
                          >
                            <FileText size={16} />
                          </button>
                        ) : (
                          <span className="text-[10px] font-black text-gray-200 dark:text-white/5 uppercase tracking-widest">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination - Fixed at bottom of area */}
        <div className="shrink-0 px-8 py-4 border-t border-cream-200 dark:border-white/5 bg-cream-100/50 dark:bg-[#0A0A0A] flex items-center justify-between">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Sequence <span className="text-gray-900 dark:text-white">{(page - 1) * 15 + 1} - {Math.min(page * 15, totalLogs)}</span> of {totalLogs}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 rounded-xl bg-cream-50 dark:bg-white/5 border border-cream-300 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(3, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === pageNum
                      ? 'bg-paymint-green text-black shadow-md'
                      : 'text-gray-400 hover:text-gray-900'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 rounded-xl bg-cream-50 dark:bg-white/5 border border-cream-300 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-200 dark:border-white/5 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-cream-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-paymint-green/10 text-paymint-green flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Event Details</h2>
                    <p className="text-[10px] font-black text-paymint-green uppercase tracking-widest">{selectedLog.action}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-3 rounded-2xl bg-cream-100 dark:bg-white/5 text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Timestamp</p>
                    <p className="font-bold text-gray-900 dark:text-white">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">User Context</p>
                    <p className="font-bold text-gray-900 dark:text-white">{selectedLog.performedBy?.name || 'Administrative Account'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Structured Metadata</p>
                  <pre className="bg-gray-900 p-6 rounded-[1.5rem] overflow-x-auto text-xs text-paymint-green font-mono leading-relaxed shadow-inner">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-8 border-t border-cream-200 dark:border-white/5 bg-cream-100/50 dark:bg-transparent">
                <button onClick={() => setSelectedLog(null)} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl">
                  Dismiss Protocol
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
