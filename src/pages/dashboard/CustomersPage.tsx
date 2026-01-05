import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../config/api';
import toast from 'react-hot-toast';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  points: number;
  tier: string;
  totalSpent: number;
  totalVisits: number;
  createdAt: string;
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pointsAction, setPointsAction] = useState<'add' | 'deduct'>('add');
  const [pointsAmount, setPointsAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState('newest');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    fetchCustomers();
  }, [page, sortOption]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);

      let sortBy = 'joinDate';
      let sortOrder = 'desc';

      switch (sortOption) {
        case 'oldest':
          sortBy = 'joinDate';
          sortOrder = 'asc';
          break;
        case 'name_asc':
          sortBy = 'name';
          sortOrder = 'asc';
          break;
        case 'name_desc':
          sortBy = 'name';
          sortOrder = 'desc';
          break;
        case 'points_high':
          sortBy = 'points';
          sortOrder = 'desc';
          break;
        case 'points_low':
          sortBy = 'points';
          sortOrder = 'asc';
          break;
        case 'spent_high':
          sortBy = 'totalSpent';
          sortOrder = 'desc';
          break;
        case 'visits_high':
          sortBy = 'visits';
          sortOrder = 'desc';
          break;
      }

      const response = await api.get('/customers', {
        params: {
          page,
          limit: 20,
          search: searchQuery,
          sortBy,
          sortOrder
        },
      });
      const data = response.data;
      if (data && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (Array.isArray(data)) {
        setCustomers(data);
        setTotalPages(1);
      } else {
        setCustomers([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const searchCustomers = async () => {
    setPage(1);
    fetchCustomers();
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    reset({ name: '', phone: '', email: '', address: '', notes: '' });
    setShowModal(true);
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

  const openDetailModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);

    try {
      const response = await api.get(`/customers/${customer.id}/orders`);
      const data = response.data;
      if (data && Array.isArray(data.orders)) {
        setCustomerOrders(data.orders);
      } else if (Array.isArray(data)) {
        setCustomerOrders(data);
      } else {
        setCustomerOrders([]);
      }
    } catch (err) {
      console.error('Failed to load customer orders');
      setCustomerOrders([]);
    }
  };

  const openPointsModal = (customer: Customer, action: 'add' | 'deduct') => {
    setSelectedCustomer(customer);
    setPointsAction(action);
    setPointsAmount(0);
    setShowPointsModal(true);
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true);

      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, data);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', data);
        toast.success('Customer created successfully');
      }

      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePointsSubmit = async () => {
    if (!selectedCustomer || pointsAmount <= 0) return;

    try {
      setIsSubmitting(true);

      if (pointsAction === 'add') {
        await api.post(`/customers/${selectedCustomer.id}/points/add`, {
          points: pointsAmount,
        });
        toast.success(`Added ${pointsAmount} points`);
      } else {
        await api.post(`/customers/${selectedCustomer.id}/points/deduct`, {
          points: pointsAmount,
        });
        toast.success(`Deducted ${pointsAmount} points`);
      }

      setShowPointsModal(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update points');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (customerId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/customers/${customerId}`);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'GOLD':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'SILVER':
        return 'bg-gray-400/20 text-gray-300';
      case 'PLATINUM':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-orange-500/20 text-orange-400';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-gray-400 text-sm">Manage your customer database</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
            placeholder="Search by name, phone, or email..."
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={searchCustomers}
          className="px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Search
        </button>
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); fetchCustomers(); }}
            className="px-4 py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="points_high">Points (High-Low)</option>
          <option value="points_low">Points (Low-High)</option>
          <option value="spent_high">Total Spent (High-Low)</option>
          <option value="visits_high">Visits (High-Low)</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-green-500 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-400">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-400 mb-4">No customers found</p>
            <button onClick={openCreateModal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Add your first customer
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Customer</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Phone</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Points</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Tier</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Total Spent</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Visits</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {customers.map((customer) => {
                    if (!customer) return null;
                    const initial = customer.name ? customer.name.charAt(0).toUpperCase() : '?';
                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-700/30 cursor-pointer"
                        onClick={() => openDetailModal(customer)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold">
                                {initial}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{customer.name || 'Unknown'}</p>
                              {customer.email && <p className="text-gray-400 text-sm">{customer.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{customer.phone}</td>
                        <td className="px-6 py-4 text-green-400 font-medium">{customer.points}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getTierColor(customer.tier)}`}>
                            {customer.tier || 'Bronze'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white">{formatCurrency(customer.totalSpent)}</td>
                        <td className="px-6 py-4 text-gray-300">{customer.totalVisits}</td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openPointsModal(customer, 'add')}
                            className="text-green-500 hover:text-green-400 mr-2"
                            title="Add Points"
                          >
                            +Pts
                          </button>
                          <button
                            onClick={() => openEditModal(customer)}
                            className="text-blue-500 hover:text-blue-400 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="text-red-500 hover:text-red-400"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input type="text" {...register('name')} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                <input type="tel" {...register('phone')} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input type="email" {...register('email')} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                <input type="text" {...register('address')} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea {...register('notes')} rows={2} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 flex items-center justify-center gap-2">
                  {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Points Modal */}
      {showPointsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {pointsAction === 'add' ? 'Add Points' : 'Deduct Points'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Current: {selectedCustomer.points} points
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setPointsAction('add')}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${pointsAction === 'add' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  Add
                </button>
                <button
                  onClick={() => setPointsAction('deduct')}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${pointsAction === 'deduct' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  Deduct
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Points Amount</label>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(Number(e.target.value))}
                  min={1}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowPointsModal(false)} className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
                <button
                  onClick={handlePointsSubmit}
                  disabled={isSubmitting || pointsAmount <= 0}
                  className={`flex-1 py-2.5 text-white rounded-lg flex items-center justify-center gap-2 ${pointsAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:bg-gray-600`}
                >
                  {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Customer Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedCustomer.name || 'Unknown'}</h3>
                  <p className="text-gray-400">{selectedCustomer.phone}</p>
                  {selectedCustomer.email && <p className="text-gray-400">{selectedCustomer.email}</p>}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{selectedCustomer.points}</p>
                  <p className="text-gray-400 text-sm">Points</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className={`text-lg font-bold ${getTierColor(selectedCustomer.tier).replace('bg-', 'text-').replace('/20', '')}`}>{selectedCustomer.tier || 'Bronze'}</p>
                  <p className="text-gray-400 text-sm">Tier</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  <p className="text-gray-400 text-sm">Total Spent</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedCustomer.totalVisits}</p>
                  <p className="text-gray-400 text-sm">Visits</p>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Order History</h4>
                {customerOrders.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No orders yet</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {customerOrders.map((order: any) => (
                      <div key={order.id} className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Order #{order.orderNumber}</p>
                          <p className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <p className="text-white font-medium">{formatCurrency(order.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => setShowDetailModal(false)} className="w-full py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
