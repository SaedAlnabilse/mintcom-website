import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, MousePointerClick, CheckSquare, AlertCircle } from 'lucide-react';
import { QuickInfo } from '../QuickInfo';
import { useScrollLock } from '../../hooks/useScrollLock';

interface Attribute {
    id: string;
    name: string;
    inputType: 'SINGLE_SELECT' | 'MULTI_SELECT';
}

interface AttributeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, inputType: 'SINGLE_SELECT' | 'MULTI_SELECT', isRequired: boolean) => Promise<void>;
    onDelete?: (id: string) => void;
    initialData?: Attribute | null;
    isSubmitting?: boolean;
}

export function AttributeFormModal({
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    initialData,
    isSubmitting = false,
}: AttributeFormModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [inputType, setInputType] = useState<'SINGLE_SELECT' | 'MULTI_SELECT'>('SINGLE_SELECT');
    const [isRequired, setIsRequired] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useScrollLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            if (initialData) {
                setName(initialData.name);
                setInputType(initialData.inputType);
                setIsRequired(false); // Assuming initialData doesn't have it yet based on interface, but defaulting to false
            } else {
                setName('');
                setInputType('SINGLE_SELECT');
                setIsRequired(false);
            }
        }
    }, [isOpen, initialData]);

    const errorBannerRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!name.trim()) {
            newErrors.name = t('attributes.errors.nameRequired');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to error
            setTimeout(() => {
                errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        await onSubmit(name, inputType, isRequired);
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div
                dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans"
            >
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                    className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] transition-colors duration-300 border border-gray-200 dark:border-white/5 shadow-2xl"
                >
                    {/* Mobile drag handle */}
                    <div className="sm:hidden flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-8 pb-4 relative isolate">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black text-gray-400 tracking-widest">{t('attributes.title')}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                <span className="text-xs font-black text-paymint-green tracking-widest">{t('common.active')}</span>
                            </div>
                            <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">
                                {initialData ? t('attributes.editAttribute') : t('attributes.newAttribute')}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-4 sm:p-8 pt-2 custom-scrollbar flex-1 pb-safe">
                        <form id="attribute-form" onSubmit={handleSubmit} className="space-y-8">
                            {/* Error Banner */}
                            {Object.keys(errors).length > 0 && (
                                <div ref={errorBannerRef} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                    {t('common.validationError')}
                                </div>
                            )}

                            {/* Name */}
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                                    {t('attributes.form.nameLabel')} <span className="text-paymint-red">*</span>
                                    <QuickInfo text={t('attributes.form.nameTip')} />
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                                    placeholder={t('attributes.form.namePlaceholder')}
                                    className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                                />
                                {errors.name && <p className="mt-1.5 px-1 text-xs font-bold text-paymint-red">{errors.name}</p>}
                            </div>

                            {/* Input Type Selection */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                                    {t('attributes.form.typeLabel')}
                                    <QuickInfo text={t('attributes.form.typeTip')} />
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setInputType('SINGLE_SELECT')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 text-left relative overflow-hidden group ${inputType === 'SINGLE_SELECT'
                                            ? 'bg-paymint-green/10 border-paymint-green'
                                            : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5 hover:border-paymint-green/30'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${inputType === 'SINGLE_SELECT' ? 'bg-paymint-green text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                            <MousePointerClick size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${inputType === 'SINGLE_SELECT' ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>{t('attributes.form.single')}</p>
                                            <p className="text-xs font-bold text-gray-500 mt-1">{t('attributes.form.singleDesc')}</p>
                                        </div>
                                        {inputType === 'SINGLE_SELECT' && (
                                            <div className="absolute top-4 right-4 text-paymint-green">
                                                <div className="w-2 h-2 rounded-full bg-paymint-green shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setInputType('MULTI_SELECT')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 text-left relative overflow-hidden group ${inputType === 'MULTI_SELECT'
                                            ? 'bg-paymint-green/10 border-paymint-green'
                                            : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5 hover:border-paymint-green/30'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${inputType === 'MULTI_SELECT' ? 'bg-paymint-green text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                            <CheckSquare size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${inputType === 'MULTI_SELECT' ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>{t('attributes.form.multiple')}</p>
                                            <p className="text-xs font-bold text-gray-500 mt-1">{t('attributes.form.multipleDesc')}</p>
                                        </div>
                                        {inputType === 'MULTI_SELECT' && (
                                            <div className="absolute top-4 right-4 text-paymint-green">
                                                <div className="w-2 h-2 rounded-full bg-paymint-green shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Required Toggle */}
                            <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t('attributes.form.requiredLabel')}</p>
                                    <p className="text-xs font-bold text-gray-500 mt-0.5">{t('attributes.form.requiredDesc')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isRequired} onChange={() => setIsRequired(!isRequired)} className="sr-only peer" />
                                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-paymint-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                                </label>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl p-4 flex gap-3">
                                <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-black tracking-widest text-blue-500 mb-1">{t('attributes.form.infoTitle')}</p>
                                    <p className="text-xs font-bold text-gray-500 leading-relaxed">
                                        {t('attributes.form.infoDesc')}
                                    </p>
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-8 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 sm:gap-4 bg-gray-50 dark:bg-black/20 transition-colors sticky bottom-0 pb-safe">
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(initialData.id)}
                                className="w-14 h-14 flex items-center justify-center bg-white dark:bg-white/5 text-gray-400 hover:text-paymint-red rounded-xl border border-gray-200 dark:border-white/10 transition-all shadow-sm group active:scale-90"
                            >
                                <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 sm:h-14 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-black text-xs tracking-widest hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            form="attribute-form"
                            disabled={isSubmitting}
                            className="flex-[2] h-12 sm:h-14 rounded-xl bg-paymint-green text-black font-black text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
                        >
                            {isSubmitting ? (
                                <div className="w-[18px] h-[18px] border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                initialData ? t('common.save') : t('common.add')
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}

