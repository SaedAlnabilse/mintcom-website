import { useState, useEffect } from 'react';
import api from '../../config/api';
import toast from 'react-hot-toast';

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
  LOGIN: 'bg-green-500/20 text-green-400',
  LOGOUT: 'bg-gray-500/20 text-gray-400',
  CREATE_ORDER: 'bg-blue-500/20 text-blue-400',
  REFUND_ORDER: 'bg-red-500/20 text-red-400',
  CREATE_PRODUCT: 'bg-purple-500/20 text-purple-400',
  UPDATE_PRODUCT: 'bg-yellow-500/20 text-yellow-400',
  DELETE_PRODUCT: 'bg-red-500/20 text-red-400',
  CREATE_CATEGORY: 'bg-purple-500/20 text-purple-400',
  UPDATE_CATEGORY: 'bg-yellow-500/20 text-yellow-400',
  DELETE_CATEGORY: 'bg-red-500/20 text-red-400',
  UPDATE_SETTINGS: 'bg-yellow-500/20 text-yellow-400',
  CREATE_USER: 'bg-purple-500/20 text-purple-400',
  UPDATE_USER: 'bg-yellow-500/20 text-yellow-400',
  DELETE_USER: 'bg-red-500/20 text-red-400',
  START_SHIFT: 'bg-green-500/20 text-green-400',
  END_SHIFT: 'bg-orange-500/20 text-orange-400',
  PAY_IN: 'bg-green-500/20 text-green-400',
  PAY_OUT: 'bg-red-500/20 text-red-400',
};

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('week');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
        limit: 25,
        search: searchQuery,
      };

      if (actionFilter !== 'all') {
        params.action = actionFilter;
      }

      if (dateFilter === 'today') {
        params.startDate = new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.startDate = monthAgo.toISOString().split('T')[0];
      }

      const response = await api.get('/activity-log', { params });
      setLogs(response.data.logs || response.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || 'bg-gray-500/20 text-gray-400';
  };

  const filteredLogs = logs;

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
        <p className="text-gray-400 text-sm">Track all system activities and changes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[250px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, action, or description..."
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Actions</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="CREATE_ORDER">Create Order</option>
          <option value="REFUND_ORDER">Refund Order</option>
          <option value="CREATE_PRODUCT">Create Product</option>
          <option value="UPDATE_PRODUCT">Update Product</option>
          <option value="DELETE_PRODUCT">Delete Product</option>
          <option value="UPDATE_SETTINGS">Update Settings</option>
          <option value="START_SHIFT">Start Shift</option>
          <option value="END_SHIFT">End Shift</option>
          <option value="PAY_IN">Pay In</option>
          <option value="PAY_OUT">Pay Out</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>

        <button
          onClick={fetchLogs}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-green-500 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-400">Loading activity logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400">No activity logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Timestamp</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">User</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Action</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Description</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">IP Address</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-300">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-700/30">
                      <td className="px-6 py-4 text-gray-300 text-sm whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-semibold">
                              {log.performedBy?.username?.charAt(0).toUpperCase() || log.performedBy?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white text-sm font-medium">{log.performedBy?.username || 'Unknown'}</span>
                            <span className="text-gray-400 text-xs">{log.performedBy?.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action)}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 max-w-md truncate">
                        {log.description}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm font-mono">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {log.metadata && (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-green-500 hover:text-green-400"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Activity Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Timestamp</p>
                <p className="text-white">{formatDate(selectedLog.timestamp)}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">User</p>
                <p className="text-white">{selectedLog.performedBy?.username || 'Unknown'} ({selectedLog.performedBy?.name})</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Action</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getActionColor(selectedLog.action)}`}>
                  {selectedLog.action?.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Description</p>
                <p className="text-white">{selectedLog.description}</p>
              </div>

              {selectedLog.ipAddress && (
                <div>
                  <p className="text-gray-400 text-sm">IP Address</p>
                  <p className="text-white font-mono">{selectedLog.ipAddress}</p>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Metadata</p>
                  <pre className="bg-gray-700 p-4 rounded-lg overflow-x-auto text-sm text-gray-300">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <button
                onClick={() => setSelectedLog(null)}
                className="w-full py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
