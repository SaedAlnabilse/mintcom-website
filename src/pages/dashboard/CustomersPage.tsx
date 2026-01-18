import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit2,
  History,
  Award,
  X,
  ShoppingBag,
  Calendar,
  MoreVertical,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { exportToCSV } from '../../utils/export';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  tier: string;
  totalSpent: number;
  totalVisits: number;
  address?: string;
  notes?: string;
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointsAction, setPointsAction] = useState<'add' | 'deduct'>('add');
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    fetchCustomers();
  }, [page, searchQuery]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/customers', {
        params: {
          page,
          limit: 10,
          search: searchQuery,
        },
      });
      setCustomers(response.data.customers || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: any) {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomer = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, data);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', data);
        toast.success('Customer created');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Customer',
      message: `Are you sure you want to delete ${customer.name}? All loyalty data will be lost.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/customers/${customer.id}`);
          toast.success('Customer removed');
          fetchCustomers();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete');
        }
      }
    });
  };

  const handlePointsUpdate = async () => {
    if (!selectedCustomer || pointsAmount <= 0) return;
    setPointsError(null);

    if (pointsAction === 'deduct' && pointsAmount > selectedCustomer.points) {
      setPointsError(`Insufficient points. Customer only has ${selectedCustomer.points} points.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/customers/${selectedCustomer.id}/points`, {
        points: pointsAction === 'add' ? pointsAmount : -pointsAmount,
      });
      toast.success('Loyalty points adjusted');
      setShowPointsModal(false);
      setPointsAmount(0);
      fetchCustomers();
    } catch (err: any) {
      setPointsError(err.response?.data?.message || 'Failed to adjust points');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleExport = async () => {
    try {
      toast.loading('Preparing export...', { id: 'export' });
      // Fetch all customers (no limit) for export
      const response = await api.get('/customers', {
        params: {
          limit: 1000, // Large enough limit to get all
          search: searchQuery,
        },
      });

      const allCustomers = response.data.customers || [];

      const exportData = allCustomers.map((c: Customer) => ({
        name: c.name,
        phone: c.phone,
        email: c.email || 'N/A',
        tier: c.tier,
        points: c.points,
        totalSpent: c.totalSpent,
        visits: c.totalVisits
      }));

      exportToCSV(exportData, 'customers_registry', {
        name: 'Full Name',
        phone: 'Phone',
        email: 'Email',
        tier: 'Tier level',
        points: 'Loyalty Points',
        totalSpent: 'Total Spent (JOD)',
        visits: 'Total Visits'
      });
      toast.success('Export complete', { id: 'export' });
    } catch (err) {
      toast.error('Failed to export customers', { id: 'export' });
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'JOD',
    }).format(value).replace('JOD', '').trim() + ' JOD';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-widest border border-paymint-green/20">
              CRM Core
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
              </div>
              <span className="text-[10px] font-bold text-paymint-green uppercase tracking-widest">Live</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Customer Intelligence</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Nurture relationships and manage enterprise loyalty</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => { setEditingCustomer(null); reset({ name: '', phone: '', email: '', address: '', notes: '' }); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20"
          >
            <Plus size={18} />
            <span>Add Partner</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone number, or email address..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
          />
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32">
            <div className="w-12 h-12 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing CRM Registry...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32 text-center bg-gray-50/30 dark:bg-black/10">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/5 shadow-sm">
              <User size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Registry Empty</h3>
            <p className="text-gray-500 max-w-xs text-sm font-medium mx-auto">Initialize your first customer node to build the intelligence database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr className="border-b border-gray-200 dark:border-white/5">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Identity</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Points</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Lifetime Value</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {customers.map((customer, idx) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => { setSelectedCustomer(customer); setShowDetailModal(true); }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform duration-300">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{customer.name}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{customer.totalVisits} Total Visits</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-black text-paymint-green">{customer.points}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Points</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone size={12} className="text-gray-400" />
                          <span className="font-medium">{customer.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail size={12} className="text-gray-400" />
                          <span className="font-medium">{customer.email || 'No Email'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900 dark:text-white text-sm">{formatCurrency(customer.totalSpent)}</p>
                      <p className="text-[10px] text-paymint-green font-black uppercase tracking-widest">Active Partner</p>
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedCustomer(customer); setPointsAmount(0); setShowPointsModal(true); }}
                          className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-paymint-green hover:border-paymint-green/30 transition-all"
                          title="Adjust Points"
                        >
                          <Award size={16} />
                        </button>
                        <button onClick={() => openEditModal(customer)} className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all">
                          <Edit2 size={16} />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(activeMenu === customer.id ? null : customer.id);
                            }}
                            className={`p-2 rounded-lg border transition-all ${activeMenu === customer.id ? 'bg-paymint-green text-black border-paymint-green' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenu === customer.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 z-50 overflow-hidden">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowDetailModal(true);
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                              >
                                <Eye size={14} className="text-paymint-green" />
                                View Profile
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteCustomer(customer);
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-paymint-red hover:bg-paymint-red/10 transition-colors text-left border-t border-gray-100 dark:border-white/5"
                              >
                                <Trash2 size={14} />
                                Delete Customer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div >

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Node <span className="text-gray-900 dark:text-white">{page}</span> of <span className="text-gray-900 dark:text-white">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1.5">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${page === i + 1
                    ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                    : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {editingCustomer ? 'Refine Profile' : 'New Identity'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit(handleSaveCustomer)} className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center">
                    Full Legal Name <span className="text-paymint-red mx-1">*</span>
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-paymint-green transition-colors" />
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="e.g. ALEXANDER HAMILTON"
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                    />
                  </div>
                  {errors.name && <p className="text-paymint-red text-[10px] px-1 font-black uppercase tracking-widest mt-1.5">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
                      Phone Line
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      placeholder="+000 000 000"
                      className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.phone ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                    />
                    {errors.phone && <p className="text-paymint-red text-[10px] px-1 font-black uppercase tracking-widest mt-1.5">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Email Access</label>
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="client@enterprise.com"
                      className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.email ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                    />
                    {errors.email && <p className="text-paymint-red text-[10px] px-1 font-black uppercase tracking-widest mt-1.5">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Delivery Address</label>
                  <input
                    type="text"
                    {...register('address')}
                    placeholder="Enter physical location metadata..."
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-paymint-green/20"
                  >
                    {editingCustomer ? 'Update Identity' : 'Commit Registry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Points Adjustment Modal */}
      <AnimatePresence>
        {showPointsModal && selectedCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowPointsModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-sm overflow-hidden relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowPointsModal(false);
                  setPointsError(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-8 text-center border-b border-gray-100 dark:border-white/5">
                <div className="w-20 h-20 bg-paymint-green/10 text-paymint-green rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Award size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Adjust Loyalty</h2>
                <p className="text-gray-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Partner: {selectedCustomer.name}</p>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                  {['add', 'deduct'].map((action) => (
                    <button
                      key={action}
                      onClick={() => {
                        setPointsAction(action as 'add' | 'deduct');
                        setPointsError(null);
                      }}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${pointsAction === action
                        ? (action === 'deduct' ? 'bg-paymint-red text-white shadow-lg shadow-paymint-red/20' : 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg')
                        : 'text-gray-400'
                        }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
                <div>
                  <input
                    type="number"
                    value={pointsAmount === 0 ? '' : pointsAmount}
                    onChange={(e) => {
                      setPointsAmount(Math.max(0, parseInt(e.target.value) || 0));
                      setPointsError(null);
                    }}
                    className={`w-full bg-transparent text-center text-6xl font-black focus:outline-none ${pointsAction === 'deduct' ? 'text-paymint-red placeholder:text-paymint-red/20' : 'text-paymint-green placeholder:text-paymint-green/20'}`}
                    placeholder="0"
                  />
                  <div className="min-h-[48px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {pointsError ? (
                        <motion.p
                          key="error"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="w-full text-center text-[10px] font-black text-paymint-red uppercase tracking-widest bg-paymint-red/10 py-2 px-3 rounded-lg border border-paymint-red/20"
                        >
                          {pointsError}
                        </motion.p>
                      ) : (
                        <motion.p
                          key="label"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest"
                        >
                          Points Allocation
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <button onClick={handlePointsUpdate} disabled={isSubmitting || pointsAmount <= 0} className={`w-full py-4 font-black rounded-2xl hover:scale-[1.02] uppercase tracking-widest text-xs transition-all shadow-lg ${pointsAction === 'deduct' ? 'bg-paymint-red text-white shadow-paymint-red/20' : 'bg-paymint-green text-black shadow-paymint-green/20'}`}>
                  Confirm Adjustment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Detail View */}
      <AnimatePresence>
        {showDetailModal && selectedCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-10 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-transparent">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-paymint-green/10 text-paymint-green flex items-center justify-center text-3xl font-black">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedCustomer.name}</h2>
                      <div className="mt-2 flex items-center gap-2 text-paymint-green">
                        <Award size={14} className="animate-pulse" />
                        <p className="text-lg font-black tracking-tight">{selectedCustomer.points} Points</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="p-3 bg-white dark:bg-white/5 rounded-2xl text-gray-400 hover:text-black dark:hover:text-white transition-colors shadow-sm">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Total Volume', value: formatCurrency(selectedCustomer.totalSpent), icon: ShoppingBag },
                    { label: 'Visit Frequency', value: `${selectedCustomer.totalVisits} Orders`, icon: Calendar },
                    { label: 'Loyalty Balance', value: `${selectedCustomer.points} Pts`, icon: Award },
                  ].map((stat, i) => (
                    <div key={i} className="p-5 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{stat.label}</p>
                      <p className="text-lg font-black text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Mail size={12} className="text-paymint-green" /> Contact Protocol
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                        <Phone size={14} className="opacity-30" /> {selectedCustomer.phone}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                        <Mail size={14} className="opacity-30" /> {selectedCustomer.email || 'No registry entry'}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                        <MapPin size={14} className="opacity-30" /> {selectedCustomer.address || 'No location defined'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <History size={12} className="text-paymint-green" /> Intelligence Profile
                    </h3>
                    <div className="p-6 bg-paymint-green/5 border border-paymint-green/10 rounded-2xl">
                      <p className="text-[10px] font-black text-paymint-green uppercase tracking-widest mb-2">Internal Analytics</p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                        {selectedCustomer.notes || "No behavioral notes recorded for this partner."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <button onClick={() => { setShowDetailModal(false); handleDeleteCustomer(selectedCustomer); }} className="px-6 py-4 bg-paymint-red/10 text-paymint-red font-black rounded-2xl text-xs uppercase tracking-widest transition-all hover:bg-paymint-red hover:text-white active:scale-95 shadow-sm">
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => { setShowDetailModal(false); openEditModal(selectedCustomer); }} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-lg active:scale-95">
                    Edit Identity
                  </button>
                  <button onClick={() => { setShowDetailModal(false); setShowPointsModal(true); setPointsAmount(0); }} className="flex-1 py-4 bg-paymint-green text-black font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-lg shadow-paymint-green/20 active:scale-95">
                    Adjust Loyalty
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
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
