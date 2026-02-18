import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Search,
  Plus,
  Shield,
  Edit2,
  Trash2,
  XCircle,
  UserCheck,
  Globe,
  ArrowUpDown,
  Grid3X3,
  List
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CustomRoleFormModal } from '../../components/CustomRoleFormModal';
import { Pagination } from '../../components/ui';

interface CustomRole {
  id: string;
  name: string;
  baseRole: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'USER';
  permissions: string[];
  allowedDiscounts: string[];
  // Access Control
  posAccess: boolean;
  backofficeAccess: boolean;
  backofficePermissions: string[];
  createdAt: string;
}

type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'baseRole' | 'createdAt';

export function OwnerRolesPage() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    roleId: string;
    roleName: string;
  }>({
    isOpen: false,
    roleId: '',
    roleName: '',
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/custom-roles/owner/global');
      // Backend returns { items, total, limit, offset }
      setRoles(response.data?.items || []);
    } catch {
      toast.error(t('owner.roles.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredRoles = useMemo(() => {
    const result = roles.filter(role =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.baseRole.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue: any = a[sortConfig.key];
        const bValue: any = b[sortConfig.key];

        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        // Handle number comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [roles, searchQuery, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  const handleCreateNew = () => {
    setEditingRole(null);
    setShowModal(true);
  };

  const handleEdit = (role: CustomRole) => {
    setEditingRole(role);
    setShowModal(true);
  };

  const handleDeleteClick = (role: CustomRole) => {
    setConfirmConfig({
      isOpen: true,
      roleId: role.id,
      roleName: role.name,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/custom-roles/${confirmConfig.roleId}`);
      toast.success(t('owner.roles.roleDeleted'));
      fetchRoles();
    } catch {
      toast.error(t('owner.roles.failedToDelete'));
    } finally {
      setConfirmConfig({ ...confirmConfig, isOpen: false });
    }
  };

  const handleFormSubmit = async (payload: any) => {
    try {
      setIsSubmitting(true);

      if (editingRole) {
        await api.put(`/api/custom-roles/${editingRole.id}`, payload);
        toast.success(t('owner.roles.roleUpdated'));
      } else {
        await api.post('/api/custom-roles/owner/global', payload);
        toast.success(t('owner.roles.roleCreated'));
      }
      setShowModal(false);
      fetchRoles();
    } catch {
      toast.error(t('owner.roles.failedToSave'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBaseRoleStyle = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'MANAGER':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'CASHIER':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
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
              {t('dashboard.menu.team')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('owner.roles.title')}</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">{t('owner.roles.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20"
          >
            <Plus size={18} />
            <span>{t('owner.roles.createNew')}</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('owner.roles.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
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

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1 h-[44px]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            title={t('common.view')}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            title={t('common.view')}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm min-h-[250px] lg:min-h-[350px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32">
            <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black tracking-widest text-gray-400">{t('owner.roles.loading')}</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32 text-center bg-gray-50/30 dark:bg-black/10">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/5 shadow-sm">
              <Globe size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t('owner.roles.noRoles')}</h3>
            <p className="text-sm font-bold text-gray-500 max-w-xs mx-auto">{t('owner.roles.noRolesDesc')}</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {currentItems.map((role) => (
              <div
                key={role.id}
                className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-6 transition-all shadow-sm overflow-hidden"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 transition-opacity duration-500 pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center transition-transform duration-300">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{role.name}</h3>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide border ${getBaseRoleStyle(role.baseRole)}`}>
                          <UserCheck size={10} />
                          {role.baseRole ? (t(`staff.roles.${role.baseRole.toLowerCase()}`) !== `staff.roles.${role.baseRole.toLowerCase()}` ? t(`staff.roles.${role.baseRole.toLowerCase()}`) : role.baseRole.charAt(0) + role.baseRole.slice(1).toLowerCase()) : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(role)}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                        title={t('owner.roles.editRole')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(role)}
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-400 hover:text-red-500 transition-all"
                        title={t('owner.roles.deleteRole')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                    <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                      <span className="text-xs font-black text-gray-400 tracking-widest block mb-2">{t('owner.roles.permissions')}</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-paymint-green"></span>
                          <span className="text-xs font-bold text-paymint-green">{t('owner.roles.posAccess')}: {role.permissions?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span className="text-xs font-bold text-blue-500">{t('owner.roles.backofficeAccess')}: {role.backofficePermissions?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                      <span className="text-xs font-black text-gray-400 tracking-widest block mb-2">{t('owner.roles.scope')}</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10 text-xs font-black tracking-wide">
                        <Globe size={10} />
                        {t('owner.roles.global')}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="pt-4 border-t border-gray-100 dark:border-white/5 relative z-10">
                    <span className="text-xs text-gray-400 font-medium">
                      {t('owner.roles.createdOn', { date: new Date(role.createdAt).toLocaleDateString() })}
                    </span>
                  </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
              {currentItems.map((role) => (
                <div
                  key={role.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center">
                          <Shield size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm">{role.name}</h3>
                          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide border ${getBaseRoleStyle(role.baseRole)}`}>
                            <UserCheck size={10} />
                            {role.baseRole ? (t(`staff.roles.${role.baseRole.toLowerCase()}`) !== `staff.roles.${role.baseRole.toLowerCase()}` ? t(`staff.roles.${role.baseRole.toLowerCase()}`) : role.baseRole.charAt(0) + role.baseRole.slice(1).toLowerCase()) : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(role)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                        <span className="text-gray-500 block mb-1">{t('owner.roles.permissions')}</span>
                        <div className="flex gap-2">
                          <span className="font-bold text-paymint-green">{t('owner.roles.posAccess')}: {role.permissions?.length || 0}</span>
                          <span className="font-bold text-blue-500">{t('owner.roles.backofficeAccess')}: {role.backofficePermissions?.length || 0}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                        <span className="text-gray-500 block mb-1">{t('owner.overview.period')}</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {new Date(role.createdAt).toLocaleDateString()}
                        </span>
                      </div>
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
                      className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest cursor-pointer hover:text-paymint-green transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        {t('common.search')}
                        {sortConfig?.key === 'name' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest cursor-pointer hover:text-paymint-green transition-colors"
                      onClick={() => handleSort('baseRole')}
                    >
                      <div className="flex items-center gap-1">
                        {t('owner.locations.type')}
                        {sortConfig?.key === 'baseRole' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('staff.form.accessLabel')}</th>
                    <th
                      className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest cursor-pointer hover:text-paymint-green transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        {t('owner.overview.period')}
                        {sortConfig?.key === 'createdAt' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-black text-gray-400 tracking-widest">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {currentItems.map((role) => (
                    <tr
                      key={role.id}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <Shield size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">{role.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getBaseRoleStyle(role.baseRole)}`}>
                            <UserCheck size={10} />
                            {role.baseRole ? (t(`staff.roles.${role.baseRole.toLowerCase()}`) !== `staff.roles.${role.baseRole.toLowerCase()}` ? t(`staff.roles.${role.baseRole.toLowerCase()}`) : role.baseRole.charAt(0) + role.baseRole.slice(1).toLowerCase()) : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-paymint-green"></span>
                              <span className="text-xs text-gray-500 font-medium">{t('owner.roles.posAccess')}: {role.permissions?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              <span className="text-xs text-gray-500 font-medium">{t('owner.roles.backofficeAccess')}: {role.backofficePermissions?.length || 0}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-500 font-medium">
                            {new Date(role.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(role)}
                              className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-90"
                              title={t('owner.roles.editRole')}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(role)}
                              className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-paymint-red/60 hover:text-paymint-red hover:bg-paymint-red/5 transition-all shadow-sm active:scale-90"
                              title={t('owner.roles.deleteRole')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-6" />

      <CustomRoleFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleFormSubmit}
        initialData={editingRole}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={handleDeleteConfirm}
        title={t('owner.roles.deleteRole')}
        message={t('owner.roles.deleteConfirm', { name: confirmConfig.roleName })}
        type="danger"
        confirmText={t('owner.roles.deleteRole')}
      />
    </div>
  );
}
