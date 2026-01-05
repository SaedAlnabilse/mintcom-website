import { useState, useEffect } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subYears } from 'date-fns';
import api from '../../config/api';

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
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
          paymentStatus: 'HELD', // Custom status
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
          start = subYears(now, 10); // Go back 10 years for "all time"
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

  const handleRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to refund this order?')) return;

    try {
      await api.post(`/api/orders/${orderId}/refund`, {
        reason: 'Refunded via web dashboard',
      });
      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process refund');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400';
      case 'PENDING':
      case 'HELD':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'REFUNDED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 text-sm">View and manage all orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
              placeholder="Search by order number..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="HELD">Held Orders</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>

        <button
          onClick={fetchOrders}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-green-500 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-400">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Order #</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Date & Time</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Items</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Total</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Payment</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Staff</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-white font-medium">#{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 text-gray-300">{order.items?.length || 0} items</td>
                    <td className="px-6 py-4 text-white font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4 text-gray-300">{order.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{order.user?.username || 'Unknown'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="text-green-500 hover:text-green-400 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Order #{selectedOrder.orderNumber}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Date & Time</p>
                  <p className="text-white">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedOrder.paymentStatus)}`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Payment Method</p>
                  <p className="text-white">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Staff</p>
                  <p className="text-white">{selectedOrder.user?.username || 'Unknown'}</p>
                </div>
                {selectedOrder.customer && (
                  <>
                    <div>
                      <p className="text-gray-400 text-sm">Customer</p>
                      <p className="text-white">{selectedOrder.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Phone</p>
                      <p className="text-white">{selectedOrder.customer.phone}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Items</h3>
                <div className="bg-gray-700/50 rounded-lg divide-y divide-gray-600">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-gray-400 text-sm">Qty: {item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                      <p className="text-white font-medium">{formatCurrency(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300">
                  <span>Tax</span>
                  <span>{formatCurrency(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-600">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.note && (
                <div>
                  <p className="text-gray-400 text-sm">Note</p>
                  <p className="text-white">{selectedOrder.note}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedOrder.paymentStatus === 'COMPLETED' && (
                  <button
                    onClick={() => handleRefund(selectedOrder.id)}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Refund Order
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
