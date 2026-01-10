import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Users,
  Mail,
  Phone,
  Shield,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Briefcase,
  Download
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmployeeFormModal } from '../../components/forms/EmployeeFormModal';
import { exportToCSV } from '../../utils/export';
interface Staff {
  id: string;
  name: string;
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
      setStaff(response.data || []);
    } catch (err: any) {
      toast.error('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const response = await api.get('/app-settings/discounts');
      setDiscounts(response.data || []);
    } catch (err) {
      console.error('Failed to load discounts');
    }
  };

  const openEditModal = (member: Staff) => {
    setEditingStaff(member);
    setShowModal(true);
  };

  const handleExport = () => {
    const exportData = staff.map(s => ({
      username: s.username,
      name: s.name,
      role: s.role,
      email: s.email || 'N/A',
      phone: s.phone || 'N/A',
      status: s.isActive ? 'Active' : 'Inactive',
      joined: new Date(s.createdAt).toLocaleDateString()
    }));

    exportToCSV(exportData, 'staff_directory', {
      username: 'Username',
      name: 'Full Name',
      role: 'Role',
      email: 'Email',
      phone: 'Phone',
      status: 'Status',
      joined: 'Join Date'
    });
  };

  const onEmployeeSubmit = async (payload: any) => {
    try {
      setIsSubmitting(true);
      if (editingStaff) {
        await api.put(`/api/users/${editingStaff.id}`, payload);
        toast.success('Member updated');
      } else {
        await api.post('/api/users', payload);
        toast.success('Member added');
      }
      setShowModal(false);
      fetchStaff();
    } catch (err: any) {
      toast.error('Error saving team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (staffId: string, username: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Member',
      message: `Are you sure you want to remove ${username}? They will lose all access.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/users/${staffId}`);
          toast.success('Member removed');
          fetchStaff();
        } catch (err: any) {
          toast.error('Failed to remove member');
        }
      }
    });
  };

  const getRoleStyle = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'MANAGER':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-paymint-green/10 text-paymint-green border-paymint-green/20';
    }
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
              <Users size={28} className="text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Team Management</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Manage staff access, roles, and system permissions</p>
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
              onClick={() => { setEditingStaff(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-paymint-green/30"
            >
              <Plus size={18} />
              <span>Add Team Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Team', value: staff.length, icon: Users, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
          { label: 'Active Now', value: staff.filter(s => s.isActive).length, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Administrators', value: staff.filter(s => s.role === 'ADMIN').length, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Managers', value: staff.filter(s => s.role === 'MANAGER').length, icon: Briefcase, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-3xl bg-cream-50 dark:bg-[#0A0A0A] border border-cream-200 dark:border-white/5 shadow-md hover:shadow-lg hover:border-cream-300 dark:hover:border-white/10 transition-all">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main List */}
      <div className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-200 dark:border-white/5 shadow-md overflow-hidden">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Team Data...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="py-32 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-cream-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-cream-200 dark:border-transparent">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Your team is empty</h3>
            <p className="text-gray-500 max-w-xs font-medium mx-auto">Start by adding your first team member to give them access to the platform.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream-200 dark:border-white/5">
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Member Details</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Role & Access</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 dark:divide-white/5">
                {staff.map((member, idx) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-cream-100 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform duration-300">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 dark:text-white">{member.username}</p>
                          <p className="text-xs text-gray-500 font-medium">{member.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRoleStyle(member.role)}`}>
                        <Shield size={10} />
                        {member.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail size={12} className="text-gray-400" />
                          <span className="font-medium">{member.email || 'No Email'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone size={12} className="text-gray-400" />
                          <span className="font-medium">{member.phone || 'No Phone'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${member.isActive ? 'text-paymint-green' : 'text-gray-400'}`}>
                        {member.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {member.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-2.5 rounded-xl bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-transparent text-gray-600 dark:text-gray-500 hover:text-paymint-green hover:bg-cream-200 hover:border-paymint-green/30 transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id, member.username)}
                          className="p-2.5 rounded-xl bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-transparent text-gray-600 dark:text-gray-500 hover:text-paymint-red hover:bg-paymint-red/10 hover:border-paymint-red/30 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2.5 rounded-xl bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-transparent text-gray-600 dark:text-gray-500">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmployeeFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={onEmployeeSubmit}
        onDelete={editingStaff ? () => handleDelete(editingStaff.id, editingStaff.username) : undefined}
        initialData={editingStaff || undefined}
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