import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Mail,
    Phone,
    Shield,
    Edit2,
    Trash2,
    X,
    Loader2,
    Eye,
    EyeOff,
    UserPlus,
    Check
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/ConfirmModal';

interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    createdAt: string;
    establishments: { id: string; name: string }[];
}

export function AdminUsersPage() {
    const { establishments } = useAuth();
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        establishmentIds: [] as string[],
    });

    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'success' | 'warning';
        confirmText?: string;
        showCancel?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    useEffect(() => {
        fetchAdminUsers();
    }, []);

    const fetchAdminUsers = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/accounts/admins');
            setAdminUsers(response.data || []);
        } catch (err: any) {
            toast.error('Failed to load admin users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingAdmin) {
                await api.put(`/api/accounts/admins/${editingAdmin.id}`, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    establishmentIds: formData.establishmentIds,
                });
                toast.success('Admin updated');
            } else {
                await api.post('/api/accounts/admins', formData);
                toast.success('Admin created');
            }
            setShowModal(false);
            resetForm();
            fetchAdminUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save admin');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (admin: AdminUser) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Remove Admin',
            message: `Are you sure you want to remove ${admin.firstName} ${admin.lastName}? They will lose all access.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/accounts/admins/${admin.id}`);
                    toast.success('Admin removed');
                    fetchAdminUsers();
                } catch (err: any) {
                    toast.error('Failed to remove admin');
                }
            },
        });
    };

    const openEditModal = (admin: AdminUser) => {
        setEditingAdmin(admin);
        setFormData({
            email: admin.email,
            password: '',
            firstName: admin.firstName,
            lastName: admin.lastName,
            phone: admin.phone || '',
            establishmentIds: admin.establishments.map((e) => e.id),
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingAdmin(null);
        setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            phone: '',
            establishmentIds: [],
        });
    };

    const toggleEstablishment = (estId: string) => {
        setFormData((prev) => ({
            ...prev,
            establishmentIds: prev.establishmentIds.includes(estId)
                ? prev.establishmentIds.filter((id) => id !== estId)
                : [...prev.establishmentIds, estId],
        }));
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1E293B] p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-sm">
                            <Shield size={28} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Admins</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Manage admin access</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md shadow-paymint-green/10"
                        >
                            <Plus size={18} />
                            <span>New Admin</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">About Admins</h3>
                        <p className="text-blue-800 dark:text-blue-200 text-sm">
                            Admins have full access to the dashboard and app.
                        </p>
                    </div>
                </div>
            </div>

            {/* Admin List */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="py-32 flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black tracking-widest text-gray-400">Loading admins...</p>
                    </div>
                ) : adminUsers.length === 0 ? (
                    <div className="py-32 text-center flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/5">
                            <UserPlus className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Admins</h3>
                        <p className="text-gray-500 max-w-xs font-medium mx-auto text-sm">
                            Add an admin to help manage your business.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                        {adminUsers.map((admin) => (
                            <motion.div
                                layout
                                key={admin.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/5 hover:shadow-xl transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-paymint-green/0 via-transparent to-paymint-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="relative z-10 flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center font-black text-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                            {admin.firstName.charAt(0)}{admin.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-lg tracking-tight group-hover:text-paymint-green transition-colors">
                                                {admin.firstName} {admin.lastName}
                                            </p>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                    <Mail size={12} className="text-gray-400" />
                                                    {admin.email}
                                                </span>
                                                {admin.phone && (
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                        <Phone size={12} className="text-gray-400" />
                                                        {admin.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button
                                            onClick={() => openEditModal(admin)}
                                            className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10 transition-all border border-gray-200 dark:border-white/10 shadow-sm"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(admin)}
                                            className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-red hover:bg-paymint-red/10 transition-all border border-gray-200 dark:border-white/10 shadow-sm"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                                    <p className="text-[9px] font-black text-gray-400 tracking-widest mb-2">Locations</p>
                                    <div className="flex flex-wrap gap-2">
                                        {admin.establishments.map((est) => (
                                            <span
                                                key={est.id}
                                                className="px-2.5 py-1 bg-paymint-green/5 text-paymint-green text-[9px] font-black tracking-widest rounded-lg border border-paymint-green/10"
                                            >
                                                {est.name}
                                            </span>
                                        ))}
                                        {admin.establishments.length === 0 && (
                                            <span className="text-[10px] text-gray-400 italic">No locations</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between relative isolate">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    {editingAdmin ? 'Edit Admin' : 'Add Admin'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 tracking-widest px-1">
                                            First Name <span className="text-paymint-red">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 tracking-widest px-1">
                                            Last Name <span className="text-paymint-red">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 tracking-widest px-1">
                                        Auth Identifier <span className="text-paymint-red">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all disabled:opacity-50"
                                        placeholder="email@enterprise.com"
                                        required
                                        disabled={!!editingAdmin}
                                    />
                                </div>

                                {!editingAdmin && (
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 tracking-widest px-1">
                                            Access Token <span className="text-paymint-red">*</span>
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 pr-12 font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                                                required
                                                minLength={8}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-400 mt-1 px-1 tracking-tight">
                                            Entropy requirement: 8+ chars (A-z, 0-9)
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 tracking-widest px-1">
                                        Communication Line
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                                        placeholder="+000 000 000"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 tracking-widest px-1">
                                        Node Authorization
                                    </label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                        {establishments.map((est) => (
                                            <label
                                                key={est.id}
                                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${formData.establishmentIds.includes(est.id)
                                                    ? 'border-paymint-green bg-paymint-green/5'
                                                    : 'border-gray-200 dark:border-white/5 bg-white dark:bg-[#1E293B] hover:border-gray-300 dark:hover:border-white/10'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.establishmentIds.includes(est.id)}
                                                    onChange={() => toggleEstablishment(est.id)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formData.establishmentIds.includes(est.id) ? 'bg-paymint-green border-paymint-green' : 'border-gray-300 dark:border-white/10'}`}>
                                                    {formData.establishmentIds.includes(est.id) && <Check size={14} className="text-black" strokeWidth={3} />}
                                                </div>
                                                <span className={`font-bold text-sm ${formData.establishmentIds.includes(est.id) ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{est.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black tracking-[0.2em] text-[10px] rounded-xl hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 bg-paymint-green text-black font-black tracking-[0.2em] text-[10px] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
                                    >
                                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                        {editingAdmin ? 'Save Admin' : 'Save Admin'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
        </div>
    );
}
