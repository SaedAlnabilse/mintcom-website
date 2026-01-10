import { useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import {
    LayoutDashboard,
    Store,
    Users,
    LogOut,
    Building2,
    PanelLeftClose,
    PanelLeft,
    ArrowLeft,
} from 'lucide-react';
import { useEffect } from 'react';
import api from '../config/api';

interface Brand {
    id: string;
    name: string;
    ownerPosId: string;
    establishments: {
        id: string;
        name: string;
    }[];
}

const getMenuItems = (brandId: string) => [
    { path: `/brand/${brandId}`, label: 'Overview', icon: LayoutDashboard },
    { path: `/brand/${brandId}/locations`, label: 'Locations', icon: Store },
    { path: `/brand/${brandId}/team`, label: 'Team', icon: Users },
];

export function BrandLayout() {
    const { brandId } = useParams<{ brandId: string }>();
    const { account, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [brand, setBrand] = useState<Brand | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navRef = useRef<HTMLDivElement>(null);

    const menuItems = brandId ? getMenuItems(brandId) : [];

    useEffect(() => {
        if (brandId) {
            fetchBrand();
        }
    }, [brandId]);

    const fetchBrand = async () => {
        try {
            const response = await api.get(`/api/brands/${brandId}`);
            setBrand(response.data);
        } catch (error) {
            console.error('Failed to fetch brand:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const goBackToOwner = () => {
        window.close();
        // Fallback if window.close doesn't work (e.g., not opened by script)
        navigate('/owner/brands');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-paymint-green border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans flex overflow-hidden transition-colors duration-500">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: sidebarOpen ? 280 : 100,
                    transition: { duration: 0.4, type: "spring", damping: 25, stiffness: 200 }
                }}
                className="relative z-[60] flex flex-col h-screen p-4 bg-black border-r border-white/10"
            >
                {/* Brand Header */}
                <div className="h-20 flex items-center justify-between px-2 mb-6 relative shrink-0">
                    <AnimatePresence mode="wait">
                        {sidebarOpen ? (
                            <motion.div
                                key="logo-full"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-12 h-12 bg-paymint-green rounded-2xl flex items-center justify-center shadow-lg shadow-paymint-green/20">
                                    <Building2 size={24} className="text-black" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-white tracking-tight leading-none truncate max-w-[150px]">
                                        {brand?.name || 'Brand'}
                                    </span>
                                    <span className="text-[10px] font-bold text-paymint-green uppercase tracking-[0.15em] mt-1">
                                        Brand Dashboard
                                    </span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="logo-icon"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="mx-auto"
                            >
                                <div className="w-12 h-12 bg-paymint-green rounded-2xl flex items-center justify-center shadow-lg shadow-paymint-green/20">
                                    <Building2 size={24} className="text-black" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <PanelLeftClose size={20} />
                        </button>
                    )}
                </div>

                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-12 h-12 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-white/10 text-gray-500 hover:text-white transition-all border border-white/10"
                    >
                        <PanelLeft size={20} />
                    </button>
                )}

                {/* Back to Owner Portal */}
                {sidebarOpen && (
                    <div className="px-2 mb-6">
                        <button
                            onClick={goBackToOwner}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                        >
                            <ArrowLeft size={18} className="text-gray-500 group-hover:text-white transition-colors" />
                            <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                                Back to Owner Portal
                            </span>
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <nav ref={navRef} className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-none">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === `/brand/${brandId}`}
                                className={`relative w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${isActive
                                    ? 'bg-paymint-green/5 text-gray-900 dark:text-white'
                                    : 'text-gray-400 hover:text-paymint-green'
                                    } ${!sidebarOpen ? 'justify-center mb-2' : ''}`}
                            >
                                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive
                                    ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                                    : 'bg-white/5 border border-transparent group-hover:border-paymint-green/30 group-hover:scale-110 group-hover:bg-white/10 text-gray-400 group-hover:text-paymint-green'
                                    }`}>
                                    <Icon size={18} />
                                </div>

                                {sidebarOpen && (
                                    <span className={`flex-1 text-left text-xs uppercase tracking-[0.1em] ${isActive ? 'font-black text-gray-900 dark:text-white' : 'font-bold text-gray-400'}`}>
                                        {item.label}
                                    </span>
                                )}

                                {!sidebarOpen && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[70] whitespace-nowrap">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-2 mt-auto">
                    <div className="bg-white/5 border border-white/5 rounded-[2rem] p-3 space-y-4 shadow-inner">
                        <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center flex-col relative group' : ''}`}>
                            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center border border-white/[0.1] shadow-xl shrink-0 group hover:scale-105 transition-transform cursor-pointer overflow-hidden relative">
                                <span className="text-white font-black text-lg">{account?.firstName?.charAt(0).toUpperCase()}</span>
                                <div className="absolute inset-0 bg-paymint-green opacity-0 group-hover:opacity-20 transition-opacity" />
                            </div>

                            {sidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate uppercase tracking-tight">
                                        {account?.firstName} {account?.lastName}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-paymint-green animate-pulse" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Brand Owner</span>
                                    </div>
                                </div>
                            )}

                            {!sidebarOpen && (
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[70] whitespace-nowrap">
                                    {account?.firstName} {account?.lastName}
                                </div>
                            )}
                        </div>

                        {sidebarOpen && (
                            <div className="flex items-center justify-between gap-2 px-1">
                                <ThemeToggle dropdownDirection="up" />
                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        )}

                        {!sidebarOpen && (
                            <div className="flex flex-col items-center gap-3">
                                <ThemeToggle dropdownDirection="up" />
                                <button
                                    onClick={handleLogout}
                                    className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden bg-white dark:bg-[#050505] transition-colors duration-500">
                <div className="h-full overflow-y-auto custom-scrollbar relative z-10 p-4 lg:p-8">
                    <Outlet context={{ brand }} />
                </div>
            </main>
        </div>
    );
}
