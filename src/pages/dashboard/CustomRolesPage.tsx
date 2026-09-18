import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Plus,
  Shield,
  Edit2,
  Trash2,
  UserCheck,
  ArrowUpDown,
  Grid3X3,
  List,
  Copy,
  Globe
} from 'lucide-react';
import api, { extractErrorMessage } from '../../config/api';
import { fetchAllPages } from '../../utils/fetchAllPages';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { BusyOverlay } from '../../components/BusyOverlay';
import { CustomRoleFormModal } from '../../components/CustomRoleFormModal';
import { RoleDeleteResolutionModal } from '../../components/RoleDeleteResolutionModal';
import { Pagination, SearchInput, PageHeader, Badge, primaryButtonInlineClass } from '../../components/ui';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { getLocalizedRoleName } from '../../utils/roleNames';
import { formatInputPlaceholder } from '../../utils/textCase';
import { retryTransientRequest } from '../../utils/retryTransientRequest';

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
  // Scope metadata tagged by the API. A global role belongs to the account and
  // is assignable from every branch, so this page shows it as a read-only
  // template that a branch can fork rather than edit in place.
  isGlobal?: boolean;
  establishmentId?: string | null;
  establishmentName?: string | null;
  employeeCount?: number;
  locationCount?: number;
}

type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'baseRole' | 'createdAt';

const HIDDEN_POS_PERMISSIONS = new Set([
  'pos',
  'void_items'
]);

const HIDDEN_BACKOFFICE_PERMISSIONS = new Set([
  'dashboard',
  'view_orders',
  'view_reports',
]);

const getPosPermissionCount = (permissions: string[] | undefined): number => {
  if (!Array.isArray(permissions) || permissions.length === 0) return 0;
  const normalized = Array.from(
    new Set(
      permissions
        .filter((permission): permission is string => typeof permission === 'string')
        .map((permission) => permission.trim().toLowerCase()),
    ),
  );
  return normalized.filter(p => !HIDDEN_POS_PERMISSIONS.has(p)).length;
};

const getBackofficePermissionCount = (permissions: string[] | undefined): number => {
  if (!Array.isArray(permissions) || permissions.length === 0) return 0;

  const normalized = Array.from(
    new Set(
      permissions
        .filter((permission): permission is string => typeof permission === 'string')
        .map((permission) => permission.trim().toLowerCase()),
    ),
  );
  
  // Filter out hidden/default permissions to show only what the user explicitly added
  const explicitPermissions = normalized.filter(p => !HIDDEN_BACKOFFICE_PERMISSIONS.has(p));

  return explicitPermissions.length;
};

export function CustomRolesPage() {
  const { t } = useTranslation();
    const { currentEstablishment } = useAuth();
  // Permission guard - redirects if user lacks permission
  usePermissionGuard();

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
  const [roleDeleteResolution, setRoleDeleteResolution] = useState({
    isOpen: false,
    roleId: '',
    roleName: '',
    employeeCount: 0,
    assignmentCount: 0,
    locationCount: 0,
  });
  const [isResolvingRoleDelete, setIsResolvingRoleDelete] = useState(false);
  const [duplicatingRoleId, setDuplicatingRoleId] = useState<string | null>(null);

  /**
   * Fork a global template into this branch as an editable branch-local copy.
   * The copy is a snapshot — later edits to the global template do not reach it.
   */
  const handleDuplicateToBranch = async (role: CustomRole) => {
    const establishmentId = currentEstablishment?.id;
    if (!establishmentId || duplicatingRoleId) return;

    try {
      setDuplicatingRoleId(role.id);
      await api.post(`/api/custom-roles/${role.id}/duplicate/${establishmentId}`, {});
      toast.success(t('dashboard.roles.messages.duplicated'));
      await fetchRoles();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || t('dashboard.roles.messages.duplicateFailed'),
      );
    } finally {
      setDuplicatingRoleId(null);
    }
  };

  useEffect(() => {
    void fetchRoles();
  }, [currentEstablishment?.id]);

  const getRoleDisplayName = (name: string) => getLocalizedRoleName(name, t);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const establishmentId = currentEstablishment?.id;
      if (!establishmentId) {
        setRoles([]);
        return;
      }
      // Load every page so roles past the backend default (100) are not dropped.
      const allRoles = await retryTransientRequest(() =>
        fetchAllPages<any>(api, `/api/custom-roles/${establishmentId}`),
      );
      setRoles(allRoles);
    } catch {
      toast.error(t('dashboard.roles.messages.loadFailed'));
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
    const result = (Array.isArray(roles) ? roles : []).filter(role =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getRoleDisplayName(role.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.baseRole || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

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
  }, [roles, searchQuery, sortConfig, t]);

  const replacementRoleOptions = useMemo(
    () =>
      roles
        .filter((role) => role.id !== roleDeleteResolution.roleId)
        .map((role) => ({
          id: role.id,
          name: getRoleDisplayName(role.name),
        })),
    [roles, roleDeleteResolution.roleId, t],
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = (Array.isArray(filteredRoles) ? filteredRoles : []).slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil((Array.isArray(filteredRoles) ? filteredRoles : []).length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
      roleName: getRoleDisplayName(role.name),
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/custom-roles/${confirmConfig.roleId}`);
      toast.success(t('dashboard.roles.messages.deleted'));
      fetchRoles();
    } catch (error: any) {
      const data = error?.response?.data || {};
      const message = Array.isArray(data.message)
        ? data.message.join(' ')
        : String(data.message || '');
      const roleInUse =
        data.code === 'CUSTOM_ROLE_IN_USE' ||
        (error?.response?.status === 409 &&
          message.includes('assigned to active employees'));

      if (roleInUse) {
        setRoleDeleteResolution({
          isOpen: true,
          roleId: confirmConfig.roleId,
          roleName: confirmConfig.roleName,
          employeeCount: Number(data.employeeCount || 0),
          assignmentCount: Number(data.assignmentCount || 0),
          locationCount: Number(data.locationCount || 0),
        });
        return;
      }

      toast.error(extractErrorMessage(error) || t('dashboard.roles.messages.deleteFailed'));
    } finally {
      setConfirmConfig({ ...confirmConfig, isOpen: false });
    }
  };

  const handleResolveRoleDelete = async (
    strategy: 'detach' | 'reassign',
    replacementRoleId?: string,
  ) => {
    if (!roleDeleteResolution.roleId) return;

    try {
      setIsResolvingRoleDelete(true);
      await api.delete(`/api/custom-roles/${roleDeleteResolution.roleId}`, {
        params: {
          strategy,
          ...(replacementRoleId ? { replacementRoleId } : {}),
        },
      });
      toast.success(t('dashboard.roles.messages.deleted'));
      setRoleDeleteResolution((prev) => ({ ...prev, isOpen: false }));
      fetchRoles();
    } catch (error: any) {
      toast.error(extractErrorMessage(error) || t('dashboard.roles.messages.deleteFailed'));
    } finally {
      setIsResolvingRoleDelete(false);
    }
  };

  const handleFormSubmit = async (payload: any) => {
    try {
      setIsSubmitting(true);

      const currentEstablishment = sessionStorage.getItem('currentEstablishment');
      if (!currentEstablishment) {
        toast.error(t('dashboard.roles.messages.noLocation'));
        return;
      }
      const { id: establishmentId } = JSON.parse(currentEstablishment);

      if (editingRole) {
        await api.put(`/api/custom-roles/${editingRole.id}`, payload);
        toast.success(t('dashboard.roles.messages.updated'));
      } else {
        await api.post(`/api/custom-roles/${establishmentId}`, payload);
        toast.success(t('dashboard.roles.messages.created'));
      }
      setShowModal(false);
      fetchRoles();
    } catch {
      toast.error(t('dashboard.roles.messages.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBaseRoleStyle = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-stone-500/10 text-stone-600 dark:text-zinc-300 border-stone-500/20';
      case 'MANAGER':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'CASHIER':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Full-screen blocker while data loads, so no second action can be
          stacked on an in-flight request. */}
      <BusyOverlay visible={isLoading} />
      {/* Header */}
      <PageHeader
          title={t('dashboard.roles.title')}
          subtitle={
              <>
                  <span>{t('dashboard.roles.subtitle')}</span>
                  {currentEstablishment?.name && (
                      <Badge>{currentEstablishment.name}</Badge>
                  )}
              </>
          }
          actions={
              <>
                  <button
                      onClick={handleCreateNew}
                      className={primaryButtonInlineClass}
                  >
                      <Plus size={18} strokeWidth={2.5} />
                      <span>{t('dashboard.roles.addRole')}</span>
                  </button>
              </>
          }
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            onClear={() => { setSearchQuery(''); setCurrentPage(1); }}
            placeholder={formatInputPlaceholder(t('dashboard.roles.searchPlaceholder'), t('common.locale'))}
          />
        </div>
        {/* View Mode Toggle */}
        <div className="flex items-center bg-stone-50 dark:bg-zinc-800 rounded-xl border border-stone-200 dark:border-zinc-800 p-1 h-[44px]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-mintcom-green shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            title={t('dashboard.roles.gridView')}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-mintcom-green shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            title={t('dashboard.roles.listView')}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col items-center justify-center p-20 sm:p-32">
          <div className="w-12 h-12 border-4 border-mintcom-green/30 border-t-mintcom-green rounded-full animate-spin mb-4" />
          <p className="label-strong font-sans">{t('dashboard.roles.loading')}</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col items-center justify-center p-16 sm:p-24 text-center bg-stone-50/30 dark:bg-black/10">
          <div className="w-20 h-20 bg-stone-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 border border-stone-200 dark:border-zinc-800 shadow-sm">
            <Shield size={40} className="text-stone-300" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-zinc-100 mb-2">{t('dashboard.roles.noRoles')}</h3>
          <p className="text-sm font-medium text-stone-500 max-w-xs mx-auto">{t('dashboard.roles.noRolesDesc')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentItems.map((role) => (
              <div
                key={role.id}
                className="group relative bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 p-6 transition-all shadow-sm overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/5 rounded-full blur-3xl opacity-0 transition-opacity duration-500 pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center transition-transform duration-300">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 dark:text-zinc-100 text-sm">{getRoleDisplayName(role.name)}</h3>
                      {role.isGlobal && (
                        <span className="inline-flex items-center gap-1 mt-1 me-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10">
                          <Globe size={10} />
                          {t('dashboard.roles.globalBadge')}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide border ${getBaseRoleStyle(role.baseRole)}`}>
                        <UserCheck size={10} />
                        {role.baseRole ? (t(`staff.roles.${role.baseRole.toLowerCase()}`) !== `staff.roles.${role.baseRole.toLowerCase()}` ? t(`staff.roles.${role.baseRole.toLowerCase()}`) : role.baseRole.charAt(0) + role.baseRole.slice(1).toLowerCase()) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 relative z-20">
                    {role.isGlobal ? (
                      <button
                        onClick={() => handleDuplicateToBranch(role)}
                        disabled={duplicatingRoleId === role.id}
                        className="p-2 rounded-xl bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-all disabled:opacity-50"
                        title={t('dashboard.roles.duplicateToBranch')}
                      >
                        <Copy size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2 rounded-xl bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-all"
                          title={t('dashboard.roles.editRole')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(role)}
                          className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-400 hover:text-red-500 transition-all"
                          title={t('dashboard.roles.deleteRole')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-stone-50 dark:bg-zinc-800 p-3 rounded-xl mb-6 relative z-10">
                  <span className="label-strong font-sans block mb-2">{t('dashboard.roles.permissions')}</span>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-mintcom-green"></span>
                      <span className="text-xs font-bold text-mintcom-green">{t('dashboard.roles.pos')}: {getPosPermissionCount(role.permissions)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span className="text-xs font-bold text-blue-500">{t('dashboard.roles.office')}: {getBackofficePermissionCount(role.backofficePermissions)}</span>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="pt-4 border-t border-stone-100 dark:border-zinc-800 relative z-10">
                  <span className="text-xs text-stone-400 font-medium">
                    {t('dashboard.roles.created')} {new Date(role.createdAt).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={paginate}
            totalItems={filteredRoles.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-stone-100 dark:divide-zinc-800">
            {currentItems.map((role) => (
              <div
                key={role.id}
                className="p-4 hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 dark:text-zinc-100 text-sm">{getRoleDisplayName(role.name)}</h3>
                      {role.isGlobal && (
                        <span className="inline-flex items-center gap-1 mt-1 me-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10">
                          <Globe size={10} />
                          {t('dashboard.roles.globalBadge')}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide border ${getBaseRoleStyle(role.baseRole)}`}>
                        <UserCheck size={10} />
                        {role.baseRole ? (t(`staff.roles.${role.baseRole.toLowerCase()}`) !== `staff.roles.${role.baseRole.toLowerCase()}` ? t(`staff.roles.${role.baseRole.toLowerCase()}`) : role.baseRole.charAt(0) + role.baseRole.slice(1).toLowerCase()) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {role.isGlobal ? (
                      <button
                        onClick={() => handleDuplicateToBranch(role)}
                        disabled={duplicatingRoleId === role.id}
                        className="p-2 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 disabled:opacity-50"
                        title={t('dashboard.roles.duplicateToBranch')}
                      >
                        <Copy size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(role)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-stone-50 dark:bg-zinc-800 p-2 rounded-lg">
                    <span className="text-stone-500 block mb-1">{t('dashboard.roles.permissions')}</span>
                    <div className="flex gap-2">
                      <span className="font-bold text-mintcom-green">{t('dashboard.roles.pos')}: {(getPosPermissionCount(role.permissions)).toLocaleString(t('common.locale'))}</span>
                      <span className="font-bold text-blue-500">{t('dashboard.roles.office')}: {getBackofficePermissionCount(role.backofficePermissions).toLocaleString(t('common.locale'))}</span>
                    </div>
                  </div>
                  <div className="bg-stone-50 dark:bg-zinc-800 p-2 rounded-lg">
                    <span className="text-stone-500 block mb-1">{t('dashboard.roles.date')}</span>
                    <span className="font-bold text-stone-900 dark:text-zinc-100">
                      {new Date(role.createdAt).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 dark:bg-zinc-800/40">
                <tr className="border-b border-stone-200 dark:border-zinc-800">
                  <th
                    className="px-6 py-4 text-start label-strong font-sans cursor-pointer hover:text-mintcom-green transition-colors whitespace-nowrap"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      {t('dashboard.roles.name')}
                      {sortConfig?.key === 'name' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-center label-strong font-sans cursor-pointer hover:text-mintcom-green transition-colors whitespace-nowrap"
                    onClick={() => handleSort('baseRole')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {t('dashboard.roles.type')}
                      {sortConfig?.key === 'baseRole' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center label-strong font-sans whitespace-nowrap">{t('dashboard.roles.access')}</th>
                  <th
                    className="px-6 py-4 text-start label-strong font-sans cursor-pointer hover:text-mintcom-green transition-colors whitespace-nowrap"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      {t('dashboard.roles.date')}
                      {sortConfig?.key === 'createdAt' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-end label-strong font-sans whitespace-nowrap">{t('dashboard.roles.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                {currentItems.map((role) => (
                  <tr
                    key={role.id}
                    className="group hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 text-start">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                          <Shield size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 dark:text-zinc-100 text-sm">{getRoleDisplayName(role.name)}</p>
                          {role.isGlobal && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10">
                              <Globe size={10} />
                              {t('dashboard.roles.globalBadge')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getBaseRoleStyle(role.baseRole)}`}>
                        <UserCheck size={10} />
                        {role.baseRole ? (t(`staff.roles.${role.baseRole.toLowerCase()}`) !== `staff.roles.${role.baseRole.toLowerCase()}` ? t(`staff.roles.${role.baseRole.toLowerCase()}`) : role.baseRole.charAt(0) + role.baseRole.slice(1).toLowerCase()) : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-mintcom-green"></span>
                          <span className="text-xs text-stone-500 font-medium">{t('dashboard.roles.pos')}: {(getPosPermissionCount(role.permissions)).toLocaleString(t('common.locale'))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span className="text-xs text-stone-500 font-medium">{t('dashboard.roles.office')}: {getBackofficePermissionCount(role.backofficePermissions).toLocaleString(t('common.locale'))}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-start">
                      <p className="text-xs text-stone-500 font-medium">
                        {new Date(role.createdAt).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-end">
                      <div className="flex items-center justify-end gap-2">
                        {role.isGlobal ? (
                          <button
                            onClick={() => handleDuplicateToBranch(role)}
                            disabled={duplicatingRoleId === role.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-all shadow-sm active:scale-90 disabled:opacity-50"
                            title={t('dashboard.roles.duplicateToBranch')}
                          >
                            <Copy size={16} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(role)}
                              className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-all shadow-sm active:scale-90"
                              title={t('dashboard.roles.editRole')}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(role)}
                              className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800 text-mintcom-red/60 hover:text-mintcom-red hover:bg-mintcom-red/5 transition-all shadow-sm active:scale-90"
                              title={t('dashboard.roles.deleteRole')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={paginate}
            variant="footer"
            totalItems={filteredRoles.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

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
        title={t('dashboard.roles.deleteTitle')}
        message={t('dashboard.roles.deleteMessage', { name: confirmConfig.roleName })}
        type="danger"
        confirmText={t('dashboard.roles.deleteRole')}
      />

      <RoleDeleteResolutionModal
        isOpen={roleDeleteResolution.isOpen}
        roleName={roleDeleteResolution.roleName}
        employeeCount={roleDeleteResolution.employeeCount}
        assignmentCount={roleDeleteResolution.assignmentCount}
        locationCount={roleDeleteResolution.locationCount}
        replacementRoles={replacementRoleOptions}
        isSubmitting={isResolvingRoleDelete}
        onClose={() =>
          setRoleDeleteResolution((prev) => ({ ...prev, isOpen: false }))
        }
        onDetach={() => handleResolveRoleDelete('detach')}
        onReassign={(replacementRoleId) =>
          handleResolveRoleDelete('reassign', replacementRoleId)
        }
      />
    </div>
  );
}


