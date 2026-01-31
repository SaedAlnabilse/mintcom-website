import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Receipt,
    ChevronLeft,
    ChevronRight,
    Wallet,
    Undo2,
    Download
} from 'lucide-react';
import { OrderDetailModal } from '../../OrderDetailModal';
import { CustomSelect } from '../../CustomSelect';
import api from '../../../config/api';
import { exportToCSV } from '../../../utils/export';


interface ReceiptsReportProps {
    startDate: string;
    endDate: string;
    employeeId: string | null;
}

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
    items: any[];
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

export function ReceiptsReport({ startDate, endDate, employeeId }: ReceiptsReportProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Fetch orders when filters change
    useEffect(() => {
        fetchOrders();
        setPage(1); // Reset to first page on filter change
    }, [startDate, endDate, employeeId, statusFilter]);

    // Handle page change separately
    useEffect(() => {
        fetchOrders();
    }, [page]);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);

            if (statusFilter === 'HELD') {
                const response = await api.get('/api/held-orders');
                // Map held orders... (simplified for brevity, assume similar structure or handle held orders differently if needed)
                // For now, let's focus on the main history endpoint which is what reports usually show
                const heldOrders = response.data.map((h: any) => ({
                    id: h.id,
                    orderNumber: h.nickname,
                    total: h.orderData?.total || 0,
                    paymentMethod: 'N/a',
                    paymentStatus: 'HELD',
                    status: 'HELD',
                    createdAt: h.pinnedAt,
                    items: [],
                    user: { username: h.heldBy?.username || 'Unknown' }
                }));
                setOrders(heldOrders);
                setTotalPages(1);
                setIsLoading(false);
                return;
            }

            const params: any = {
                page,
                limit: 20,
                startDate,
                endDate,
                // If employeeId is selected, pass it. Note: 'reports/orders-history' might need specific param
                // Assuming the backend supports it or we filter client side if not (backend is better)
                employeeId: employeeId || undefined
            };

            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            // Using the report endpoint which respects date range
            const response = await api.get('/reports/orders-history', { params });
            setOrders(response.data.orders || response.data || []);
            setTotalPages(response.data.totalPages || 1);
        } catch (err) {
            console.error('Failed to fetch receipts', err);
            // toast.error('Failed to load receipts');
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
                setTotalPages(1);
            } else {
                setOrders([]);
            }
        } catch (err) {
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-JO', {
            style: 'currency',
            currency: 'JOD',
            minimumFractionDigits: 3,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString([], {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-paymint-green/10 text-paymint-green border-paymint-green/20';
            case 'PENDING': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'REFUNDED': return 'bg-paymint-red/10 text-paymint-red border-paymint-red/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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

        exportToCSV(exportData, 'receipts_history', {
            orderNumber: 'Receipt #',
            date: 'Date',
            customer: 'Customer',
            total: 'Total (JOD)',
            status: 'Status',
            paymentMethod: 'Payment Method'
        });
    };

    return (
        <div className="space-y-6">
            {/* Sub-Header / KPI - Optional, to give some context inside the tab */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Revenue (Selected Period)', value: formatCurrency(orders.reduce((acc, o) => acc + (o.total || 0), 0)), icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Receipts Count', value: orders.length, icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Refunds / Held', value: orders.filter(o => o.status === 'HELD' || o.paymentStatus === 'REFUNDED').length, icon: Undo2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm flex items-center gap-4"
                    >
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest mb-0.5">{stat.label}</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Local Filters (Search & Status) */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative group bg-white dark:bg-[#0B1120] rounded-xl border border-gray-200 dark:border-white/[0.05] hover:border-paymint-green/50 transition-all p-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
                        placeholder="Search by Receipt #..."
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white focus:ring-0"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-[180px]">
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
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.05] text-gray-900 dark:text-white font-bold text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                    >
                        <Download size={16} className="text-paymint-green" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm flex flex-col min-h-[250px] lg:min-h-[350px]">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
                        <p className="text-xs font-bold text-gray-400">Loading Receipts...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <div className="w-14 h-14 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
                            <Receipt size={24} />
                        </div>
                        <p className="text-sm font-bold text-gray-500">No receipts found</p>
                    </div>
                ) : (
                    <div className="w-full">
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest uppercase">Receipt</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest uppercase">Customer</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest uppercase">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest uppercase">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    <AnimatePresence mode='popLayout'>
                                        {orders.map((order) => (
                                            <motion.tr
                                                key={order.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setSelectedOrder(order)}
                                                className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-paymint-green/10 flex items-center justify-center text-paymint-green">
                                                            <Receipt size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-white text-xs">#{order.orderNumber}</p>
                                                            <p className="text-xs text-gray-500 font-medium">{formatDate(order.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-700 dark:text-gray-300 text-xs">{order.customer?.name || 'Walk-in'}</p>
                                                    <p className="text-xs text-gray-400">{order.user?.username ? `Staff: ${order.user.username}` : 'POS'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900 dark:text-white text-xs">{formatCurrency(order.total)}</p>
                                                    <p className="text-xs text-gray-400 uppercase">{order.paymentMethod}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black border ${getStatusStyle(order.paymentStatus || order.status || 'PENDING')}`}>
                                                        {(order.paymentStatus || order.status || 'PENDING').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-xs font-bold text-paymint-green hover:underline">View Details</button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List */}
                        <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                            {orders.map((order) => (
                                <div key={order.id} className="p-4 active:bg-gray-50 dark:active:bg-white/5" onClick={() => setSelectedOrder(order)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-gray-900 dark:text-white text-sm">#{order.orderNumber}</span>
                                            <span className="mx-2 text-gray-300">|</span>
                                            <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${getStatusStyle(order.paymentStatus || order.status || 'PENDING')}`}>
                                            {(order.paymentStatus || order.status || 'PENDING').toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{order.customer?.name || 'Walk-in'}</span>
                                        <span className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(order.total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center">
                    <div className="flex items-center gap-2 p-1 rounded-xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-30"><ChevronLeft size={16} /></button>
                        <span className="px-4 text-xs font-bold text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-30"><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onRefundSuccess={() => fetchOrders()}
                />
            )}
        </div>
    );
}
