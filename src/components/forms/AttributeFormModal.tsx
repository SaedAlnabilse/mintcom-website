import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, RefreshCw, MousePointerClick, CheckSquare, AlertCircle } from 'lucide-react';
import { QuickInfo } from '../QuickInfo';

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
    const [name, setName] = useState('');
    const [inputType, setInputType] = useState<'SINGLE_SELECT' | 'MULTI_SELECT'>('SINGLE_SELECT');
    const [isRequired, setIsRequired] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setErrors({ name: 'Attribute name is required' });
            return;
        }
        await onSubmit(name, inputType, isRequired);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300 border border-gray-200 dark:border-white/5 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-8 pb-4 relative isolate">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Modifier Protocol</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                <span className="text-[10px] font-black text-paymint-green uppercase tracking-widest">Active Schema</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {initialData ? 'Edit Modifier' : 'New Modifier'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-8 pt-2 custom-scrollbar flex-1">
                        <form id="attribute-form" onSubmit={handleSubmit} className="space-y-8">

                            {/* Name */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center">
                                    Legal Descriptor <span className="text-paymint-red mx-1">*</span>
                                    <QuickInfo text="The name of this modifier group (e.g. 'Size', 'Toppings')." />
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                                    placeholder="e.g. SPICE LEVEL"
                                    className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-bold shadow-sm`}
                                />
                                {errors.name && <p className="mt-1.5 px-1 text-[10px] font-black uppercase text-paymint-red tracking-wider">{errors.name}</p>}
                            </div>

                            {/* Input Type Selection */}
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center">
                                    Selection Behavior
                                    <QuickInfo text="Determines how many options the customer can select." />
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
                                            <p className={`text-sm font-bold ${inputType === 'SINGLE_SELECT' ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>Single Select</p>
                                            <p className="text-[10px] font-medium text-gray-400 mt-1">Customer picks exactly one option.</p>
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
                                            <p className={`text-sm font-bold ${inputType === 'MULTI_SELECT' ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>Multi Select</p>
                                            <p className="text-[10px] font-medium text-gray-400 mt-1">Customer can pick multiple options.</p>
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
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Required</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Customer must select an option</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isRequired} onChange={() => setIsRequired(!isRequired)} className="sr-only peer" />
                                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full peer peer-checked:bg-paymint-green transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                                </label>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-xl p-4 flex gap-3">
                                <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Note</p>
                                    <p className="text-xs text-blue-900/70 dark:text-blue-200/70 font-medium leading-relaxed">
                                        After creating the modifier group, you can add specific options (like 'Small', 'Medium', 'Large') from the main Attributes page.
                                    </p>
                                </div>
                            </div>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-gray-100 dark:border-white/5 flex items-center gap-4 bg-gray-50 dark:bg-black/20 transition-colors">
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
                            className="flex-1 h-14 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="attribute-form"
                            disabled={isSubmitting}
                            className="flex-[2] h-14 rounded-xl bg-paymint-green text-black font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
                        >
                            {isSubmitting ? (
                                <RefreshCw size={18} className="animate-spin" />
                            ) : (
                                initialData ? 'Save Changes' : 'Add Modifier'
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
