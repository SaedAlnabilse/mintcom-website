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
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CustomRoleFormModal } from '../../components/CustomRoleFormModal';

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

export function CustomRolesPage() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
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
      const currentEstablishment = sessionStorage.getItem('currentEstablishment');
      if (!currentEstablishment) return;

      const { id: establishmentId } = JSON.parse(currentEstablishment);
      const response = await api.get(`/api/custom-roles/${establishmentId}`);
      setRoles(response.data || []);
    } catch (err: any) {
      toast.error('Failed to load custom roles');
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
      roleName: role.name,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/custom-roles/${confirmConfig.roleId}`);
      toast.success('Role deleted successfully');
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

      const currentEstablishment = sessionStorage.getItem('currentEstablishment');
      if (!currentEstablishment) {
        toast.error('No establishment selected');
        return;
      }
      const { id: establishmentId } = JSON.parse(currentEstablishment);

      if (editingRole) {
        await api.put(`/api/custom-roles/${editingRole.id}`, payload);
        toast.success('Role updated successfully');
      } else {
        await api.post(`/api/custom-roles/${establishmentId}`, payload);
        toast.success('Role created successfully');
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
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black tracking-widest border border-paymint-green/20">
              Access Control
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Custom Roles</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Define and manage granular permissions for your team</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRoles}
            className="p-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
            title="Refresh Roles"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20"
          >
            <Plus size={18} />
            <span>Create New Role</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles by name or type..."
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
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32">
            <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black tracking-widest text-gray-400">Loading Roles...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-32 text-center bg-gray-50/30 dark:bg-black/10">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/5 shadow-sm">
              <Shield size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">No Roles Found</h3>
            <p className="text-gray-500 max-w-xs text-sm font-medium mx-auto">Create your first custom role to start managing team permissions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr className="border-b border-gray-200 dark:border-white/5">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Role Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Base Identity</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Permissions</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Created</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 tracking-widest">Actions</th>
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
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border ${getBaseRoleStyle(role.baseRole)}`}>
                          <UserCheck size={10} />
                          {role.baseRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-500 font-medium">
                          {role.permissions?.length || 0} permissions active
                        </p>
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
        )}
      </div>

      {/* Pagination */}
      {filteredRoles.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-900 dark:text-white">{indexOfFirstItem + 1}</span> to <span className="font-bold text-gray-900 dark:text-white">{Math.min(indexOfLastItem, filteredRoles.length)}</span> of <span className="font-bold text-gray-900 dark:text-white">{filteredRoles.length}</span> roles
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
        message={`Are you sure you want to delete the "${confirmConfig.roleName}" role? This action cannot be undone.`}
        type="danger"
        confirmText="Delete Role"
      />
    </div>
  );
}
