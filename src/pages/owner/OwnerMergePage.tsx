import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, GitMerge, Store, Check, X, Loader2, Sparkles, Building2, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';

export function OwnerMergePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { establishments, refreshEstablishments } = useAuth();
    const [selectedEstablishments, setSelectedEstablishments] = useState<string[]>([]);
    const [brandName, setBrandName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'select' | 'configure'>('select');

    const toggleEstablishment = (id: string) => {
        setSelectedEstablishments((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleContinue = () => {
        if (selectedEstablishments.length < 2) {
            toast.error(t('owner.merge.selectMinLocations'));
            return;
        }
        setStep('configure');
    };

    const handleMerge = async () => {
        if (!brandName.trim()) {
            toast.error(t('owner.merge.enterBrandName'));
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/api/brands', {
                name: brandName,
                establishmentIds: selectedEstablishments,
            });
            toast.success(t('owner.merge.brandCreated'));
            await refreshEstablishments();
            navigate('/owner/brands');
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('owner.merge.createFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedEstInfo = establishments.filter((e) => selectedEstablishments.includes(e.id));
    const firstSelectedEst = selectedEstInfo[0];

    return (
        <div className="space-y-10 pb-20 max-w-5xl">
            {/* Ultra Premium Header */}
            <div className="relative overflow-hidden rounded-[4rem] bg-white dark:bg-[#1E293B] p-12 border border-gray-200 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-paymint-green/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-paymint-green/10 border border-paymint-green/20">
                            <GitMerge size={14} className="text-paymint-green" />
                            <span className="text-xs font-black text-paymint-green tracking-[0.2em]">{t('owner.merge.newBrandBadge')}</span>
                        </div>

                        <div>
                            <h1 className="text-5xl xl:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-4">
                                {t('owner.merge.create')} <span className="text-paymint-green">{t('owner.merge.brand')}</span>
                            </h1>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
                                {t('owner.merge.subtitle')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => step === 'configure' ? setStep('select') : navigate('/owner/brands')}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white font-black text-xs tracking-widest hover:bg-gray-100 dark:hover:bg-white/5 transition-all self-start xl:self-center shadow-lg"
                    >
                        <ArrowLeft size={18} />
                        {t('common.cancel')}
                    </button>
                </div>
            </div>

            {/* Step Landscape */}
            <div className="flex items-center gap-8 px-6">
                {[
                    { id: 'select', label: t('owner.merge.steps.select'), icon: Store },
                    { id: 'configure', label: t('owner.merge.steps.details'), icon: Building2 }
                ].map((s, idx) => (
                    <div key={s.id} className="flex items-center gap-4 group">
                        <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500
                            ${step === s.id
                                ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20 scale-110'
                                : 'bg-white dark:bg-[#1E293B] text-gray-400 border border-gray-100 dark:border-white/5'}
                        `}>
                            {idx + 1}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-xs tracking-[0.2em] font-black ${step === s.id ? 'text-paymint-green' : 'text-gray-400'}`}>
                                {s.label}
                            </span>
                        </div>
                        {idx === 0 && <div className="w-16 h-px bg-gray-200 dark:bg-white/10 mx-2" />}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 'select' ? (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight px-2 flex items-center gap-3">
                                    <Store className="text-paymint-green" size={20} /> {t('owner.merge.availableLocations')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {establishments.map((est) => {
                                        const isSelected = selectedEstablishments.includes(est.id);
                                        return (
                                            <motion.div
                                                key={est.id}
                                                onClick={() => toggleEstablishment(est.id)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`
                                                    p-6 rounded-[2.5rem] bg-white dark:bg-[#1E293B] border-2 cursor-pointer transition-all relative overflow-hidden group
                                                    ${isSelected
                                                        ? 'border-paymint-green bg-paymint-green/[0.02] shadow-xl shadow-paymint-green/5'
                                                        : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'}
                                                `}
                                            >
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={`
                                                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500
                                                        ${isSelected ? 'bg-paymint-green text-black' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}
                                                    `}>
                                                        <Store size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className={`text-sm font-black tracking-tight ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                            {est.name}
                                                        </h4>
                                                        <p className="text-xs font-black text-gray-400 tracking-widest">{est.type}</p>
                                                    </div>
                                                    <div className={`
                                                        w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                                                        ${isSelected ? 'bg-paymint-green border-paymint-green' : 'border-gray-200 dark:border-white/10'}
                                                    `}>
                                                        {isSelected && <Check size={16} className="text-black" />}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-[-20%] right-[-20%] w-[40%] h-[40%] bg-paymint-green/10 rounded-full blur-2xl transition-all" />
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="lg:col-span-1 space-y-6">
                                <div className="p-8 rounded-[3rem] bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 sticky top-8">
                                    <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">{t('owner.merge.whyMerge')}</h3>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                                <Zap size={18} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-500 leading-relaxed">
                                                {t('owner.merge.whyMergeDesc')}
                                            </p>
                                        </div>

                                        <div className="h-px bg-gray-200 dark:bg-white/10" />

                                        <div className="space-y-2">
                                            <p className="text-xs font-black text-gray-400 tracking-widest leading-none">{t('common.status.title')}</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${selectedEstablishments.length >= 2 ? 'bg-paymint-green' : 'bg-paymint-red'} animate-pulse`} />
                                                <span className="text-xs font-black text-gray-900 dark:text-white">
                                                    {selectedEstablishments.length < 2
                                                        ? t('owner.merge.selectMore', { count: 2 - selectedEstablishments.length })
                                                        : t('owner.merge.readyForNextStep')}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleContinue}
                                            disabled={selectedEstablishments.length < 2}
                                            className="w-full py-5 bg-paymint-green text-black rounded-2xl font-black text-xs tracking-[0.2em] shadow-xl shadow-paymint-green/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                                        >
                                            {t('owner.merge.nextStep', { count: selectedEstablishments.length })}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="configure"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-3xl mx-auto space-y-10"
                    >
                        {/* Config Form */}
                        <div className="p-10 rounded-[3rem] bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 shadow-2xl space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">{t('owner.merge.brandDetails')}</h3>
                                <p className="text-xs font-black text-gray-400 tracking-widest uppercase">{t('owner.merge.brandDetailsSubtitle')}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 tracking-[0.2em] px-2 block">{t('owner.merge.brandName')}</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-6 flex items-center text-gray-400 group-hover:text-paymint-green transition-colors">
                                        <Building2 size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        placeholder={t('owner.merge.brandNamePlaceholder')}
                                        className="w-full pl-16 pr-8 py-6 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-3xl font-black text-lg text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-paymint-green/10 focus:border-paymint-green/30 transition-all tracking-tight"
                                    />
                                </div>
                            </div>

                            <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <h4 className="text-xl font-bold tracking-tight text-indigo-900 dark:text-indigo-200">{t('common.security')}</h4>
                                </div>
                                <p className="text-xs font-bold text-indigo-500 leading-relaxed px-1">
                                    {t('owner.merge.securityInfo', { name: firstSelectedEst?.name })}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep('select')}
                                    className="flex-1 py-5 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black text-xs tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                >
                                    {t('common.back')}
                                </button>
                                <button
                                    onClick={handleMerge}
                                    disabled={isSubmitting || !brandName.trim()}
                                    className="flex-[2] py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    {t('owner.merge.createBrand')}
                                </button>
                            </div>
                        </div>

                        {/* Selected List */}
                        <div className="px-10 space-y-4">
                            <h4 className="text-xs font-black text-gray-400 tracking-widest px-2">{t('owner.merge.selectedLocations')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedEstInfo.map((est) => (
                                    <div key={est.id} className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 rounded-xl shadow-sm group">
                                        <Store size={14} className="text-paymint-green" />
                                        <span className="text-xs font-black text-gray-900 dark:text-white tracking-tight">{est.name}</span>
                                        <button onClick={() => toggleEstablishment(est.id)} className="text-gray-300 hover:text-paymint-red transition-colors ml-2">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
