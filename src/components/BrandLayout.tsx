import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { DeletionRestorationBanner } from './DeletionRestorationBanner';
import {
    LayoutDashboard,
    Store,
    Users,
    LogOut,
    PanelLeftClose,
    PanelLeft,
    ArrowLeft,
    Building2,
    ChevronRight,
    Menu,
    X,
    Smartphone,
    Play,
    Apple
} from 'lucide-react';

import api from '../config/api';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.png';
import PaymintLogoWhite from '../assets/white-green-full-logo.png';
import PaymintLeafIcon from '../assets/small-logo.png';
import { ConfirmModal } from './ConfirmModal';

interface Brand {
    id: string;
    name: string;
    establishmentLoginId: string;
    establishments: {
        id: string;
        name: string;
    }[];
}

const SIDEBAR_STATE_KEY = 'brand_sidebar_expanded';

const getMenuItems = (brandId: string) => [
    { path: `/brand/${brandId}`, label: 'Overview', icon: LayoutDashboard, description: 'Dashboard & Analytics' },
    { path: `/brand/${brandId}/locations`, label: 'Locations', icon: Store, description: 'Manage Locations' },
    { path: `/brand/${brandId}/team`, label: 'Team', icon: Users, description: 'Staff Management' },
];

export function BrandLayout() {
    const { brandId } = useParams<{ brandId: string }>();
    const { account, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
        return saved !== null ? saved === 'true' : true;
    });

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [brand, setBrand] = useState<Brand | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const menuItems = brandId ? getMenuItems(brandId) : [];

    useEffect(() => {
        localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarOpen));
    }, [sidebarOpen]);

    useEffect(() => {
        if (brandId) {
            fetchBrand();
        }
    }, [brandId]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

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

      const handleLogout = () => setIsLogoutModalOpen(true);
      const confirmLogout = () => { logout(); };
    const goBackToOwner = () => {
        navigate('/owner/brands');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-14 h-14 border-4 border-paymint-green/20 rounded-full" />
                        <div className="w-14 h-14 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 tracking-widest">Loading brand...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans flex overflow-hidden transition-colors duration-500">
            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: sidebarOpen ? 280 : 80,
                    transition: { duration: 0.3, type: "spring", damping: 25, stiffness: 200 }
                }}
                className={`
                    relative z-50 flex flex-col h-screen bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/5 shadow-lg
                    ${mobileMenuOpen ? 'fixed left-0 top-0 w-[280px]' : 'hidden lg:flex'}
                `}
            >
                {/* Logo Section */}
                <div className={`h-20 flex items-center justify-between mb-2 relative shrink-0 ${sidebarOpen ? 'px-6' : 'px-2'}`}>
                    <AnimatePresence mode="wait">
                        {sidebarOpen ? (
                            <motion.div
                                key="logo-full"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center gap-4 px-4"
                            >
                                <img src={PaymintLogoGreen} className="h-10 w-auto dark:hidden" alt="PayMint" />
                                <img src={PaymintLogoWhite} className="h-10 w-auto hidden dark:block" alt="PayMint" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="logo-icon"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="mx-auto"
                            >
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 hover:border-paymint-green/40 transition-all hover:scale-105 group relative"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <img src={PaymintLeafIcon} className="w-7 h-7 object-contain scale-110" alt="P" />
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                        Expand Sidebar
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    )}
                </div>

                {/* Back Link */}
                <div className="px-4 py-4">
                    {sidebarOpen ? (
                        <button
                            onClick={goBackToOwner}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 hover:text-paymint-green hover:bg-paymint-green/5 transition-all group border border-transparent hover:border-paymint-green/20"
                        >
                            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                            <span className="text-xs font-bold tracking-wide">Back to Brands</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="w-12 h-12 mx-auto flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[0.03] text-gray-600 dark:text-gray-400 hover:text-paymint-green transition-all border border-gray-200 dark:border-white/[0.05] hover:border-paymint-green/30 group relative"
                        >
                            <PanelLeft size={20} />
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                Expand Sidebar
                            </div>
                        </button>
                    )}
                </div>

                {/* Brand Entity Card */}
                {sidebarOpen && (
                    <div className="px-4 mb-6">
                        <div className="p-5 bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 hover:border-paymint-green/30">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 dark:bg-paymint-green/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-bold text-paymint-green tracking-widest mb-1">
                                            {brandId === 'cmkek5eme0001vjjqvfm3wjwa' ? 'Top Performance' : 'Active Brand'}
                                        </p>
                                        <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-tight truncate">
                                            {brand?.name || 'Loading...'}
                                        </h2>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Online</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Store size={12} className="text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                            {brand?.establishments?.length || 0} locations
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto scrollbar-none">
                    {sidebarOpen && (
                        <p className="px-3 py-2 text-[10px] font-bold text-gray-400 tracking-widest">Navigation</p>
                    )}
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path ||
                            (item.path !== `/brand/${brandId}` && location.pathname.startsWith(item.path));

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`
                                    relative flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-paymint-green text-black font-bold shadow-lg shadow-paymint-green/20'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                                    ${!sidebarOpen ? 'justify-center' : ''}
                                `}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                                {sidebarOpen ? (
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-bold block">{item.label}</span>
                                        {!isActive && (
                                            <span className="text-[10px] text-gray-400 truncate block">{item.description}</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-xl">
                                        <p className="text-xs font-bold">{item.label}</p>
                                        <p className="text-[10px] text-gray-400">{item.description}</p>
                                    </div>
                                )}

                                {isActive && sidebarOpen && (
                                    <ChevronRight size={16} className="text-black/50" />
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Owner Portal App Download - Compact */}
                <div className="px-3 mt-auto mb-2">
                    {sidebarOpen ? (
                        <div className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl p-2.5 flex items-center justify-between group">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                                    <Smartphone size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-0.5">Owner App</span>
                                    <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-none">Download</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-900 dark:bg-white/10 text-white hover:bg-gray-800 dark:hover:bg-white/20 transition-all border border-gray-800 dark:border-white/5" title="Get it on Google Play">
                                    <Play size={10} fill="currentColor" />
                                </button>
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-900 dark:bg-white/10 text-white hover:bg-gray-800 dark:hover:bg-white/20 transition-all border border-gray-800 dark:border-white/5" title="Download on the App Store">
                                    <Apple size={12} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative group flex justify-center">
                            <button
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 border border-indigo-200 dark:border-indigo-500/20 shadow-sm hover:scale-105 transition-all"
                            >
                                <Smartphone size={18} />
                            </button>
                            {/* Compact Popover */}
                            <div className="absolute left-full bottom-0 ml-3 bg-gray-900/95 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-[70] translate-x-1 group-hover:translate-x-0 w-max">
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-bold text-xs whitespace-nowrap">Owner App</span>
                                    <div className="h-4 w-px bg-white/20" />
                                    <div className="flex gap-2">
                                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-black hover:opacity-90">
                                            <Play size={10} fill="currentColor" />
                                        </button>
                                        <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20">
                                            <Apple size={12} fill="currentColor" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer User Profile */}
                <div className="p-3 border-t border-gray-100 dark:border-white/5">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-paymint-green/20 outline outline-2 outline-white dark:outline-black">
                                <span className="text-black font-bold text-xs">
                                    {account?.firstName?.charAt(0).toUpperCase()}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {account?.firstName} {account?.lastName}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate">Brand Administrator</p>
                            </div>

                            <div className="flex items-center gap-1">
                                <ThemeToggle dropdownDirection="up" />
                                <button
                                    onClick={handleLogout}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
                                    title="Sign Out"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-paymint-green/20 outline outline-2 outline-white dark:outline-black mb-1">
                                <span className="text-black font-bold text-xs">
                                    {account?.firstName?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="relative group">
                                <ThemeToggle dropdownDirection="up" />
                            </div>
                            <div className="relative group">
                                <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <DeletionRestorationBanner />
                {/* Top Bar (Mobile) */}
                <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-white/5">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <Menu size={24} className="text-gray-600 dark:text-gray-400" />
                    </button>

                    <div className="flex items-center gap-2">
                        <img src={PaymintLeafIcon} className="w-8 h-8 object-contain" alt="P" />
                        <span className="font-bold text-gray-900 dark:text-white">{brand?.name}</span>
                    </div>

                    <ThemeToggle />
                </div>

                {/* Content Landscape */}
                <main className="flex-1 relative bg-gray-50 dark:bg-[#050505] overflow-hidden">
                    <div className="h-full overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                        <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
                            <Outlet context={{ brand }} />
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/5 shadow-2xl z-50 flex flex-col lg:hidden"
                    >
                        {/* Close Button */}
                        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <img src={PaymintLeafIcon} className="w-8 h-8 object-contain" alt="P" />
                                <span className="font-bold text-gray-900 dark:text-white">Paymint</span>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <X size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Brand Card */}
                        <div className="p-4">
                            <div className="p-4 bg-gradient-to-br from-gray-900 to-black rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-paymint-green/20 flex items-center justify-center">
                                        <Building2 size={20} className="text-paymint-green" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-paymint-green">Active Brand</p>
                                        <h2 className="text-sm font-bold text-white truncate">{brand?.name}</h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                            <button
                                onClick={goBackToOwner}
                                className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-500 hover:text-paymint-green hover:bg-paymint-green/5 transition-all group mb-4"
                            >
                                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="text-sm font-bold">Back to Brands</span>
                            </button>

                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path ||
                                    (item.path !== `/brand/${brandId}` && location.pathname.startsWith(item.path));

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={`
                                            flex items-center gap-3 p-3.5 rounded-xl transition-all
                                            ${isActive
                                                ? 'bg-paymint-green text-black font-bold shadow-lg shadow-paymint-green/20'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}
                                        `}
                                    >
                                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        <span className="text-sm font-bold">{item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center">
                                    <span className="text-black font-bold">{account?.firstName?.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{account?.firstName}</p>
                                    <p className="text-xs text-gray-500">Administrator</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                title="Sign Out"
                message="Are you sure you want to sign out of the brand dashboard?"
                confirmText="Sign Out"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
