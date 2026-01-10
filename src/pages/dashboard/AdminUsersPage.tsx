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
    Building2
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
                toast.success('Admin updated successfully');
            } else {
                await api.post('/api/accounts/admins', formData);
                toast.success('Admin created successfully');
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
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cream-50 via-cream-100 to-cream-50 dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-cream-300 dark:border-white/5 shadow-sm">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
                            <Shield size={28} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Admin Users</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Manage additional administrators for your account</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-paymint-green/30"
                        >
                            <Plus size={18} />
                            <span>Add Admin</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">About Admin Users</h3>
                        <p className="text-blue-800 dark:text-blue-200 text-sm">
                            Admin users can access the web dashboard and admin mobile app. They will also receive a POS employee account automatically.
                        </p>
                    </div>
                </div>
            </div>

            {/* Admin List */}
            <div className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-200 dark:border-white/5 shadow-md overflow-hidden">
                {isLoading ? (
                    <div className="py-32 flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading...</p>
                    </div>
                ) : adminUsers.length === 0 ? (
                    <div className="py-32 text-center flex flex-col items-center">
                        <div className="w-24 h-24 bg-cream-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-cream-300">
                            <UserPlus className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Admin Users Yet</h3>
                        <p className="text-gray-500 max-w-xs font-medium mx-auto">
                            Create additional admin users to help manage your business.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {adminUsers.map((admin) => (
                            <motion.div
                                key={admin.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-6 flex items-center justify-between group hover:bg-cream-100 dark:hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black text-xl">
                                        {admin.firstName.charAt(0)}{admin.lastName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 dark:text-white text-lg">
                                            {admin.firstName} {admin.lastName}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <Mail size={12} />
                                                {admin.email}
                                            </span>
                                            {admin.phone && (
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Phone size={12} />
                                                    {admin.phone}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {admin.establishments.map((est) => (
                                                <span
                                                    key={est.id}
                                                    className="px-2 py-0.5 bg-cream-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded-lg border border-cream-200"
                                                >
                                                    {est.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(admin)}
                                        className="p-2.5 rounded-xl bg-cream-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10 transition-all border border-cream-300"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(admin)}
                                        className="p-2.5 rounded-xl bg-cream-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all border border-cream-300"
                                    >
                                        <Trash2 size={16} />
                                    </button>
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
                            className="bg-cream-50 dark:bg-[#0A0A0A] rounded-3xl border border-cream-300 dark:border-white/10 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-cream-200 dark:border-white/5 flex items-center justify-between">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                                    {editingAdmin ? 'Edit Admin' : 'Add Admin User'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 rounded-xl hover:bg-cream-200 dark:hover:bg-white/5 transition-colors"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full bg-cream-100 dark:bg-black/20 border border-cream-300 dark:border-white/10 rounded-xl py-3 px-4 font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full bg-cream-100 dark:bg-black/20 border border-cream-300 dark:border-white/10 rounded-xl py-3 px-4 font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-cream-100 dark:bg-black/20 border border-cream-300 dark:border-white/10 rounded-xl py-3 px-4 font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
                                        required
                                        disabled={!!editingAdmin}
                                    />
                                </div>

                                {!editingAdmin && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-cream-100 dark:bg-black/20 border border-cream-300 dark:border-white/10 rounded-xl py-3 px-4 pr-12 font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
                                                required
                                                minLength={8}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Minimum 8 characters with uppercase, lowercase, and number.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-cream-100 dark:bg-black/20 border border-cream-300 dark:border-white/10 rounded-xl py-3 px-4 font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green/30"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Access to Establishments
                                    </label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {establishments.map((est) => (
                                            <label
                                                key={est.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.establishmentIds.includes(est.id)
                                                    ? 'border-paymint-green bg-paymint-green/5'
                                                    : 'border-cream-200 dark:border-white/5 hover:border-cream-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.establishmentIds.includes(est.id)}
                                                    onChange={() => toggleEstablishment(est.id)}
                                                    className="sr-only"
                                                />
                                                <Building2 size={18} className={formData.establishmentIds.includes(est.id) ? 'text-paymint-green' : 'text-gray-400'} />
                                                <span className="font-bold text-gray-900 dark:text-white">{est.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 bg-paymint-green text-black font-black rounded-xl hover:bg-paymint-green/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                                        {editingAdmin ? 'Update' : 'Create Admin'}
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
            />
        </div>
    );
}
