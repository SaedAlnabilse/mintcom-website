import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { motion } from 'framer-motion';
import { Award, Plus, Edit2, Trash2, Percent, Gift } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { RewardFormModal } from '../../components/forms/RewardFormModal';
import { Pagination } from '../../components/ui';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
        status?: number;
    };
}

interface Category {
    id: string;
    name: string;
}

interface LoyaltyConfig {
    id?: string;
    enabled: boolean;
    pointsPerCurrency: number;
    currencyPerPoint: number;
    rewards?: LoyaltyReward[];
}

interface LoyaltyReward {
    id: string;
    type: 'DISCOUNT' | 'FREE_ITEM';
    name: string;
    pointsRequired: number;
    discountPercentage?: number;
    freeCategoryId?: string;
    freeCategoryName?: string;
}

export function LoyaltyPage() {
    const { t } = useTranslation();
    const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [initialLoyaltyConfig, setInitialLoyaltyConfig] = useState<LoyaltyConfig | null>(null);
    const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        onClose?: () => void;
        type?: 'danger' | 'success' | 'warning' | 'info';
        confirmText?: string;
        showCancel?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // ATM-style input state for currencyPerPoint (stores value in cents)
    const [currencyPerPointCents, setCurrencyPerPointCents] = useState(0);
    const lastSyncedCurrencyPerPoint = useRef<number | null>(null);

    // Input state for pointsPerCurrency (Integer)
    const [pointsPerCurrency, setPointsPerCurrency] = useState(0);
    const lastSyncedPointsPerCurrency = useRef<number | null>(null);

    // Display values
    const currencyPerPointDisplay = (currencyPerPointCents / 100).toFixed(2);
    const pointsPerCurrencyDisplay = String(pointsPerCurrency);

    const [categories, setCategories] = useState<Category[]>([]);
    const { currency } = useCurrency();

    useEffect(() => {
        fetchLoyaltyConfig();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/api/categories');
            const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
            setCategories(data);
        } catch {
            console.error('Failed to load categories');
        }
    };

    const fetchLoyaltyConfig = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/app-settings/loyalty-config');
            const config = {
                pointsPerCurrency: 1,
                currencyPerPoint: 1,
                ...response.data,
                enabled: true
            };
            setLoyaltyConfig(config);
            setInitialLoyaltyConfig(JSON.parse(JSON.stringify(config)));
            if (response.data?.rewards) {
                setRewards(response.data.rewards);
            } else {
                setRewards([]);
            }
        } catch {
            console.error('Failed to load loyalty config');
            toast.error(t('rewards.errors.failedToLoad'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (loyaltyConfig?.currencyPerPoint !== undefined &&
            loyaltyConfig.currencyPerPoint !== lastSyncedCurrencyPerPoint.current) {
            lastSyncedCurrencyPerPoint.current = loyaltyConfig.currencyPerPoint;
            setCurrencyPerPointCents(Math.round(loyaltyConfig.currencyPerPoint * 100));
        }
    }, [loyaltyConfig?.currencyPerPoint]);

    useEffect(() => {
        if (loyaltyConfig?.pointsPerCurrency !== undefined &&
            loyaltyConfig.pointsPerCurrency !== lastSyncedPointsPerCurrency.current) {
            lastSyncedPointsPerCurrency.current = loyaltyConfig.pointsPerCurrency;
            setPointsPerCurrency(loyaltyConfig.pointsPerCurrency);
        }
    }, [loyaltyConfig?.pointsPerCurrency]);

    const safeUpdateLoyaltyConfig = async (newConfig: LoyaltyConfig) => {
        const payload = {
            id: newConfig.id,
            enabled: true,
            pointsPerCurrency: newConfig.pointsPerCurrency,
            currencyPerPoint: newConfig.currencyPerPoint,
            rewards: newConfig.rewards
        };

        try {
            // First try the dedicated endpoint
            await api.put('/app-settings/loyalty-config', payload);
        } catch (err) {
            const error = err as ApiError;
            // If 403/404, valid fallback to main settings endpoint
            if (error.response && (error.response.status === 403 || error.response.status === 404)) {
                try {
                    const { data: fullSettings } = await api.get('/app-settings');
                    await api.put('/app-settings', {
                        ...fullSettings,
                        loyaltyConfig: payload
                    });
                } catch {
                    throw err; // Throw original error if fallback also fails
                }
            } else {
                throw err;
            }
        }
    };

    const handleCurrencyPerPointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
        const cents = parseInt(digitsOnly, 10) || 0;
        if (cents <= 999999999) {
            setCurrencyPerPointCents(cents);
            const newVal = cents / 100;
            lastSyncedCurrencyPerPoint.current = newVal;
            setLoyaltyConfig(prev => prev ? { ...prev, currencyPerPoint: newVal } : null);
        }
    };

    const handlePointsPerCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
        const points = parseInt(digitsOnly, 10) || 0;
        if (points <= 999999) {
            setPointsPerCurrency(points);
            lastSyncedPointsPerCurrency.current = points;
            setLoyaltyConfig(prev => prev ? { ...prev, pointsPerCurrency: points } : null);
        }
    };

    const handleEditReward = (reward: LoyaltyReward) => {
        setEditingReward(reward);
        setShowRewardModal(true);
    };

    const handleDeleteReward = (rewardId: string) => {
        setConfirmConfig({
            isOpen: true,
            title: t('rewards.messages.deleteTitle'),
            message: t('rewards.messages.deleteMsg'),
            type: 'danger',
            confirmText: t('common.delete'),
            onConfirm: async () => {
                if (!loyaltyConfig) return;
                const updatedRewards = (Array.isArray(rewards) ? rewards : []).filter(r => r.id !== rewardId);
                const updatedConfig = {
                    ...loyaltyConfig,
                    rewards: updatedRewards,
                };

                try {
                    await safeUpdateLoyaltyConfig(updatedConfig);
                    setRewards(updatedRewards);
                    setConfirmConfig({
                        isOpen: true,
                        title: t('rewards.messages.rewardDeleted'),
                        message: t('rewards.messages.rewardDeleted'),
                        type: 'success',
                        confirmText: t('common.done'),
                        showCancel: false,
                        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
                    });
                } catch (err) {
                    toast.error((err as ApiError).response?.data?.message || t('rewards.errors.deleteFailed'));
                }
            },
            onClose: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        });
    };

    const handleSaveReward = async (rewardData: Record<string, any>) => {
        if (!loyaltyConfig) return;
        const newReward: LoyaltyReward = {
            id: editingReward?.id || `reward_${Date.now()}`,
            type: rewardData.type,
            name: rewardData.type === 'DISCOUNT'
                ? `Discount ${rewardData.discountPercentage}%`
                : 'Free Item',
            pointsRequired: parseInt(rewardData.pointsRequired, 10),
            discountPercentage: rewardData.type === 'DISCOUNT' ? parseFloat(rewardData.discountPercentage) : undefined,
            freeCategoryId: rewardData.type === 'FREE_ITEM' ? rewardData.freeCategoryId : undefined,
            freeCategoryName: rewardData.type === 'FREE_ITEM' ? rewardData.freeCategoryName : undefined,
        };

        let updatedRewards: LoyaltyReward[];
        if (editingReward) {
            updatedRewards = (Array.isArray(rewards) ? rewards : []).map(r => r.id === editingReward.id ? newReward : r);
        } else {
            updatedRewards = [...(Array.isArray(rewards) ? rewards : []), newReward];
        }

        const updatedConfig = {
            ...loyaltyConfig,
            rewards: updatedRewards,
        };

        try {
            await safeUpdateLoyaltyConfig(updatedConfig);
            setRewards(updatedRewards);
            setShowRewardModal(false);
            setEditingReward(null);
            setConfirmConfig({
                isOpen: true,
                title: editingReward ? t('rewards.messages.rewardUpdated') : t('rewards.messages.rewardAdded'),
                message: editingReward ? t('rewards.messages.rewardUpdated') : t('rewards.messages.rewardAdded'),
                type: 'success',
                confirmText: t('common.done'),
                showCancel: false,
                onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            });
        } catch (err) {
            toast.error((err as ApiError).response?.data?.message || t('rewards.errors.saveFailed'));
        }
    };

    const totalPages = Math.ceil((Array.isArray(rewards) ? rewards : []).length / ITEMS_PER_PAGE);
    const paginatedRewards = (Array.isArray(rewards) ? rewards : []).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const hasChanges = JSON.stringify(loyaltyConfig) !== JSON.stringify(initialLoyaltyConfig);

    const saveConfig = async () => {
        if (!loyaltyConfig || loyaltyConfig.pointsPerCurrency < 0 || loyaltyConfig.currencyPerPoint <= 0) {
            toast.error(t('rewards.errors.validValues'));
            return;
        }

        try {
            await safeUpdateLoyaltyConfig(loyaltyConfig);

            setInitialLoyaltyConfig(JSON.parse(JSON.stringify(loyaltyConfig)));
            toast.success(t('rewards.messages.configSaved'));
        } catch (err) {
            console.error("Save config error:", err);
            const errorMessage = (err as ApiError).response?.data?.message || (err as Error).message || t('rewards.errors.saveFailed');
            toast.error(errorMessage);
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-paymint-green/20 rounded-full" />
                    <div className="w-16 h-16 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-bold text-gray-400 tracking-widest">{t('rewards.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                            {t('rewards.badge')}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('rewards.title')}</h1>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">
                        {t('rewards.subtitle')}
                    </p>
                </div>
                {hasChanges && (
                    <button
                        onClick={saveConfig}
                        className="px-6 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-paymint-green/20"
                    >
                        {t('common.save')}
                    </button>
                )}
            </div>

            {loyaltyConfig && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-8 space-y-10 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green shadow-sm">
                                <Award className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('rewards.configuration')}</h3>
                                <p className="text-xs font-black text-gray-400 tracking-widest">{t('rewards.configurationSubtitle')}</p>
                            </div>
                        </div>
                        {/* Toggle removed */}
                    </div>

                    <div className={`space-y-10 transition-all duration-500`}>
                        <div className="space-y-5 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-paymint-green rounded-full" />
                                <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-widest px-1">{t('rewards.earningRules')}</h4>
                            </div>
                            <div className="bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/5 p-8 shadow-sm">
                                <div className="flex flex-col lg:flex-row items-center gap-8">
                                    {/* Spend Input Section */}
                                    <div className="flex-1 w-full lg:w-auto space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-gray-400 tracking-[0.2em]">{t('rewards.forEvery')}</span>
                                        </div>
                                        <div className="flex items-stretch bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] rounded-2xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-paymint-green/10 focus-within:border-paymint-green transition-all group/field">
                                            <div className="px-6 flex items-center justify-center bg-gray-50 dark:bg-white/5 border-r border-gray-200 dark:border-white/[0.08] min-w-[80px]">
                                                <span className="text-sm font-black text-paymint-green">{currency}</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={currencyPerPointDisplay}
                                                onChange={handleCurrencyPerPointChange}
                                                className="flex-1 w-full bg-transparent font-bold text-3xl text-gray-900 dark:text-white focus:outline-none transition-all px-6 py-4"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Connector */}
                                    <div className="flex flex-col items-center justify-center py-4 lg:py-0 self-end lg:pb-5">
                                        <div className="text-xs font-black text-gray-400 tracking-widest">{t('rewards.equals')}</div>
                                    </div>

                                    {/* Points Input Section */}
                                    <div className="flex-1 w-full lg:w-auto space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-gray-400 tracking-[0.2em] opacity-0 lg:block hidden">Spacer</span>
                                        </div>
                                        <div className="flex items-stretch bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] rounded-2xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-paymint-green/10 focus-within:border-paymint-green transition-all group/field">
                                            <div className="px-6 flex items-center justify-center bg-gray-50 dark:bg-white/5 border-r border-gray-200 dark:border-white/[0.08] min-w-[80px]">
                                                <span className="text-sm font-black text-paymint-green">{t('rewards.points')}</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={pointsPerCurrencyDisplay}
                                                onChange={handlePointsPerCurrencyChange}
                                                className="flex-1 w-full bg-transparent font-bold text-3xl text-paymint-green focus:outline-none transition-all px-6 py-4"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 bg-white dark:bg-[#0B1120] px-6 py-4 rounded-2xl border border-gray-100 dark:border-white/[0.03] shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-paymint-green animate-pulse" />
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {t('rewards.activeRule', { points: pointsPerCurrencyDisplay, amount: currencyPerPointDisplay, currency: currency })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rewards List */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-paymint-green rounded-full" />
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-widest px-1">{t('dashboard.menu.loyalty')}</h4>
                                </div>
                                <button type="button" onClick={() => { setEditingReward(null); setShowRewardModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-paymint-green/10 text-paymint-green rounded-xl text-xs font-black tracking-widest hover:bg-paymint-green/20 transition-all border border-paymint-green/20">
                                    <Plus size={14} /> {t('rewards.addPattern')}
                                </button>
                            </div>
                            {rewards.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/50 dark:bg-black/5">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center mx-auto mb-4 text-paymint-green shadow-sm">
                                        <Award size={24} />
                                    </div>
                                    <p className="text-xs font-black text-gray-400 tracking-widest">{t('rewards.catalogEmpty')}</p>
                                    <p className="text-xs font-black text-gray-400 mt-1 tracking-widest">{t('rewards.createTiers')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {paginatedRewards.map((reward) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                key={reward.id}
                                                className="group relative flex items-center justify-between p-5 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/5 transition-all duration-300 hover:shadow-lg overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-paymint-green/0 via-transparent to-paymint-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                                <div className="relative z-10 flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                        {reward.type === 'DISCOUNT' ? <Percent size={22} /> : <Gift size={22} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-paymint-green transition-colors">{reward.name.includes('Discount') ? reward.name.replace('Discount', t('discounts.title')) : reward.name.includes('Free Item') ? reward.name.replace('Free Item', t('rewards.form.freeItem')) : reward.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-xs text-gray-400 font-black tracking-widest">{reward.pointsRequired} {t('rewards.pointsUnit')}</span>
                                                            <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
                                                            <span className="text-xs text-paymint-green font-black tracking-widest">
                                                                {reward.type === 'DISCOUNT'
                                                                    ? `${reward.discountPercentage}% ${t('rewards.off')}`
                                                                    : reward.freeCategoryName ? t('rewards.freeFrom', { category: reward.freeCategoryName }) : t('rewards.freeProduct')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="relative z-10 flex gap-1 transition-all translate-x-0">
                                                    <button type="button" onClick={() => handleEditReward(reward)} className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-green border border-gray-200 dark:border-white/5 transition-colors shadow-sm">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteReward(reward.id)} className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 border border-gray-200 dark:border-white/5 transition-colors shadow-sm">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="pt-6">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={(page) => setCurrentPage(page)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            <RewardFormModal
                isOpen={showRewardModal}
                onClose={() => { setShowRewardModal(false); setEditingReward(null); }}
                onSave={handleSaveReward}
                initialData={editingReward || undefined}
                categories={categories}
            />

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onClose={confirmConfig.onClose || (() => setConfirmConfig(prev => ({ ...prev, isOpen: false })))}
                type={confirmConfig.type || 'info'}
                confirmText={confirmConfig.confirmText}
                cancelText={confirmConfig.showCancel === false ? undefined : t('common.cancel')}
            />
        </div>
    );
}
