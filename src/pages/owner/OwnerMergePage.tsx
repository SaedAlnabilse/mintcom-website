import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, GitMerge, Store, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';

export function OwnerMergePage() {
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
            toast.error('Please select at least 2 establishments to merge');
            return;
        }
        setStep('configure');
    };

    const handleMerge = async () => {
        if (!brandName.trim()) {
            toast.error('Please enter a brand name');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/api/brands', {
                name: brandName,
                establishmentIds: selectedEstablishments,
            });
            toast.success('Brand created successfully!');
            await refreshEstablishments();
            navigate('/owner/establishments');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create brand');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedEstInfo = establishments.filter((e) => selectedEstablishments.includes(e.id));
    const firstSelectedEst = selectedEstInfo[0];

    return (
        <div className="max-w-3xl">
            {/* Header */}
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-gray-50 to-white dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-gray-200 dark:border-white/5 shadow-sm mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
                            <GitMerge size={28} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Merge Establishments</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Combine multiple establishments into a single brand</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => step === 'configure' ? setStep('select') : navigate('/owner/establishments')}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 dark:bg-white/10 backdrop-blur-sm text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/20 transition-all border border-gray-200 dark:border-white/10"
                        >
                            <ArrowLeft size={18} />
                            <span>Back</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-4 mb-8">
                <div className={`flex items-center gap-2 ${step === 'select' ? 'text-indigo-600 dark:text-paymint-green' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'select' ? 'bg-indigo-600 dark:bg-paymint-green text-white dark:text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                        }`}>
                        1
                    </div>
                    <span className="font-medium">Select Establishments</span>
                </div>
                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                <div className={`flex items-center gap-2 ${step === 'configure' ? 'text-indigo-600 dark:text-paymint-green' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'configure' ? 'bg-indigo-600 dark:bg-paymint-green text-white dark:text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                        }`}>
                        2
                    </div>
                    <span className="font-medium">Configure Brand</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 'select' ? (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {/* Info Card */}
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-5 mb-6">
                            <div className="flex items-start gap-3">
                                <GitMerge size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">What is Brand Merging?</h3>
                                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                                        Merging creates a Brand that groups multiple establishments together. This allows unified reporting, shared employees, and centralized management while keeping each establishment's data separate.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Establishments List */}
                        <div className="space-y-3 mb-6">
                            {establishments.map((est) => {
                                const isSelected = selectedEstablishments.includes(est.id);
                                return (
                                    <motion.div
                                        key={est.id}
                                        onClick={() => toggleEstablishment(est.id)}
                                        className={`bg-white dark:bg-[#0A0A0A] rounded-2xl border-2 p-4 cursor-pointer transition-all ${isSelected
                                            ? 'border-indigo-500 dark:border-paymint-green bg-indigo-50/50 dark:bg-paymint-green/5'
                                            : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-100 dark:bg-paymint-green/20' : 'bg-gray-100 dark:bg-white/5'
                                                    }`}>
                                                    <Store size={20} className={isSelected ? 'text-indigo-600 dark:text-paymint-green' : 'text-gray-400'} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white">{est.name}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{est.type}</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                ? 'bg-indigo-600 dark:bg-paymint-green border-indigo-600 dark:border-paymint-green'
                                                : 'border-gray-300 dark:border-white/20'
                                                }`}>
                                                {isSelected && <Check size={14} className="text-white dark:text-black" />}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {establishments.length < 2 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <p>You need at least 2 establishments to create a brand.</p>
                            </div>
                        )}

                        <button
                            onClick={handleContinue}
                            disabled={selectedEstablishments.length < 2}
                            className="w-full py-3.5 bg-indigo-600 dark:bg-paymint-green text-white dark:text-black rounded-xl font-bold hover:bg-indigo-700 dark:hover:bg-paymint-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue ({selectedEstablishments.length} selected)
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="configure"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        {/* Selected Establishments */}
                        <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/5 p-5 mb-6">
                            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                                Merging {selectedEstInfo.length} Establishments
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedEstInfo.map((est) => (
                                    <div
                                        key={est.id}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-white/5 rounded-xl"
                                    >
                                        <Store size={16} className="text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{est.name}</span>
                                        <button
                                            onClick={() => toggleEstablishment(est.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Brand Name */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Brand Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                placeholder="e.g., My Restaurant Group"
                                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-paymint-green/50"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                This will be the name of your new brand that groups these establishments.
                            </p>
                        </div>

                        {/* POS Credentials Info */}
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-5 mb-6">
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">POS Login Credentials</h4>
                            <p className="text-indigo-800 dark:text-indigo-200 text-sm mb-3">
                                The brand will use the same login credentials as the first selected establishment:
                            </p>
                            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3">
                                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                                    <span className="text-indigo-600 dark:text-indigo-400">Owner POS ID:</span>{' '}
                                    {firstSelectedEst?.ownerPosId || 'Using existing credentials'}
                                </p>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-5 mb-6">
                            <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2">After Merging:</h4>
                            <ul className="text-amber-800 dark:text-amber-200 text-sm space-y-1">
                                <li>• A new Brand will be created with these establishments</li>
                                <li>• Use your existing POS credentials to access all establishments</li>
                                <li>• Employees can be shared across all establishments in the brand</li>
                                <li>• Unified reporting will be available for the entire brand</li>
                                <li>• No billing changes - each establishment still costs $20/month</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('select')}
                                className="flex-1 py-3.5 border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleMerge}
                                disabled={isSubmitting || !brandName.trim()}
                                className="flex-1 py-3.5 bg-indigo-600 dark:bg-paymint-green text-white dark:text-black rounded-xl font-bold hover:bg-indigo-700 dark:hover:bg-paymint-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                                <GitMerge size={18} />
                                Create Brand
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
