import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Shield,
  Edit2,
  Trash2,
  XCircle,
  RefreshCw,
  UserCheck,
  Globe,
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

export function OwnerRolesPage() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
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
      setRoles(response.data || []);
    } catch (err: any) {
      toast.error('Failed to load global roles');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.baseRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      toast.success('Role deleted');
      fetchRoles();
    } catch (err) {
      toast.error('Failed to delete role');
    } finally {
      setConfirmConfig({ ...confirmConfig, isOpen: false });
    }
  };

  const handleFormSubmit = async (payload: any) => {
    try {
      setIsSubmitting(true);

      if (editingRole) {
        await api.put(`/api/custom-roles/${editingRole.id}`, payload);
        toast.success('Role updated');
      } else {
        await api.post('/api/custom-roles/owner/global', payload);
        toast.success('Role created');
      }
      setShowModal(false);
      fetchRoles();
    } catch (err) {
      toast.error('Failed to save role');
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
              Team
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Company Roles</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">Create roles that apply to all locations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRoles}
            className="p-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20"
          >
            <Plus size={18} />
            <span>Create Role</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles..."
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
            title="Grid View"
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            title="List View"
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
            <p className="text-xs font-black tracking-widest text-gray-400">Loading Roles...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32 text-center bg-gray-50/30 dark:bg-black/10">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/5 shadow-sm">
              <Globe size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">No roles found</h3>
            <p className="text-sm font-bold text-gray-500 max-w-xs mx-auto">Create a role here to share it across all your locations.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            <AnimatePresence mode="popLayout">
              {currentItems.map((role, idx) => (
                <motion.div
                  key={role.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 p-6 transition-all shadow-sm hover:shadow-lg overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{role.name}</h3>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide border ${getBaseRoleStyle(role.baseRole)}`}>
                          <UserCheck size={10} />
                          {role.baseRole ? role.baseRole.charAt(0).toUpperCase() + role.baseRole.slice(1).toLowerCase() : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(role)}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                        title="Edit Role"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(role)}
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-400 hover:text-red-500 transition-all"
                        title="Delete Role"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                    <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                      <span className="text-xs font-black text-gray-400 tracking-widest block mb-2">Permissions</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-paymint-green"></span>
                          <span className="text-xs font-bold text-paymint-green">POS: {role.permissions?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span className="text-xs font-bold text-blue-500">Office: {role.backofficePermissions?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                      <span className="text-xs font-black text-gray-400 tracking-widest block mb-2">Scope</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10 text-xs font-black tracking-wide">
                        <Globe size={10} />
                        Global
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="pt-4 border-t border-gray-100 dark:border-white/5 relative z-10">
                    <span className="text-xs text-gray-400 font-medium">
                      Created {new Date(role.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* List View */
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
              <AnimatePresence mode="popLayout">
                {currentItems.map((role, idx) => (
                  <motion.div
                    key={role.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
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
                            {role.baseRole ? role.baseRole.charAt(0).toUpperCase() + role.baseRole.slice(1).toLowerCase() : ''}
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
                        <span className="text-gray-500 block mb-1">Permissions</span>
                        <div className="flex gap-2">
                          <span className="font-bold text-paymint-green">POS: {role.permissions?.length || 0}</span>
                          <span className="font-bold text-blue-500">Office: {role.backofficePermissions?.length || 0}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg">
                        <span className="text-gray-500 block mb-1">Date Created</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {new Date(role.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Access</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-gray-400 tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {currentItems.map((role, idx) => (
                      <motion.tr
                        key={role.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
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
                            {role.baseRole ? role.baseRole.charAt(0).toUpperCase() + role.baseRole.slice(1).toLowerCase() : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-paymint-green"></span>
                              <span className="text-xs text-gray-500 font-medium">POS: {role.permissions?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              <span className="text-xs text-gray-500 font-medium">Office: {role.backofficePermissions?.length || 0}</span>
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
                              title="Edit Role"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(role)}
                              className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-paymint-red/60 hover:text-paymint-red hover:bg-paymint-red/5 transition-all shadow-sm active:scale-90"
                              title="Delete Role"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
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
        title="Delete Role"
        message={`Are you sure you want to delete the "${confirmConfig.roleName}" role? It will be removed from all locations.`}
        type="danger"
        confirmText="Delete Role"
      />
    </div>
  );
}
