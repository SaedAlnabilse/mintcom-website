import { useState, useEffect } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  ShoppingCart,
  Clock,
  ChevronRight,
  TrendingUp,
  Download,
  MoreVertical,
  ChevronLeft,

  Eye,
  Undo2,
  Calendar
} from 'lucide-react';
import api from '../../config/api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { exportToCSV } from '../../utils/export';
import { toast } from 'react-hot-toast';
import { CustomSelect } from '../../components/CustomSelect';

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
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning';
    confirmText?: string;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, startDate, endDate]);

  useEffect(() => {
    if (activeActionMenu) {
      setTimeout(() => {
        const row = document.querySelector(`[data-order-id="${activeActionMenu}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [activeActionMenu]);

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


      // Date filtering is now handled by startDate and endDate states
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));

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
      currency: 'Jod',
      minimumFractionDigits: 2,
    }).format(value).replace('Jod', '').trim() + ' Jod';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const setQuickDate = (range: string) => {
    setSelectedDateRange(range);
    const today = new Date();
    let start = new Date();
    let end = new Date();
    switch (range) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
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
  };

  const handleRefund = (order: Order) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Refund Order',
      message: 'Are you sure you want to refund this order? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.post(`/api/orders/${order.id}/refund`, {
            reason: 'Refunded via web dashboard',
          });
          toast.success('Order refunded successfully');
          fetchOrders(); // Refresh the list
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to process refund');
        }
      }
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
      total: 'Total (Jod)',
      status: 'Status',
      paymentMethod: 'Payment Method'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black tracking-widest border border-paymint-green/20">
              Transactions
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Orders History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Track and manage every transaction across your business
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchOrders}
            className="p-3 rounded-xl bg-paymint-green text-black hover:bg-emerald-400 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
            placeholder="Search by order ID or customer..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Quick Date Toggles */}
          <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1">
            {['today', 'yesterday', 'this_week'].map((range) => (
              <button
                key={range}
                onClick={() => setQuickDate(range)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold tracking-wide transition-all ${selectedDateRange === range
                  ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {range.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-1 px-3 rounded-xl border border-gray-200 dark:border-white/10 h-[46px]">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setSelectedDateRange('custom'); }}
              className="bg-transparent border-none text-xs font-bold text-gray-900 dark:text-white focus:ring-0 p-0 w-24"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setSelectedDateRange('custom'); }}
              className="bg-transparent border-none text-xs font-bold text-gray-900 dark:text-white focus:ring-0 p-0 w-24"
            />
          </div>

          <div className="w-40">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as string)}
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Held Orders', value: 'HELD' },
                { label: 'Refunded', value: 'REFUNDED' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Volume', value: formatCurrency(orders.reduce((acc, o) => acc + (o.total || 0), 0)), icon: TrendingUp, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
          { label: 'Orders Processed', value: orders.length, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Pending/Held', value: orders.filter(o => o.status === 'HELD' || o.paymentStatus === 'PENDING').length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 tracking-widest mb-0.5">{stat.label}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Orders List Container */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-[400px]">

        {/* Loading State */}
        {isLoading && orders.length === 0 && (
          <div className="py-20 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
              <p className="text-xs font-black text-gray-400">Loading Orders...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && orders.length === 0 && (
          <div className="py-20 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-500">No orders found</p>
            </div>
          </div>
        )}

        {/* Mobile Card View (visible on small screens) */}
        {orders.length > 0 && (
          <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
            <AnimatePresence mode='popLayout'>
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  data-order-id={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedOrder(order)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-white/[0.04]"
                >
                  {/* Card Header: Order # and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500">
                        <ShoppingCart size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">#{order.orderNumber}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border ${getStatusStyle(order.paymentStatus || order.status || 'PENDING')}`}>
                      {order.paymentStatus || order.status}
                    </span>
                  </div>

                  {/* Card Body: Customer and Amount */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 dark:text-gray-300 text-sm truncate">
                        {order.customer?.name || 'Walk-in Customer'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.user?.username ? `Staff: ${order.user.username}` : 'POS'} • {order.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{formatCurrency(order.total)}</p>
                    </div>
                  </div>

                  {/* Card Footer: Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Eye size={14} />
                      View Details
                    </button>

                    {(order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefund(order);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-paymint-red hover:bg-paymint-red/10 transition-colors"
                      >
                        <Undo2 size={14} />
                        Refund
                      </button>
                    )}

                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Desktop Table View (hidden on small screens) */}
        {orders.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr className="border-b border-gray-200 dark:border-white/5">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Order Details</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                <AnimatePresence mode='popLayout'>
                  {orders.map((order) => (
                    <motion.tr
                      key={order.id}
                      data-order-id={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedOrder(order)}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-paymint-green transition-colors">
                            <ShoppingCart size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">#{order.orderNumber}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800 dark:text-gray-300 text-sm">{order.customer?.name || 'Walk-in Customer'}</p>
                        <p className="text-xs text-gray-500">{order.user?.username ? `Staff: ${order.user.username}` : 'POS'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                        <p className="text-[10px] text-gray-500 font-bold tracking-wider">{order.paymentMethod}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border ${getStatusStyle(order.paymentStatus || order.status || 'PENDING')}`}>
                          {order.paymentStatus || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenu(activeActionMenu === order.id ? null : order.id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${activeActionMenu === order.id
                                ? 'text-paymint-green bg-gray-100 dark:bg-white/5'
                                : 'text-gray-400 hover:text-paymint-green hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                              <MoreVertical size={16} />
                            </button>

                            <AnimatePresence>
                              {activeActionMenu === order.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveActionMenu(null);
                                    }}
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                  >
                                    <div className="p-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedOrder(order);
                                          setActiveActionMenu(null);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                      >
                                        <Eye size={14} />
                                        View Details
                                      </button>

                                      {(order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRefund(order);
                                            setActiveActionMenu(null);
                                          }}
                                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-paymint-red hover:bg-paymint-red/10 transition-colors"
                                        >
                                          <Undo2 size={14} />
                                          Refund Order
                                        </button>
                                      )}
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center text-gray-400 group-hover:text-paymint-green group-hover:border-paymint-green/30 transition-all">
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-30"><ChevronLeft size={18} /></button>
            <span className="px-4 text-xs font-bold text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}

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
        confirmText={confirmConfig.confirmText}
        showCancel={confirmConfig.showCancel}
      />
    </div>
  );
}
