import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Users,
  Mail,
  Phone,
  Shield,
  Edit2,
  Trash2,
  XCircle,
  MoreVertical,
  Download,
  Key,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCheck,
  Star
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { EmployeeFormModal } from '../../components/forms/EmployeeFormModal';
import { exportToCSV } from '../../utils/export';
import { SingleSelect } from '../../components/SingleSelect';

interface Staff {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: string;
  phone?: string;
  isActive: boolean;
  isClockedIn?: boolean;
  createdAt: string;
  permissions?: string[];
  allowedDiscounts?: string[];
  customRoleId?: string;
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
  const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const [securityModal, setSecurityModal] = useState<{
    isOpen: boolean;
    memberId: string;
    memberName: string;
  }>({
    isOpen: false,
    memberId: '',
    memberName: ''
  });

  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    if (!activeDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    const handleScroll = () => {
      setActiveDropdown(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeDropdown]);

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

  const filteredStaff = staff.filter(s => {
    const matchesRole = filterRole === 'ALL' || (filterRole === 'USER' ? s.role !== 'ADMIN' : s.role === filterRole);
    const matchesSearch = s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesRole && matchesSearch;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
      email: s.email || 'N/a',
      phone: s.phone || 'N/a',
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

  const handleDelete = (staffId: string, username: string) => {
    setSecurityModal({
      isOpen: true,
      memberId: staffId,
      memberName: username
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
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
              Team
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
              </div>
              <span className="text-xs font-bold text-paymint-green tracking-widest">Live</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Staff</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Manage your team</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStaff}
            className="p-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
            title="Refresh Team Data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
          >
            <Download size={18} />
            <span>Export to CSV</span>
          </button>
          <button
            onClick={() => { setEditingStaff(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20"
          >
            <Plus size={18} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', info: 'Total number of registered users.', value: staff.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Active Now', info: 'Users currently clocked in.', value: staff.filter(s => s.isClockedIn).length, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Admins', info: 'Users with full system access.', value: staff.filter(s => s.role === 'ADMIN').length, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Users', info: 'Standard users with restricted access.', value: staff.filter(s => s.role !== 'ADMIN').length, icon: Star, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <div>
                <p className="text-base font-bold text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-2">{stat.value}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.info}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full md:w-48">
          <SingleSelect
            value={filterRole === 'ALL' ? null : filterRole}
            onChange={(val) => {
              setFilterRole((val as 'ALL' | 'ADMIN' | 'USER') || 'ALL');
              setCurrentPage(1);
            }}
            options={[
              { label: 'Admin', value: 'ADMIN' },
              { label: 'User', value: 'USER' },
            ]}
            allOptionLabel="All Roles"
            placeholder="All Roles"
          />
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors"
            >
              <XCircle size={14} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm min-h-[250px] lg:min-h-[350px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32">
            <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black tracking-widest text-gray-400">Loading Staff...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32 text-center bg-gray-50/30 dark:bg-black/10">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/5 shadow-sm">
              <Users size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">No Staff Found</h3>
            <p className="text-gray-500 max-w-xs text-sm font-medium mx-auto">Add a team member to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr className="border-b border-gray-200 dark:border-white/5">
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-black text-gray-400 tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                <AnimatePresence mode="popLayout">
                  {currentItems.map((member, idx) => (
                    <motion.tr
                      key={member.id}
                      data-member-id={member.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform duration-300">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{member.username}</p>
                            <p className="text-xs text-gray-500">{member.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getRoleStyle(member.role)}`}>
                          <Shield size={10} />
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 font-black text-xs tracking-wide ${!member.isActive
                          ? 'text-paymint-red'
                          : member.isClockedIn
                            ? 'text-paymint-green'
                            : 'text-gray-400'
                          }`}>
                          {!member.isActive ? (
                            <>
                              <XCircle size={14} />
                              <span>Suspended</span>
                            </>
                          ) : member.isClockedIn ? (
                            <>
                              <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
                              </div>
                              <span>Online</span>
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                              <span>Offline</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-90"
                          >
                            <Edit2 size={16} />
                          </button>
                          <div className="relative dropdown-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === member.id ? null : member.id);
                              }}
                              className={`p-2.5 rounded-xl border transition-all active:scale-90 shadow-sm ${activeDropdown === member.id ? 'bg-paymint-green text-black border-paymint-green' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                            >
                              <MoreVertical size={16} />
                            </button>

                            <AnimatePresence>
                              {activeDropdown === member.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden py-1.5"
                                >
                                  <button
                                    onClick={() => { setActiveDropdown(null); toast.success('Reset email sent'); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                                  >
                                    <Key size={14} className="text-paymint-green" />
                                    <span>Reset Password</span>
                                  </button>
                                  <button
                                    onClick={() => { setActiveDropdown(null); handleDelete(member.id, member.username); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black tracking-widest text-paymint-red hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left border-t border-gray-100 dark:border-white/5"
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
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
      </div >

      {/* Pagination Controls */}
      {filteredStaff.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-900 dark:text-white">{indexOfFirstItem + 1}</span> to <span className="font-bold text-gray-900 dark:text-white">{Math.min(indexOfLastItem, filteredStaff.length)}</span> of <span className="font-bold text-gray-900 dark:text-white">{filteredStaff.length}</span> members
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentPage === i + 1
                    ? 'bg-paymint-green text-black'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

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
        confirmText={confirmConfig.confirmText}
        showCancel={confirmConfig.showCancel}
      />

      <SecurityVerificationModal
        isOpen={securityModal.isOpen}
        onClose={() => setSecurityModal(prev => ({ ...prev, isOpen: false }))}
        onSuccess={() => {
          toast.success('Member removed');
          fetchStaff();
        }}
        targetId={securityModal.memberId}
        targetName={securityModal.memberName}
        mode="delete-employee"
      />
    </div >
  );
}
