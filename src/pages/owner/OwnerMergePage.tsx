import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, GitMerge, Store, Check, X, Loader2, Building2, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { formatInputPlaceholder, formatInputLabel } from '../../utils/textCase';
import { BusyOverlay } from '../../components/BusyOverlay';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

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
        <div className="space-y-8 pb-20 max-w-5xl">
            {/* Full-screen blocker while the merge request runs */}
            <BusyOverlay visible={isSubmitting} />

            {/* Standard Page Header */}
            <PageHeader
                title={t('owner.merge.title')}
                subtitle={
                    <span className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 border border-mintcom-green/20 text-mintcom-green text-xs font-bold">
                            <GitMerge size={12} />
                            {t('owner.merge.newBrandBadge')}
                        </span>
                        <span>{t('owner.merge.subtitle')}</span>
                    </span>
                }
                actions={
                    <Button
                        variant="secondary"
                        onClick={() => (step === 'configure' ? setStep('select') : navigate('/owner/brands'))}
                    >
                        <ArrowLeft size={16} />
                        {t('common.cancel')}
                    </Button>
                }
            />

            {/* Step Navigation */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/60 p-1.5 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm w-fit">
                {[
                    { id: 'select', label: t('owner.merge.steps.select'), icon: Store },
                    { id: 'configure', label: t('owner.merge.steps.details'), icon: Building2 },
                ].map((s, idx) => {
                    const isActive = step === s.id;
                    const StepIcon = s.icon;
                    return (
                        <div
                            key={s.id}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                                isActive
                                    ? 'bg-stone-900 text-white dark:bg-mintcom-green dark:text-black shadow-sm'
                                    : 'text-stone-500 dark:text-zinc-400'
                            }`}
                        >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black ${
                                isActive
                                    ? 'bg-white/20 text-white dark:bg-black/15 dark:text-black'
                                    : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400'
                            }`}>
                                {idx + 1}
                            </span>
                            <StepIcon size={14} />
                            <span>{s.label}</span>
                        </div>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                {step === 'select' ? (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            <div className="lg:col-span-2 space-y-4">
                                <h2 className="text-lg font-bold text-stone-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                                    <Store className="text-mintcom-green" size={18} /> {t('owner.merge.availableLocations')}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {establishments.map((est) => {
                                        const isSelected = selectedEstablishments.includes(est.id);
                                        return (
                                            <div
                                                key={est.id}
                                                onClick={() => toggleEstablishment(est.id)}
                                                className={`
                                                    p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border cursor-pointer transition-colors relative overflow-hidden shadow-sm
                                                    ${isSelected
                                                        ? 'border-mintcom-green ring-1 ring-mintcom-green/20 bg-mintcom-green/[0.03]'
                                                        : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700'}
                                                `}
                                            >
                                                <div className="flex items-center gap-3.5 relative z-10">
                                                    <div className={`
                                                        w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                                        ${isSelected ? 'bg-mintcom-green/15 text-emerald-700 dark:text-mintcom-green' : 'bg-stone-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500'}
                                                    `}>
                                                        <Store size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className={`text-sm font-bold tracking-tight truncate ${isSelected ? 'text-stone-900 dark:text-zinc-100' : 'text-stone-700 dark:text-zinc-300'}`}>
                                                            {est.name}
                                                        </h4>
                                                        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">{est.type}</p>
                                                    </div>
                                                    <div className={`
                                                        w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors
                                                        ${isSelected ? 'bg-mintcom-green border-mintcom-green text-black' : 'border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'}
                                                    `}>
                                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="lg:col-span-1">
                                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 shadow-sm sticky top-8 space-y-5">
                                    <h3 className="text-base font-bold tracking-tight text-stone-900 dark:text-zinc-100">{t('owner.merge.whyMerge')}</h3>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shrink-0">
                                                <Zap size={16} />
                                            </div>
                                            <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 leading-relaxed">
                                                {t('owner.merge.whyMergeDesc')}
                                            </p>
                                        </div>

                                        <div className="h-px bg-stone-100 dark:bg-zinc-800" />

                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-stone-500 dark:text-zinc-400">{t('common.status.title')}</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${selectedEstablishments.length >= 2 ? 'bg-mintcom-green' : 'bg-mintcom-red'}`} />
                                                <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                                                    {selectedEstablishments.length < 2
                                                        ? t('owner.merge.selectMore', { count: 2 - selectedEstablishments.length })
                                                        : t('owner.merge.readyForNextStep')}
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={handleContinue}
                                            disabled={selectedEstablishments.length < 2}
                                            className="w-full"
                                        >
                                            {t('owner.merge.nextStep', { count: selectedEstablishments.length })}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="configure"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                        className="max-w-2xl mx-auto space-y-6"
                    >
                        {/* Config Form */}
                        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100 tracking-tight">{t('owner.merge.brandDetails')}</h3>
                                <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mt-1">{t('owner.merge.brandDetailsSubtitle')}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block">
                                    {formatInputLabel(t('owner.merge.brandName'), t('common.locale'))}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 start-3.5 flex items-center pointer-events-none text-stone-400 dark:text-zinc-500">
                                        <Building2 size={18} />
                                    </div>
                                    <input
                                        maxLength={255}
                                        type="text"
                                        value={brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        placeholder={formatInputPlaceholder(t('owner.merge.brandNamePlaceholder'), t('common.locale'))}
                                        className="w-full ps-11 pe-4 py-2.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:border-mintcom-green focus:ring-2 focus:ring-mintcom-green/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-800 space-y-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shrink-0">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <h4 className="text-sm font-bold tracking-tight text-stone-900 dark:text-zinc-100">{t('common.security')}</h4>
                                </div>
                                <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed ps-9">
                                    {t('owner.merge.securityInfo', { name: firstSelectedEst?.name })}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    onClick={() => setStep('select')}
                                    className="flex-1"
                                >
                                    {t('common.back')}
                                </Button>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleMerge}
                                    disabled={isSubmitting || !brandName.trim()}
                                    className="flex-[2]"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <GitMerge size={16} />}
                                    {t('owner.merge.createBrand')}
                                </Button>
                            </div>
                        </div>

                        {/* Selected List */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 shadow-sm space-y-3">
                            <h4 className="text-xs font-semibold text-stone-500 dark:text-zinc-400">{t('owner.merge.selectedLocations')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedEstInfo.map((est) => (
                                    <div key={est.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-zinc-100">
                                        <Store size={13} className="text-mintcom-green" />
                                        <span>{est.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleEstablishment(est.id)}
                                            className="text-stone-400 hover:text-red-500 transition-colors ms-1"
                                            aria-label={t('common.remove')}
                                        >
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
