import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../config/api';
import toast from 'react-hot-toast';

const staffSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().min(4, 'Password must be at least 4 characters').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'USER', 'EMPLOYEE']),
  phone: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface Staff {
  id: string;
  username: string;
  email?: string;
  role: 'ADMIN' | 'USER' | 'EMPLOYEE';
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: { role: 'USER' },
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/users');
      setStaff(response.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load staff');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingStaff(null);
    reset({ username: '', email: '', password: '', role: 'USER', phone: '' });
    setShowModal(true);
  };

  const openEditModal = (member: Staff) => {
    setEditingStaff(member);
    reset({
      username: member.username,
      email: member.email || '',
      password: '',
      role: member.role,
      phone: member.phone || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: StaffFormData) => {
    try {
      setIsSubmitting(true);

      const payload: any = {
        username: data.username,
        role: data.role,
      };

      if (data.email) payload.email = data.email;
      if (data.phone) payload.phone = data.phone;
      if (data.password) payload.password = data.password;

      if (editingStaff) {
        await api.put(`/api/users/${editingStaff.id}`, payload);
        toast.success('Staff updated successfully');
      } else {
        if (!data.password) {
          toast.error('Password is required for new staff');
          setIsSubmitting(false);
          return;
        }
        await api.post('/api/users', payload);
        toast.success('Staff created successfully');
      }

      setShowModal(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (staffId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete "${username}"?`)) return;

    try {
      await api.delete(`/api/users/${staffId}`);
      toast.success('Staff deleted successfully');
      fetchStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete staff');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-400';
      case 'USER':
        return 'bg-blue-500/20 text-blue-400';
      case 'EMPLOYEE':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff</h1>
          <p className="text-gray-400 text-sm">Manage your employees</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-green-500 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-400">Loading staff...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-400 mb-4">No staff members yet</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add your first employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Staff Member</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Phone</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold">
                            {member.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white font-medium">{member.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{member.email || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{member.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${member.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(member)}
                        className="text-green-500 hover:text-green-400 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.username)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingStaff ? 'Edit Staff' : 'Add Staff'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username *</label>
                <input
                  type="text"
                  {...register('username')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {editingStaff ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role *</label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <p className="text-gray-500 text-xs mt-1">
                  Admin: Full access | User: Standard access | Employee: Limited access
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {editingStaff ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
