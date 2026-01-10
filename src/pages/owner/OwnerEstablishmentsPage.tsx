import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Store, GitMerge } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function OwnerEstablishmentsPage() {
    const navigate = useNavigate();
    const { establishments, setCurrentEstablishment } = useAuth();

    const handleEstablishmentClick = (establishment: typeof establishments[0]) => {
        // Set as current establishment and open dashboard in NEW TAB
        setCurrentEstablishment(establishment);
        // Store the selected establishment in localStorage for the new tab
        localStorage.setItem('selectedEstablishmentId', establishment.id);
        window.open('/dashboard', '_blank');
    };

    const handleAddEstablishment = () => {
        navigate('/onboarding');
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'TRIAL':
                return <span className="text-xs font-bold text-emerald-600 dark:text-paymint-green uppercase">TRIAL</span>;
            case 'ACTIVE':
                return <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">ACTIVE</span>;
            case 'EXPIRED':
                return <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">EXPIRED</span>;
            default:
                return <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{status}</span>;
        }
    };

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-gray-50 to-white dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-gray-200 dark:border-white/5 shadow-sm mb-8 transition-all">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
                            <Store size={28} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Establishments</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Manage your business locations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/owner/merge')}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-100 dark:bg-white/10 backdrop-blur-sm text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/20 transition-all border border-gray-200 dark:border-white/10"
                        >
                            <GitMerge size={18} />
                            <span>Merge</span>
                        </button>
                        <button
                            onClick={handleAddEstablishment}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-paymint-green/30"
                        >
                            <Plus size={18} />
                            <span>Add Establishment</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Establishments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {establishments.map((est, index) => (
                    <motion.div
                        key={est.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleEstablishmentClick(est)}
                        className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-paymint-green/30 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0 pr-3">
                                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-paymint-green transition-colors truncate" title={est.name}>
                                    {est.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{est.type}</p>
                            </div>
                            <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                                <Store size={20} className="text-gray-400" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-white/5">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{est.currency || 'USA'}</span>
                            {getStatusBadge(est.subscriptionStatus)}
                        </div>
                    </motion.div>
                ))}
            </div>

            {establishments.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Establishments Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first establishment to get started.</p>
                    <button
                        onClick={handleAddEstablishment}
                        className="px-6 py-3 bg-indigo-600 dark:bg-paymint-green text-white dark:text-black rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-paymint-green/90 transition-colors"
                    >
                        Add Establishment
                    </button>
                </div>
            )}
        </div>
    );
}
