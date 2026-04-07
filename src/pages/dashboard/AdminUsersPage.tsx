import { useState, useEffect, useMemo } from 'react';

import {
    Plus,
    Mail,
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
import { SearchInput, Pagination } from '../../components/ui';
import { useTranslation } from 'react-i18next';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    establishments: { id: string; name: string }[];
}

export function AdminUsersPage() {
    const { t } = useTranslation();
    const { establishments , currentEstablishment } = useAuth();
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
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
        } catch {
            toast.error(t('adminUsers.messages.loadFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const filteredAdmins = useMemo(() => {
        return (Array.isArray(adminUsers) ? adminUsers : []).filter(admin =>
            (admin.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (admin.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (admin.email || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [adminUsers, searchQuery]);

    const totalPages = Math.ceil((Array.isArray(filteredAdmins) ? filteredAdmins : []).length / ITEMS_PER_PAGE);

    const paginatedAdmins = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return (Array.isArray(filteredAdmins) ? filteredAdmins : []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAdmins, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingAdmin) {
                await api.put(`/api/accounts/admins/${editingAdmin.id}`, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    establishmentIds: formData.establishmentIds,
                });
                toast.success(t('adminUsers.messages.updated'));
            } else {
                await api.post('/api/accounts/admins', formData);
                toast.success(t('adminUsers.messages.created'));
            }
            setShowModal(false);
            resetForm();
            fetchAdminUsers();
        } catch (err) {
            toast.error((err as ApiError).response?.data?.message || t('adminUsers.messages.saveFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (admin: AdminUser) => {
        setConfirmConfig({
            isOpen: true,
            title: t('adminUsers.confirm.removeTitle'),
            message: t('adminUsers.confirm.removeMessage', { name: `${admin.firstName} ${admin.lastName}` }),
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/accounts/admins/${admin.id}`);
                    toast.success(t('adminUsers.messages.removed'));
                    fetchAdminUsers();
                } catch {
                    toast.error(t('adminUsers.messages.removeFailed'));
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
        <div className="space-y-8 pb-12" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
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
                            <div className="flex items-center gap-2 sm:gap-3 mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
                                  </div>
                                  <span className="text-xs font-bold text-paymint-green tracking-widest">{t('dashboard.shiftStatus.live')}</span>
                                </div>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('adminUsers.title')}</h1>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('adminUsers.subtitle')}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
                    </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-[#68B390] transition-all shadow-sm"
                        >
                            <Plus size={18} />
                            <span>{t('adminUsers.newAdmin')}</span>
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
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">{t('adminUsers.aboutTitle')}</h3>
                        <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                            {t('adminUsers.aboutDesc')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 sm:max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                        placeholder={t('adminUsers.searchPlaceholder')}
                    />
                </div>
            </div>

            {/* Admin List */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="py-32 flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
                        <p className="text-xs font-black tracking-widest text-gray-400">{t('adminUsers.loading')}</p>
                    </div>
                ) : filteredAdmins.length === 0 ? (
                    <div className="py-32 text-center flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/5">
                            <UserPlus className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {searchQuery.trim() ? t('common.noResults') : t('adminUsers.noAdmins')}
                        </h3>
                        <p className="text-sm font-bold text-gray-500 max-w-xs mx-auto">
                            {searchQuery.trim()
                                ? t('common.noMatchingResults', {
                                    entity: 'admins',
                                    query: searchQuery.trim(),
                                    defaultValue: 'No {{entity}} matching "{{query}}"',
                                })
                                : t('adminUsers.noAdminsDesc')}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                            {paginatedAdmins.map((admin) => (
                                <div
                                    key={admin.id}
                                    className="p-4 bg-white dark:bg-[#1E293B]"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center font-black text-sm shadow-sm">
                                                {admin.firstName.charAt(0)}{admin.lastName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{admin.firstName} {admin.lastName}</h3>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <Mail size={10} /> {admin.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(admin)}
                                                className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                                                title={t('common.edit')}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(admin)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-500"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-xs font-black text-gray-400 tracking-widest mb-2 uppercase">{t('adminUsers.accessLocations')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {admin.establishments.length > 0 ? (
                                            admin.establishments.map((est) => (
                                                <span
                                                    key={est.id}
                                                    className="px-2 py-1 bg-white dark:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-bold tracking-wide rounded-md border border-gray-200 dark:border-white/10"
                                                >
                                                    {est.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">{t('adminUsers.noLocations')}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Grid View */}
                        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                            {paginatedAdmins.map((admin) => (
                                <div
                                    key={admin.id}
                                    className="group relative p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/5 hover:shadow-xl transition-all duration-300 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-paymint-green/0 via-transparent to-paymint-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="relative z-10 flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center font-black text-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                {admin.firstName.charAt(0)}{admin.lastName.charAt(0)}
                                            </div>
                                            <div className={t('common.locale') === 'ar' ? 'mr-4' : 'ml-4'}>
                                                <p className="font-bold text-gray-900 dark:text-white text-lg tracking-tight group-hover:text-paymint-green transition-colors">
                                                    {admin.firstName} {admin.lastName}
                                                </p>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                        <Mail size={12} className="text-gray-400" />
                                                        {admin.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 transition-all translate-x-0">
                                            <button
                                                onClick={() => openEditModal(admin)}
                                                className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10 transition-all border border-gray-200 dark:border-white/10 shadow-sm"
                                                title={t('common.edit')}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(admin)}
                                                className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-red hover:bg-paymint-red/10 transition-all border border-gray-200 dark:border-white/10 shadow-sm"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                                        <p className="text-xs font-black text-gray-400 tracking-widest mb-2">{t('adminUsers.accessLocations')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {admin.establishments.map((est) => (
                                                <span
                                                    key={est.id}
                                                    className="px-2.5 py-1 bg-paymint-green/5 text-paymint-green text-xs font-black tracking-widest rounded-lg border border-paymint-green/10"
                                                >
                                                    {est.name}
                                                </span>
                                            ))}
                                            {admin.establishments.length === 0 && (
                                                <span className="text-xs text-gray-400 italic">{t('adminUsers.noLocations')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 popup-surface flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                            <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between relative isolate">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {editingAdmin ? t('adminUsers.editAdmin') : t('adminUsers.addAdmin')}
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
                                        <label className="block text-xs font-black text-gray-400 tracking-widest px-1">
                                            {t('adminUsers.form.firstName')} <span className="text-paymint-red">*</span>
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
                                        <label className="block text-xs font-black text-gray-400 tracking-widest px-1">
                                            {t('adminUsers.form.lastName')} <span className="text-paymint-red">*</span>
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
                                        <label className="block text-xs font-black text-gray-400 tracking-widest px-1">
                                            {t('adminUsers.form.email')} <span className="text-paymint-red">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all disabled:opacity-50"
                                            placeholder={t('adminUsers.form.emailPlaceholder')}
                                            required
                                            disabled={!!editingAdmin}
                                        />
                                    </div>

                                {!editingAdmin && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-400 tracking-widest px-1">
                                            {t('adminUsers.form.password')} <span className="text-paymint-red">*</span>
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
                                        <p className="text-xs font-bold text-gray-400 mt-1 px-1 tracking-tight">
                                            {t('adminUsers.form.passwordHint')}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-400 tracking-widest px-1">
                                        {t('adminUsers.form.locationAccess')}
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
                                        className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black tracking-[0.2em] text-xs rounded-xl hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 bg-paymint-green text-black font-black tracking-[0.2em] text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
                                    >
                                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                        {t('common.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

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



