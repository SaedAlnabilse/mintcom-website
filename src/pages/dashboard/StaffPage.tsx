import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import {
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
  UserCheck,
  Star,
  ArrowUpDown
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { EmployeeFormModal } from '../../components/forms/EmployeeFormModal';
import { exportToCSV } from '../../utils/export';
import { SearchInput, SelectInput, Pagination } from '../../components/ui';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';

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

const MAX_EMPLOYEES_PER_ACCOUNT = 50;
const EMPLOYEE_LIMIT_POPUP_MESSAGE =
  `Maximum is ${MAX_EMPLOYEES_PER_ACCOUNT} employees.\n` +
  `To add more than ${MAX_EMPLOYEES_PER_ACCOUNT} employees, contact PayMint support at support@PayMint.app with your account email and password.`;

export function StaffPage() {
  const { t } = useTranslation();
  const location = useLocation();
  // Permission guard - redirects if user lacks permission
  usePermissionGuard();

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
  const [sortConfig, setSortConfig] = useState<{ key: keyof Staff | 'status'; direction: 'asc' | 'desc' } | null>(null);

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

  useEffect(() => {
    const state = location.state as { openCreateModal?: boolean } | null;
    if (state?.openCreateModal) {
      setEditingStaff(null);
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/users');
      setStaff(response.data || []);
    } catch {
      toast.error(t('staff.messages.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof Staff | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredStaff = useMemo(() => {
    const result = (Array.isArray(staff) ? staff : []).filter(s => {
      const matchesRole = filterRole === 'ALL' || (filterRole === 'USER' ? s.role !== 'ADMIN' : s.role === filterRole);
      const matchesSearch = s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesRole && matchesSearch;
    });

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';

        if (sortConfig.key === 'status') {
          aValue = `${a.isActive ? '1' : '0'}${a.isClockedIn ? '1' : '0'}`;
          bValue = `${b.isActive ? '1' : '0'}${b.isClockedIn ? '1' : '0'}`;
        } else {
          const valA = a[sortConfig.key as keyof Staff];
          const valB = b[sortConfig.key as keyof Staff];
          aValue = (typeof valA === 'string' || typeof valA === 'number') ? valA : String(valA || '');
          bValue = (typeof valB === 'string' || typeof valB === 'number') ? valB : String(valB || '');
        }

        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        // Handle number comparison
        const numA = Number(aValue);
        const numB = Number(bValue);
        if (numA < numB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (numA > numB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [staff, filterRole, searchQuery, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = (Array.isArray(filteredStaff) ? filteredStaff : []).slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil((Array.isArray(filteredStaff) ? filteredStaff : []).length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const fetchDiscounts = async () => {
    try {
      const response = await api.get('/app-settings/discounts');
      setDiscounts(response.data || []);
    } catch {
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
      email: s.email || t('common.notAvailable'),
      phone: s.phone || t('common.notAvailable'),
      status: s.isActive ? t('common.active') : t('common.notAvailable'),
      joined: new Date(s.createdAt).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US')
    }));

    exportToCSV(exportData, 'staff_directory', {
      username: t('staff.form.usernameLabel'),
      name: t('staff.form.nameLabel'),
      role: t('staff.form.roleLabel'),
      email: t('staff.form.emailLabel'),
      phone: t('staff.form.phoneLabel'),
      status: t('staff.table.status'),
      joined: t('staff.table.joined')
    });
  };

  const onEmployeeSubmit = async (payload: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      if (!editingStaff && staff.length >= MAX_EMPLOYEES_PER_ACCOUNT) {
        setConfirmConfig({
          isOpen: true,
          title: t('common.error'),
          message: EMPLOYEE_LIMIT_POPUP_MESSAGE,
          type: 'warning',
          confirmText: t('common.ok'),
          showCancel: false,
          onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false })),
        });
        return;
      }
      if (editingStaff) {
        await api.put(`/api/users/${editingStaff.id}`, payload);
        toast.success(t('staff.messages.updated'));
      } else {
        await api.post('/api/users', payload);
        toast.success(t('staff.messages.created'));
      }
      setShowModal(false);
      fetchStaff();
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      if (
        typeof backendMessage === 'string' &&
        backendMessage.toLowerCase().includes('maximum is 50 employees')
      ) {
        setConfirmConfig({
          isOpen: true,
          title: t('common.error'),
          message: backendMessage,
          type: 'warning',
          confirmText: t('common.ok'),
          showCancel: false,
          onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false })),
        });
      } else {
        toast.error(
          typeof backendMessage === 'string' && backendMessage.trim().length > 0
            ? backendMessage
            : t('staff.messages.saveFailed')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAddEmployeeModal = () => {
    if (staff.length >= MAX_EMPLOYEES_PER_ACCOUNT) {
      setConfirmConfig({
        isOpen: true,
        title: t('common.error'),
        message: EMPLOYEE_LIMIT_POPUP_MESSAGE,
        type: 'warning',
        confirmText: t('common.ok'),
        showCancel: false,
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false })),
      });
      return;
    }
    setEditingStaff(null);
    setShowModal(true);
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
        return 'bg-PayMint-green/10 text-PayMint-green border-PayMint-green/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-10" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <span className="px-2.5 sm:px-3 py-1 rounded-lg bg-PayMint-green/10 text-PayMint-green text-xs font-black tracking-widest border border-PayMint-green/20">
              {t('staff.badge')}
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-PayMint-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-PayMint-green"></span>
              </div>
              <span className="text-xs font-bold text-PayMint-green tracking-widest">{t('dashboard.shiftStatus.live')}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('staff.title')}</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">{t('staff.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExport}
            className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
          >
            <Download size={18} />
            <span>{t('orders.export')}</span>
          </button>
          <button
            onClick={handleOpenAddEmployeeModal}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-PayMint-green text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-PayMint-green/20 touch-target"
          >
            <Plus size={18} />
            <span className="hidden xs:inline">{t('staff.addMember')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - horizontal scroll on mobile */}
      <div className="flex overflow-x-auto scrollbar-none gap-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sm:overflow-visible pb-2 sm:pb-0">
        {[
          { label: t('owner.employees.totalUsers'), info: t('owner.staff.usersInfo'), value: staff.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t('owner.employees.activeNow'), info: t('owner.staff.activeInfo'), value: staff.filter(s => s.isClockedIn).length, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: t('owner.staff.admins'), info: t('owner.staff.adminsInfo'), value: staff.filter(s => s.role === 'ADMIN').length, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: t('owner.staff.standardUsers'), info: t('owner.staff.standardInfo'), value: staff.filter(s => s.role !== 'ADMIN').length, icon: Star, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((stat, i) => (
          <div
            key={i}
            className="group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm transition-all duration-300 overflow-hidden min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300`}>
                  <stat.icon size={16} className="sm:w-5 sm:h-5" />
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-base font-bold text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-1 sm:mb-2">{stat.value.toLocaleString(t('common.locale'))}</p>
                <p className="hidden sm:block text-xs font-medium text-gray-500 dark:text-gray-400">{stat.info}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-48">
          <SelectInput
            value={filterRole === 'ALL' ? null : filterRole}
            onChange={(val) => {
              setFilterRole((val as 'ALL' | 'ADMIN' | 'USER') || 'ALL');
              setCurrentPage(1);
            }}
            options={[
              { label: t('owner.staff.admins'), value: 'ADMIN' },
              { label: t('owner.staff.standardUsers'), value: 'USER' },
            ]}
            allOptionLabel={t('owner.employees.allRoles')}
            placeholder={t('owner.employees.allRoles')}
          />
        </div>

        <div className="relative flex-1 sm:max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            onClear={() => setSearchQuery('')}
            placeholder={t('staff.searchPlaceholder')}
            className="w-full"
          />
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm min-h-[250px] lg:min-h-[350px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 sm:p-32">
            <div className="w-12 h-12 border-4 border-PayMint-green/30 border-t-PayMint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black tracking-widest text-gray-400">{t('staff.messages.loading')}</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 sm:p-32 text-center bg-gray-50/30 dark:bg-black/10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 border border-gray-200 dark:border-white/5 shadow-sm">
              <Users size={32} className="sm:w-10 sm:h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('staff.messages.noStaff')}</h3>
            <p className="text-sm font-bold text-gray-500 max-w-xs mx-auto">{t('staff.messages.noStaffDesc')}</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
              {currentItems.map((member) => (
                <div
                  key={member.id}
                  data-member-id={member.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-PayMint-green/10 text-PayMint-green flex items-center justify-center font-black text-sm">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{member.username}</p>
                          <p className="text-xs text-gray-500">{member.name}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getRoleStyle(member.role)}`}>
                        <Shield size={10} />
                        {t(`staff.roles.${member.role.toLowerCase()}`) !== `staff.roles.${member.role.toLowerCase()}`
                          ? t(`staff.roles.${member.role.toLowerCase()}`)
                          : member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                      </span>
                    </div>

                    {/* Card Details */}
                    <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-gray-100 dark:border-white/5">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('staff.form.emailLabel')}</p>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white truncate">
                          <Mail size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{member.email || t('common.notAvailable')}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('staff.table.status')}</p>
                        <div className={`flex items-center gap-2 font-bold text-xs ${!member.isActive
                          ? 'text-PayMint-red'
                          : member.isClockedIn
                            ? 'text-PayMint-green'
                            : 'text-gray-400'
                          }`}>
                          {!member.isActive ? (
                            <>
                              <XCircle size={12} />
                              <span>{t('staff.status.suspended')}</span>
                            </>
                          ) : member.isClockedIn ? (
                            <>
                              <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-PayMint-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-PayMint-green"></span>
                              </div>
                              <span>{t('staff.status.online')}</span>
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                              <span>{t('staff.status.offline')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                      <button
                        onClick={() => openEditModal(member)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all text-xs font-bold touch-target"
                      >
                        <Edit2 size={14} />
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.username)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-500/20 text-PayMint-red hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-xs font-bold touch-target"
                      >
                        <Trash2 size={14} />
                        {t('common.delete')}
                      </button>
                    </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    <th
                      className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest cursor-pointer hover:text-PayMint-green transition-colors"
                      onClick={() => handleSort('username')}
                    >
                      <div className="flex items-center gap-1">
                        {t('staff.table.name')}
                        {sortConfig?.key === 'username' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest cursor-pointer hover:text-PayMint-green transition-colors"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center gap-1">
                        {t('staff.table.role')}
                        {sortConfig?.key === 'role' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('staff.table.contact')}</th>
                    <th
                      className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest cursor-pointer hover:text-PayMint-green transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        {t('staff.table.status')}
                        {sortConfig?.key === 'status' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-black text-gray-400 tracking-widest">{t('owner.locations.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {currentItems.map((member) => (
                    <tr
                      key={member.id}
                      data-member-id={member.id}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-PayMint-green/10 text-PayMint-green flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform duration-300">
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
                            {t(`staff.roles.${member.role.toLowerCase()}`) !== `staff.roles.${member.role.toLowerCase()}`
                              ? t(`staff.roles.${member.role.toLowerCase()}`)
                              : member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Mail size={12} className="text-gray-400" />
                              <span className="font-medium">{member.email || t('owner.staff.noEmail')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Phone size={12} className="text-gray-400" />
                              <span className="font-medium">{member.phone || t('owner.staff.noPhone')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 font-black text-xs tracking-wide ${!member.isActive
                            ? 'text-PayMint-red'
                            : member.isClockedIn
                              ? 'text-PayMint-green'
                              : 'text-gray-400'
                            }`}>
                            {!member.isActive ? (
                              <>
                                <XCircle size={14} />
                                <span>{t('staff.status.suspended')}</span>
                              </>
                            ) : member.isClockedIn ? (
                              <>
                                <div className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-PayMint-green opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-PayMint-green"></span>
                                </div>
                                <span>{t('staff.status.online')}</span>
                              </>
                            ) : (
                              <>
                                <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <span>{t('staff.status.offline')}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              onClick={() => openEditModal(member)}
                              aria-label={t('staff.editEmployee')}
                              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-90"
                            >
                              <Edit2 size={18} />
                            </button>
                            <div className="relative dropdown-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(activeDropdown === member.id ? null : member.id);
                                }}
                                aria-label={t('common.actions')}
                                aria-expanded={activeDropdown === member.id}
                                className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all active:scale-90 shadow-sm ${activeDropdown === member.id ? 'bg-PayMint-green text-black border-PayMint-green' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                              >
                                <MoreVertical size={18} />
                              </button>

                                {activeDropdown === member.id && (
                                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden py-1.5">
                                    <button
                                      onClick={() => { setActiveDropdown(null); toast.success(t('staff.messages.resetSuccess')); }}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black tracking-widest text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                                    >
                                      <Key size={14} className="text-PayMint-green" />
                                      <span>{t('staff.actions.resetPassword')}</span>
                                    </button>
                                    <button
                                      onClick={() => { setActiveDropdown(null); handleDelete(member.id, member.username); }}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black tracking-widest text-PayMint-red hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left border-t border-gray-100 dark:border-white/5"
                                    >
                                      <Trash2 size={14} />
                                      <span>{t('common.delete')}</span>
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div >

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={paginate}
      />

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
          toast.success(t('owner.staff.staffRemoved'));
          fetchStaff();
        }}
        targetId={securityModal.memberId}
        targetName={securityModal.memberName}
        mode="delete-employee"
      />
    </div >
  );
}
