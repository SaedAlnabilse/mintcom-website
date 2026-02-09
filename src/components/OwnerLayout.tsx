import { AppStrings } from '../constants/AppStrings';
import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { ConfirmModal } from './ConfirmModal';
import { DeletionRestorationBanner } from './DeletionRestorationBanner';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Store,
    Users,
    CreditCard,
    Shield,
    LogOut,
    Smartphone,
    Building2,
    PanelLeftClose,
    PanelLeft,
    KeyRound,
    Menu,
    X,
    Settings
} from 'lucide-react';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.svg';
import PaymintLogoWhite from '../assets/white-green-full-logo.svg';
import PaymintLeafIcon from '../assets/small-logo.svg';

export function OwnerLayout() {
    const { t } = useTranslation();
    const { account, logout } = useAuth();
    
    const menuItems = useMemo(() => [
        { path: '/owner', label: t('owner.menu.overview'), icon: LayoutDashboard },
        { path: '/owner/establishments', label: t('owner.menu.locations'), icon: Store },
        { path: '/owner/brands', label: t('owner.menu.brands'), icon: Building2 },
        { path: '/owner/employees', label: t('owner.menu.employees'), icon: Users },
        { path: '/owner/roles', label: t('owner.menu.globalRoles'), icon: Shield },
        { path: '/owner/billing', label: t('owner.menu.billing'), icon: CreditCard },
        { path: '/owner/account', label: t('owner.menu.accountManagement'), icon: KeyRound },
    ], [t]);

    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const mainContentRef = useRef<HTMLDivElement>(null);

    // Scroll to top on route change
    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [location.pathname]);

    // Close mobile menu on route change
    useLayoutEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans flex overflow-hidden selection:bg-paymint-green selection:text-black transition-colors duration-500">
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

            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={{
                    width: sidebarOpen ? 300 : 100,
                    transition: { duration: 0.4, type: "spring", damping: 25, stiffness: 200 }
                }}
                className={`
                    relative z-50 flex-col h-screen py-4 bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/[0.05] transition-colors duration-500 group/sidebar
                    hidden lg:flex
                `}
            >
                {/* Sidebar Glow Decor */}
                <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-paymint-green/20 to-transparent opacity-50" />

                {/* Brand Header & Toggle */}
                <div className="h-20 flex items-center justify-between px-6 mb-2 relative shrink-0">
                    <AnimatePresence mode="wait">
                        {sidebarOpen ? (
                            <motion.div
                                key="logo-full"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center cursor-pointer group"
                                onClick={() => navigate('/owner')}
                            >
                                <img
                                    src={PaymintLogoGreen}
                                    alt="PayMint"
                                    width={160}
                                    height={40}
                                    loading="eager"
                                    decoding="async"
                                    className="h-10 w-auto object-contain dark:hidden transition-transform"
                                />
                                <img
                                    src={PaymintLogoWhite}
                                    alt="PayMint"
                                    width={160}
                                    height={40}
                                    loading="eager"
                                    decoding="async"
                                    className="h-10 w-auto object-contain hidden dark:block transition-transform"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="logo-icon"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="mx-auto"
                            >
                                <button
                                    className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 hover:border-paymint-green/40 text-paymint-green transition-all group relative"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <img src={PaymintLeafIcon} width={24} height={24} loading="eager" decoding="async" className="w-6 h-6 object-contain transition-all duration-300 opacity-100 rotate-0 group-hover/sidebar:opacity-0 group-hover/sidebar:rotate-90 absolute" alt="P" />
                                    <PanelLeft
                                        size={24}
                                        className="transition-all duration-300 opacity-0 -rotate-90 group-hover/sidebar:opacity-100 group-hover/sidebar:rotate-0 absolute text-gray-500 dark:text-gray-400 group-hover/sidebar:text-gray-900 dark:group-hover/sidebar:text-white"
                                    />
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                        {t('owner.menu.openSidebar')}
                                    </div>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-xl text-gray-400 hover:text-paymint-green hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                        >
                            <PanelLeftClose size={20} />
                        </button>
                    )}
                </div>

                {/* User Profile Summary - Only when open */}


                {/* Navigation Section */}
                <div className={`flex-1 ${sidebarOpen ? 'overflow-y-auto' : 'overflow-visible'} px-3 space-y-1.5 scrollbar-none scroll-smooth pb-4 relative z-10`}>
                    {sidebarOpen && <p className="px-3 py-2 text-xs font-black text-gray-400 tracking-widest mb-4 mt-2">{t('owner.menu.mainMenu')}</p>}
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/owner'}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `relative flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-paymint-green text-black font-bold shadow-lg shadow-paymint-green/20 active-menu-item'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                                    ${!sidebarOpen ? 'justify-center w-12 h-12 mx-auto' : ''}`
                                }
                            >
                                <Icon size={!sidebarOpen ? 24 : 20} />

                                {sidebarOpen && (
                                    <span className="text-sm font-bold">{item.label}</span>
                                )}

                                {!sidebarOpen && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                {sidebarOpen && (
                    <div className="px-4 mt-auto mb-2">
                        <div className="relative group">
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <Smartphone size={16} className="text-gray-400" />
                                <span className="text-sm font-bold">{t('owner.menu.getMobileApp')}</span>
                            </button>
                            {/* QR Code Popup */}
                            <div className="absolute left-full bottom-0 ml-3 bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-[70] translate-x-2 group-hover:translate-x-0 w-[200px]">
                                {/* QR Code Container */}
                                <div className="bg-white rounded-xl p-3 mb-4 shadow-inner">
                                    {/* Fake QR Code Pattern */}
                                    <div className="w-full aspect-square bg-white relative overflow-hidden rounded-lg">
                                        <svg viewBox="0 0 100 100" className="w-full h-full">
                                            <rect width="100" height="100" fill="white" />
                                            <rect x="5" y="5" width="25" height="25" fill="black" />
                                            <rect x="8" y="8" width="19" height="19" fill="white" />
                                            <rect x="11" y="11" width="13" height="13" fill="black" />
                                            <rect x="70" y="5" width="25" height="25" fill="black" />
                                            <rect x="73" y="8" width="19" height="19" fill="white" />
                                            <rect x="76" y="11" width="13" height="13" fill="black" />
                                            <rect x="5" y="70" width="25" height="25" fill="black" />
                                            <rect x="8" y="73" width="19" height="19" fill="white" />
                                            <rect x="11" y="76" width="13" height="13" fill="black" />
                                            <rect x="35" y="5" width="5" height="5" fill="black" />
                                            <rect x="45" y="5" width="5" height="5" fill="black" />
                                            <rect x="55" y="5" width="5" height="5" fill="black" />
                                            <rect x="35" y="15" width="5" height="5" fill="black" />
                                            <rect x="50" y="15" width="5" height="5" fill="black" />
                                            <rect x="60" y="15" width="5" height="5" fill="black" />
                                            <rect x="40" y="25" width="5" height="5" fill="black" />
                                            <rect x="55" y="25" width="5" height="5" fill="black" />
                                            <rect x="5" y="35" width="5" height="5" fill="black" />
                                            <rect x="15" y="35" width="5" height="5" fill="black" />
                                            <rect x="25" y="35" width="5" height="5" fill="black" />
                                            <rect x="5" y="45" width="5" height="5" fill="black" />
                                            <rect x="20" y="45" width="5" height="5" fill="black" />
                                            <rect x="5" y="55" width="5" height="5" fill="black" />
                                            <rect x="15" y="55" width="5" height="5" fill="black" />
                                            <rect x="25" y="55" width="5" height="5" fill="black" />
                                            <rect x="35" y="35" width="30" height="30" fill="black" />
                                            <rect x="40" y="40" width="20" height="20" fill="white" />
                                            <rect x="45" y="45" width="10" height="10" fill="black" />
                                            <rect x="70" y="35" width="5" height="5" fill="black" />
                                            <rect x="80" y="35" width="5" height="5" fill="black" />
                                            <rect x="90" y="35" width="5" height="5" fill="black" />
                                            <rect x="75" y="45" width="5" height="5" fill="black" />
                                            <rect x="85" y="45" width="5" height="5" fill="black" />
                                            <rect x="70" y="55" width="5" height="5" fill="black" />
                                            <rect x="80" y="55" width="5" height="5" fill="black" />
                                            <rect x="35" y="70" width="5" height="5" fill="black" />
                                            <rect x="45" y="70" width="5" height="5" fill="black" />
                                            <rect x="55" y="70" width="5" height="5" fill="black" />
                                            <rect x="70" y="70" width="5" height="5" fill="black" />
                                            <rect x="80" y="70" width="5" height="5" fill="black" />
                                            <rect x="90" y="70" width="5" height="5" fill="black" />
                                            <rect x="40" y="80" width="5" height="5" fill="black" />
                                            <rect x="50" y="80" width="5" height="5" fill="black" />
                                            <rect x="75" y="80" width="5" height="5" fill="black" />
                                            <rect x="85" y="80" width="5" height="5" fill="black" />
                                            <rect x="35" y="90" width="5" height="5" fill="black" />
                                            <rect x="55" y="90" width="5" height="5" fill="black" />
                                            <rect x="70" y="90" width="5" height="5" fill="black" />
                                            <rect x="90" y="90" width="5" height="5" fill="black" />
                                        </svg>
                                        {/* Center logo placeholder */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                <img src={PaymintLeafIcon} alt="P" className="w-5 h-5 object-contain" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Text */}
                                <p className="text-center text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                    {t('owner.menu.scanToDownload')}<br />
                                    <span className="text-paymint-green">Paymint App</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer User Profile */}
                <div className="p-3 border-t border-gray-100 dark:border-white/5 relative">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-paymint-green/20 outline outline-2 outline-white dark:outline-black">
                                <span className="text-black font-bold text-xs">
                                    {account?.firstName?.charAt(0).toUpperCase()}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-gray-900 dark:text-white tracking-widest truncate">
                                    {account?.firstName} {account?.lastName}
                                </p>
                                <p className="text-xs font-black text-gray-400 tracking-widest truncate">{t('owner.menu.enterpriseOwner')}</p>
                            </div>

                            <div className="flex items-center gap-1">
                                <ThemeToggle dropdownDirection="up" className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white" />
                                <button
                                    onClick={handleLogout}
                                    className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
                                    title="Sign Out"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            {/* Mobile App Icon for Closed Sidebar */}
                            <div className="relative group">
                                <button
                                    className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
                                >
                                    <Smartphone size={24} />
                                </button>
                                {/* Tooltip/Popup for Closed Sidebar */}
                                <div className="absolute left-full bottom-0 ml-4 bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-[80] translate-x-2 group-hover:translate-x-0 w-[200px]">
                                    {/* QR Code Container */}
                                    <div className="bg-white rounded-xl p-3 mb-4 shadow-inner">
                                        <div className="w-full aspect-square bg-white relative overflow-hidden rounded-lg">
                                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                                <rect width="100" height="100" fill="white" />
                                                <rect x="5" y="5" width="25" height="25" fill="black" />
                                                <rect x="8" y="8" width="19" height="19" fill="white" />
                                                <rect x="11" y="11" width="13" height="13" fill="black" />
                                                <rect x="70" y="5" width="25" height="25" fill="black" />
                                                <rect x="73" y="8" width="19" height="19" fill="white" />
                                                <rect x="76" y="11" width="13" height="13" fill="black" />
                                                <rect x="5" y="70" width="25" height="25" fill="black" />
                                                <rect x="8" y="73" width="19" height="19" fill="white" />
                                                <rect x="11" y="76" width="13" height="13" fill="black" />
                                                <rect x="35" y="5" width="5" height="5" fill="black" />
                                                <rect x="45" y="5" width="5" height="5" fill="black" />
                                                <rect x="55" y="5" width="5" height="5" fill="black" />
                                                <rect x="35" y="15" width="5" height="5" fill="black" />
                                                <rect x="50" y="15" width="5" height="5" fill="black" />
                                                <rect x="60" y="15" width="5" height="5" fill="black" />
                                                <rect x="40" y="25" width="5" height="5" fill="black" />
                                                <rect x="55" y="25" width="5" height="5" fill="black" />
                                                <rect x="5" y="35" width="5" height="5" fill="black" />
                                                <rect x="15" y="35" width="5" height="5" fill="black" />
                                                <rect x="25" y="35" width="5" height="5" fill="black" />
                                                <rect x="5" y="45" width="5" height="5" fill="black" />
                                                <rect x="20" y="45" width="5" height="5" fill="black" />
                                                <rect x="5" y="55" width="5" height="5" fill="black" />
                                                <rect x="15" y="55" width="5" height="5" fill="black" />
                                                <rect x="25" y="55" width="5" height="5" fill="black" />
                                                <rect x="35" y="35" width="30" height="30" fill="black" />
                                                <rect x="40" y="40" width="20" height="20" fill="white" />
                                                <rect x="45" y="45" width="10" height="10" fill="black" />
                                                <rect x="70" y="35" width="5" height="5" fill="black" />
                                                <rect x="80" y="35" width="5" height="5" fill="black" />
                                                <rect x="90" y="35" width="5" height="5" fill="black" />
                                                <rect x="75" y="45" width="5" height="5" fill="black" />
                                                <rect x="85" y="45" width="5" height="5" fill="black" />
                                                <rect x="70" y="55" width="5" height="5" fill="black" />
                                                <rect x="80" y="55" width="5" height="5" fill="black" />
                                                <rect x="35" y="70" width="5" height="5" fill="black" />
                                                <rect x="45" y="70" width="5" height="5" fill="black" />
                                                <rect x="55" y="70" width="5" height="5" fill="black" />
                                                <rect x="70" y="70" width="5" height="5" fill="black" />
                                                <rect x="80" y="70" width="5" height="5" fill="black" />
                                                <rect x="90" y="70" width="5" height="5" fill="black" />
                                                <rect x="40" y="80" width="5" height="5" fill="black" />
                                                <rect x="50" y="80" width="5" height="5" fill="black" />
                                                <rect x="75" y="80" width="5" height="5" fill="black" />
                                                <rect x="85" y="80" width="5" height="5" fill="black" />
                                                <rect x="35" y="90" width="5" height="5" fill="black" />
                                                <rect x="55" y="90" width="5" height="5" fill="black" />
                                                <rect x="70" y="90" width="5" height="5" fill="black" />
                                                <rect x="90" y="90" width="5" height="5" fill="black" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                    <img src={PaymintLeafIcon} alt="P" className="w-5 h-5 object-contain" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-center text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                        Scan to download<br />
                                        <span className="text-paymint-green">Paymint App</span>
                                    </p>
                                </div>
                            </div>

                            {/* Settings Circle */}
                            <button
                                onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group ${settingsMenuOpen
                                    ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Settings size={24} />
                                {/* Tooltip */}
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                    {t('dashboard.menu.settings')}
                                </div>
                            </button>

                            {/* Popover Menu */}
                            <AnimatePresence>
                                {settingsMenuOpen && (
                                    <>
                                        {/* Backdrop to close */}
                                        <div
                                            className="fixed inset-0 z-[60]"
                                            onClick={() => setSettingsMenuOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, x: 20 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, x: 20 }}
                                            className="absolute left-full bottom-0 ml-4 w-64 bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[70] p-2"
                                        >
                                            {/* Header */}
                                            <div className="flex items-center gap-3 p-3 mb-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm text-black font-bold text-xs">
                                                    {account?.firstName?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                        {account?.firstName} {account?.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{account?.email}</p>
                                                </div>
                                            </div>

                                            {/* Menu Items */}
                                            <div className="space-y-1">
                                                <div className="relative">
                                                    <ThemeToggle
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                                                        showLabel={true}
                                                        dropdownDirection="right"
                                                        iconSize={18}
                                                    />
                                                </div>

                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all text-left"
                                                >
                                                    <LogOut size={18} />
                                                    <span>Sign Out</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.aside >

            {/* Main Content Area */}
            <main
                className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-paymint-dark transition-all duration-500 border-l border-gray-200 dark:border-white/[0.05] flex flex-col"
                onClick={() => sidebarOpen && setSidebarOpen(false)}
            >
                {/* Mobile Header */}
                <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-white/5 px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                    >
                        <Menu size={22} />
                    </button>
                    <img
                        src={PaymintLogoGreen}
                        alt="PayMint"
                        className="h-8 w-auto object-contain dark:hidden"
                    />
                    <img
                        src={PaymintLogoWhite}
                        alt="PayMint"
                        className="h-8 w-auto object-contain hidden dark:block"
                    />
                    <ThemeToggle dropdownDirection="down" />
                </div>

                <DeletionRestorationBanner />
                <div ref={mainContentRef} className="flex-1 overflow-y-auto custom-scrollbar relative p-4 lg:px-10 lg:pt-10 lg:pb-6 pb-20 lg:pb-6">
                    <Outlet />
                </div>
            </main >

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
                                <span className="text-lg font-bold text-gray-900 dark:text-white">Paymint</span>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <X size={20} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path ||
                                    (item.path !== '/owner' && location.pathname.startsWith(item.path));

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
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
                                    <p className="text-xs text-gray-500">Enterprise Owner</p>
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
                message="Are you sure you want to sign out of your account?"
                confirmText="Sign Out"
                cancelText={AppStrings.COMMON.CANCEL}
                type="danger"
            />
        </div >
    );
}