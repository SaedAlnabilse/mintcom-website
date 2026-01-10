import { useState, useEffect } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subYears } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Clock,
  ChevronRight,
  TrendingUp,
  Download,
  MoreVertical,
  ChevronLeft
} from 'lucide-react';
import api from '../../config/api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { exportToCSV } from '../../utils/export';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  customer?: {
    name: string;
    phone: string;
  };
  user?: {
    username: string;
  };
  note?: string;
  status?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, dateFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      if (statusFilter === 'HELD') {
        const response = await api.get('/api/held-orders');
        const heldOrders = response.data.map((h: any) => ({
          id: h.id,
          orderNumber: h.nickname,
          total: h.orderData?.total || 0,
          subtotal: h.orderData?.subtotal || 0,
          tax: h.orderData?.tax || 0,
          discount: h.orderData?.discount?.amount || 0,
          paymentMethod: 'N/A',
          paymentStatus: 'HELD',
          status: 'HELD',
          createdAt: h.pinnedAt,
          items: (h.orderData?.items || []).map((item: any) => ({
            id: item.itemId,
            name: item.name,
            quantity: item.quantity,
            price: item.basePrice,
            total: item.finalPrice,
          })),
          user: {
            username: h.heldBy?.username || 'Unknown',
          },
          note: h.orderData?.note,
        }));
        setOrders(heldOrders);
        setTotalPages(1);
        setError('');
        setIsLoading(false);
        return;
      }

      const params: any = {
        page,
        limit: 20,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const now = new Date();
      let start, end;

      switch (dateFilter) {
        case 'week':
          start = startOfWeek(now, { weekStartsOn: 1 });
          end = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case 'all':
          start = subYears(now, 10);
          end = endOfDay(now);
          break;
        case 'today':
        default:
          start = startOfDay(now);
          end = endOfDay(now);
          break;
      }

      params.startDate = start.toISOString();
      params.endDate = end.toISOString();

      const response = await api.get('/reports/orders-history', { params });
      setOrders(response.data.orders || response.data || []);
      setTotalPages(response.data.totalPages || 1);
      setError('');
    } catch (err: any) {
      console.error('Orders fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const searchOrder = async () => {
    if (!searchQuery.trim()) {
      fetchOrders();
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get(`/api/orders/by-number/${searchQuery}`);
      if (response.data) {
        setOrders([response.data]);
      } else {
        setOrders([]);
      }
      setError('');
    } catch (err: any) {
      setError('Order not found');
      setOrders([]);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-paymint-green/10 text-paymint-green border-paymint-green/20';
      case 'PENDING':
      case 'HELD':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'REFUNDED':
        return 'bg-paymint-red/10 text-paymint-red border-paymint-red/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const handleExport = () => {
    const exportData = orders.map(o => ({
      orderNumber: o.orderNumber,
      date: formatDate(o.createdAt),
      customer: o.customer?.name || 'Walk-in',
      total: o.total,
      status: o.paymentStatus || o.status,
      paymentMethod: o.paymentMethod
    }));

    exportToCSV(exportData, 'orders_history', {
      orderNumber: 'Order #',
      date: 'Date',
      customer: 'Customer',
      total: 'Total (JOD)',
      status: 'Status',
      paymentMethod: 'Payment Method'
    });
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6">
      {/* Header - Fixed */}
      {/* Header - Fixed */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cream-50 via-cream-100 to-cream-50 dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-cream-300 dark:border-white/5 shadow-sm shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
              <ShoppingBag size={28} className="text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Orders History</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Track and manage every transaction across your business</p>
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
              onClick={fetchOrders}
              className="p-3.5 rounded-xl bg-cream-50 dark:bg-white/5 border border-cream-300 dark:border-white/10 text-gray-500 hover:text-paymint-green shadow-sm hover:shadow-md transition-all hover:scale-105"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary - Fixed */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Volume', value: formatCurrency(orders.reduce((acc, o) => acc + (o.total || 0), 0)), icon: TrendingUp, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
          { label: 'Orders Processed', value: orders.length, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Pending/Held', value: orders.filter(o => o.status === 'HELD' || o.paymentStatus === 'PENDING').length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-3xl bg-cream-50 dark:bg-[#0A0A0A] border border-cream-300 dark:border-white/5 shadow-md hover:shadow-lg hover:border-cream-400 dark:hover:border-white/10 transition-all flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar - Fixed */}
      <div className="shrink-0 p-4 bg-cream-50 dark:bg-[#0A0A0A] rounded-3xl border border-cream-300 dark:border-white/5 shadow-md flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-paymint-green transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
            placeholder="Search by order ID or customer..."
            className="w-full pl-12 pr-4 py-3 bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green/30 transition-all font-medium"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-paymint-green/20 transition-all font-bold text-sm cursor-pointer min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="HELD">Held Orders</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-paymint-green/20 transition-all font-bold text-sm cursor-pointer min-w-[140px]"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-300 dark:border-white/5 shadow-md overflow-hidden flex flex-col min-h-0">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {isLoading && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20">
              <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Syncing Transactions...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="w-24 h-24 bg-cream-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No orders found</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white dark:bg-[#0A0A0A]">
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Order Details</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Customer Info</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                <AnimatePresence mode='popLayout'>
                  {orders.map((order) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedOrder(order)}
                      className="group hover:bg-cream-100 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-white/5 flex items-center justify-center text-gray-500 group-hover:bg-paymint-green/20 group-hover:text-paymint-green group-hover:border-paymint-green/30 transition-colors">
                            <ShoppingBag size={18} />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">#{order.orderNumber}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-800 dark:text-gray-300">{order.customer?.name || 'Walk-in Customer'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{order.user?.username ? `Staff: ${order.user.username}` : 'POS Transaction'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-black text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 font-black uppercase tracking-widest">{order.paymentMethod}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(order.paymentStatus || order.status || 'PENDING')}`}>
                          {order.paymentStatus || order.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-gray-400 hover:text-paymint-green hover:bg-cream-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                            <MoreVertical size={18} />
                          </button>
                          <div className="w-8 h-8 rounded-full bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-white/5 flex items-center justify-center text-gray-500 group-hover:bg-paymint-green group-hover:text-black group-hover:border-paymint-green transition-all">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls - Fixed */}
        {totalPages > 1 && (
          <div className="shrink-0 px-8 py-4 border-t border-cream-300 dark:border-white/5 bg-cream-100 dark:bg-[#0A0A0A] flex items-center justify-between">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-500">
              Page <span className="text-gray-900 dark:text-white font-black">{page}</span> of {totalPages}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 rounded-xl bg-cream-50 dark:bg-white/5 border border-cream-300 dark:border-white/10 text-gray-600 dark:text-gray-500 hover:border-paymint-green/30 hover:text-paymint-green disabled:opacity-30 disabled:hover:border-cream-300 disabled:hover:text-gray-600 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2.5 rounded-xl bg-paymint-green text-black shadow-lg shadow-paymint-green/20 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onRefundSuccess={fetchOrders}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
}
