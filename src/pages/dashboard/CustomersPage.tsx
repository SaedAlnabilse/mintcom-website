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
  Star,
  ShoppingBag,
  Calendar,
  MoreVertical,
  Download
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { exportToCSV } from '../../utils/export';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
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
        await api.put(`/customers/${editingCustomer.id}`, data);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', data);
        toast.success('Customer created');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error('Error saving customer');
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
          toast.error('Failed to delete');
        }
      }
    });
  };

  const handlePointsUpdate = async () => {
    if (!selectedCustomer || pointsAmount <= 0) return;
    setIsSubmitting(true);
    try {
      await api.post(`/customers/${selectedCustomer.id}/points`, {
        amount: pointsAction === 'add' ? pointsAmount : -pointsAmount,
        reason: 'Manual adjustment',
      });
      toast.success('Loyalty points adjusted');
      setShowPointsModal(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error('Failed to adjust points');
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

  const handleExport = () => {
    const exportData = customers.map(c => ({
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
      tier: 'Loyalty Tier',
      points: 'Points Balance',
      totalSpent: 'Total Spent (JOD)',
      visits: 'Total Visits'
    });
  };

  const getTierStyle = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'gold': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'silver': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-paymint-green/10 text-paymint-green border-paymint-green/20';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'JOD',
    }).format(value).replace('JOD', '').trim() + ' JOD';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cream-50 via-cream-100 to-cream-50 dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-cream-300 dark:border-white/5 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
              <User size={28} className="text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Customer CRM</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Nurture relationships and manage loyalty rewards programs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditingCustomer(null); reset({ name: '', phone: '', email: '', address: '', notes: '' }); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-paymint-green/30"
            >
              <Plus size={18} />
              <span>Add New Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="shrink-0 flex items-center gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-paymint-green transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone number, or email address..."
            className="w-full pl-11 pr-4 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green/30 transition-all text-sm font-medium shadow-md"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-6 py-3.5 bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-transparent text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-cream-200 dark:hover:bg-white/10 hover:border-gray-300 transition-all flex items-center gap-2"
          >
            <Download size={18} className="text-paymint-green" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-200 dark:border-white/5 shadow-md overflow-hidden min-h-[500px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32">
            <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Syncing CRM Data...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32 text-center">
            <div className="w-24 h-24 bg-cream-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-cream-200 dark:border-transparent">
              <User className="w-12 h-12 text-gray-400 dark:text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No customers found</h3>
            <p className="text-gray-500 max-w-xs font-medium">Start building your community by adding your first customer.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream-200 dark:border-white/5">
                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Customer Identity</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Loyalty Status</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Contact & Reach</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Lifetime Value</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 dark:divide-white/5">
                  {customers.map((customer, idx) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-cream-100 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => { setSelectedCustomer(customer); setShowDetailModal(true); }}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black group-hover:scale-110 transition-transform duration-300">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">{customer.name}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{customer.totalVisits} Total Visits</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1.5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border w-fit ${getTierStyle(customer.tier)}`}>
                            {customer.tier}
                          </span>
                          <p className="text-xs font-bold text-paymint-green">{customer.points} Points Available</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">{customer.phone}</p>
                        <p className="text-xs text-gray-500">{customer.email || 'No Email'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-black text-gray-900 dark:text-white">{formatCurrency(customer.totalSpent)}</p>
                        <p className="text-[10px] text-paymint-green font-black uppercase tracking-widest">Active Partner</p>
                      </td>
                      <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedCustomer(customer); setPointsAmount(0); setShowPointsModal(true); }}
                            className="p-2.5 rounded-xl bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-transparent text-gray-600 dark:text-gray-400 hover:text-paymint-green hover:border-paymint-green/30 transition-all"
                            title="Adjust Points"
                          >
                            <Award size={18} />
                          </button>
                          <button onClick={() => openEditModal(customer)} className="p-2.5 rounded-xl bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-transparent text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-900 transition-all">
                            <Edit2 size={18} />
                          </button>
                          <button className="p-2.5 rounded-xl bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-transparent text-gray-600 dark:text-gray-400">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-8 py-6 border-t border-cream-200 dark:border-white/5 flex items-center justify-between bg-cream-100/50 dark:bg-black/20">
                <p className="text-sm font-bold text-gray-600 dark:text-gray-500">
                  Page <span className="text-gray-900 dark:text-white font-black">{page}</span> of {totalPages}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-6 py-2.5 bg-cream-50 dark:bg-white/5 border border-cream-300 dark:border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 dark:text-white disabled:opacity-50 hover:border-paymint-green/30 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-6 py-2.5 bg-paymint-green text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-paymint-green/20"
                  >
                    Next Page
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-300 dark:border-white/5 w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-cream-200 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {editingCustomer ? 'Refine Profile' : 'New Identity'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit(handleSaveCustomer)} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full pl-12 pr-4 py-3.5 bg-cream-100 dark:bg-[#1a1a1a] border ${errors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20`}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-[10px] mt-1 font-black uppercase tracking-widest">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                      Phone Line <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className={`w-full px-4 py-3.5 bg-cream-100 dark:bg-[#1a1a1a] border ${errors.phone ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20`}
                    />
                    {errors.phone && <p className="text-red-500 text-[10px] mt-1 font-black uppercase tracking-widest">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Email Access</label>
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full px-4 py-3.5 bg-cream-100 dark:bg-[#1a1a1a] border ${errors.email ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20`}
                    />
                    {errors.email && <p className="text-red-500 text-[10px] mt-1 font-black uppercase tracking-widest">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Delivery Address</label>
                  <input type="text" {...register('address')} className="w-full px-4 py-3.5 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-paymint-green/20" />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 shadow-xl shadow-paymint-green/20 uppercase tracking-widest text-xs">
                  {editingCustomer ? 'Update Identity' : 'Secure Registration'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Points Adjustment Modal */}
      <AnimatePresence>
        {showPointsModal && selectedCustomer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-300 dark:border-white/5 w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="p-8 text-center border-b border-cream-200 dark:border-white/5">
                <div className="w-20 h-20 bg-paymint-green/10 text-paymint-green rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Award size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Adjust Loyalty</h2>
                <p className="text-gray-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Partner: {selectedCustomer.name}</p>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex gap-2 p-1 bg-cream-100 dark:bg-white/5 rounded-2xl">
                  {['add', 'deduct'].map((action) => (
                    <button
                      key={action}
                      onClick={() => setPointsAction(action as 'add' | 'deduct')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${pointsAction === action ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md' : 'text-gray-400'
                        }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
                <div>
                  <input
                    type="number"
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-transparent text-center text-6xl font-black text-paymint-green focus:outline-none"
                    placeholder="00"
                  />
                  <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Points Allocation</p>
                </div>
                <button onClick={handlePointsUpdate} disabled={isSubmitting || pointsAmount <= 0} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl shadow-paymint-green/20 uppercase tracking-widest text-xs">
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
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[3rem] border border-cream-300 dark:border-white/5 w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-10 border-b border-cream-200 dark:border-white/5 bg-cream-100/50 dark:bg-transparent">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-paymint-green/10 text-paymint-green flex items-center justify-center text-3xl font-black shadow-inner">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedCustomer.name}</h2>
                      <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] ${getTierStyle(selectedCustomer.tier)}`}>
                        <Star size={10} /> {selectedCustomer.tier} Partner
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="p-3 bg-cream-100 dark:bg-white/5 rounded-2xl text-gray-400">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Total Volume', value: formatCurrency(selectedCustomer.totalSpent), icon: ShoppingBag },
                    { label: 'Visit Frequency', value: `${selectedCustomer.totalVisits} Orders`, icon: Calendar },
                    { label: 'Loyalty Balance', value: `${selectedCustomer.points} Pts`, icon: Award },
                  ].map((stat, i) => (
                    <div key={i} className="p-5 bg-cream-100 dark:bg-white/5 rounded-[1.5rem] border border-cream-200 dark:border-white/5">
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

                <div className="flex gap-4">
                  <button onClick={() => { setShowDetailModal(false); openEditModal(selectedCustomer); }} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-black/10 transition-all hover:scale-[1.02]">
                    Edit Identity
                  </button>
                  <button onClick={() => { setShowDetailModal(false); handleDeleteCustomer(selectedCustomer); }} className="px-6 py-4 bg-paymint-red/10 text-paymint-red font-black rounded-2xl text-xs uppercase tracking-widest transition-all hover:bg-paymint-red hover:text-white">
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => { setShowDetailModal(false); setShowPointsModal(true); setPointsAmount(0); }} className="flex-1 py-4 bg-paymint-green text-black font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-paymint-green/20 transition-all hover:scale-[1.02]">
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
