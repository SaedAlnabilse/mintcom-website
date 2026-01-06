import { useState, useEffect } from 'react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmployeeFormModal } from '../../components/forms/EmployeeFormModal';

interface Staff {
  id: string;
  name: string; // Updated to required string
  username: string;
  email?: string;
  role: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  permissions?: string[];
  allowedDiscounts?: string[];
}

interface Discount {
  id: string;
  name: string;
  percentage: number;
  adminOnly: boolean;
}

export function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    fetchStaff();
    fetchDiscounts();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/users');
      // Ensure name is a string
      const staffData = (response.data || []).map((s: any) => ({
          ...s,
          name: s.name || '',
      }));
      setStaff(staffData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load staff');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiscounts = async () => {
      try {
          const response = await api.get('/app-settings/discounts');
          // Map backend data to frontend structure if needed
          const mappedDiscounts = (response.data || []).map((d: any) => ({
              id: d.id,
              name: d.name,
              percentage: d.percentage,
              adminOnly: d.adminOnly || false,
          }));
          setDiscounts(mappedDiscounts);
      } catch (err) {
          console.error('Failed to load discounts');
      }
  };

  const openCreateModal = () => {
    setEditingStaff(null);
    setShowModal(true);
  };

  const openEditModal = (member: Staff) => {
    setEditingStaff(member);
    setShowModal(true);
  };

  const onSubmit = async (payload: any) => {
    try {
      setIsSubmitting(true);

      if (editingStaff) {
        await api.put(`/api/users/${editingStaff.id}`, payload);
        toast.success('Staff updated successfully');
      } else {
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
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Staff Member',
      message: `Are you sure you want to delete "${username}"?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/users/${staffId}`);
          toast.success('Staff deleted successfully');
          fetchStaff();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete staff');
        }
      }
    });
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
      <EmployeeFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={onSubmit}
        onDelete={editingStaff ? () => handleDelete(editingStaff.id, editingStaff.username) : undefined}
        initialData={editingStaff}
        availableDiscounts={discounts}
        isSubmitting={isSubmitting}
      />

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
