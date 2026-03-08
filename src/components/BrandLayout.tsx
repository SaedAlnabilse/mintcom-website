import { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { DeletionRestorationBanner } from './DeletionRestorationBanner';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Store,
    Users,
    LogOut,
    PanelLeftClose,
    PanelLeft,
    ArrowLeft,
    Building2,
    Menu,
    X,
    ChevronRight,
    Smartphone,
    Settings,
    Apple,
    Play
} from 'lucide-react';

import api from '../config/api';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.svg';
import PaymintLogoWhite from '../assets/white-green-full-logo.svg';
import PaymintLeafIcon from '../assets/small-logo.svg';
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

// Remove getMenuItems function as it is now inside the component with useMemo


export function BrandLayout() {
    const { t } = useTranslation();
    const { brandId } = useParams<{ brandId: string }>();
    const { account, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [brand, setBrand] = useState<Brand | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const mainContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.classList.add('dashboard-font-unified');
        return () => {
            document.body.classList.remove('dashboard-font-unified');
        };
    }, []);

    const menuItems = useMemo(() => brandId ? [
        { path: `/brand/${brandId}`, label: t('brand.menu.overview'), icon: LayoutDashboard, description: t('brand.menu.overviewDesc') },
        { path: `/brand/${brandId}/locations`, label: t('brand.menu.locations'), icon: Store, description: t('brand.menu.locationsDesc') },
        { path: `/brand/${brandId}/team`, label: t('brand.menu.team'), icon: Users, description: t('brand.menu.teamDesc') },
    ] : [], [brandId, t]);

    // Scroll to top on route change
    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [location.pathname]);

    useEffect(() => {
        localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarOpen));
    }, [sidebarOpen]);

    useEffect(() => {
        const fetchBrand = async () => {
            try {
                const response = await api.get(`/api/brands/${brandId}`);
                setBrand(response.data);
            } catch (error) {
                // Fallback: Try to resolve slug from brands list if specific fetch failed using slug
                try {
                    const listResponse = await api.get('/api/brands');
                    const found = listResponse.data.find((b: Brand) => b.establishmentLoginId === brandId || b.id === brandId);
                    if (found) {
                        setBrand(found);
                        return;
                    }
                } catch (fallbackError) {
                    console.error('Fallback resolution failed', fallbackError);
                }
                console.error('Failed to fetch brand:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (brandId) {
            fetchBrand();
        }
    }, [brandId]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

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
                    <p className="text-sm font-bold text-gray-400 tracking-widest">{t('brand.dashboard.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
            className="h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans flex overflow-hidden transition-colors duration-500"
        >
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
                    width: sidebarOpen ? 300 : 100,
                    transition: { duration: 0.3, type: "spring", damping: 25, stiffness: 200 }
                }}
                className={`
                    relative z-50 flex flex-col h-screen py-4 bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/5 shadow-lg group/sidebar
                    ${mobileMenuOpen ? 'fixed left-0 top-0 w-[280px]' : 'hidden lg:flex'}
                `}
            >
                {/* Logo Section */}
                {/* Logo Section */}
                <div className="h-20 flex items-center justify-between px-6 mb-2 relative shrink-0">
                    <AnimatePresence mode="wait">
                        {sidebarOpen ? (
                            <motion.div
                                key="logo-full"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center cursor-pointer group"
                                onClick={() => navigate(`/brand/${brandId}`)}
                            >
                                <img
                                    src={PaymintLogoGreen}
                                    alt={t('brand.name')}
                                    width={160}
                                    height={40}
                                    loading="eager"
                                    decoding="async"
                                    className="h-10 w-auto object-contain dark:hidden transition-transform"
                                />
                                <img
                                    src={PaymintLogoWhite}
                                    alt={t('brand.name')}
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
                                    <img src={PaymintLeafIcon} width={24} height={24} loading="eager" decoding="async" className="w-6 h-6 object-contain transition-all duration-300 opacity-100 rotate-0 group-hover/sidebar:opacity-0 group-hover/sidebar:rotate-90 absolute" alt={t('brand.name').charAt(0)} />
                                    <PanelLeft
                                        size={24}
                                        className="transition-all duration-300 opacity-0 -rotate-90 group-hover/sidebar:opacity-100 group-hover/sidebar:rotate-0 absolute text-gray-500 dark:text-gray-400 group-hover/sidebar:text-gray-900 dark:group-hover/sidebar:text-white"
                                    />
                                    <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-4 rtl:ml-0 rtl:mr-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
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

                {/* Combined Back & Brand Card */}
                <div className={`px-2 ${sidebarOpen ? 'pb-2 pt-0' : 'flex justify-center mb-1.5'}`}>
                    {sidebarOpen ? (
                        <div
                            onClick={goBackToOwner}
                            className="p-3.5 bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 hover:border-paymint-green/30"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 dark:bg-paymint-green/10 rounded-full blur-3xl pointer-events-none transition-transform duration-1000" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center flex-shrink-0 text-paymint-green">
                                        <Building2 size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-paymint-green tracking-widest mb-0.5">
                                            {brand?.id === 'cmkek5eme0001vjjqvfm3wjwa' ? t('brand.dashboard.liveData') : t('brand.menu.activeBrand')}
                                        </p>
                                        <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-[1.2] font-sans truncate">
                                            {brand?.name || t('common.loading')}
                                        </h2>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100 dark:border-white/10">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] dark:shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        <span className="text-xs font-black text-gray-400 tracking-widest">{t('owner.overview.online')}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        {t('brand.menu.switchBrand')} <ChevronRight size={10} className={`mt-0.5 ${t('common.locale') === 'ar' ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={goBackToOwner}
                            className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all group relative"
                        >
                            <ArrowLeft size={24} />
                            <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-4 rtl:ml-0 rtl:mr-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                                {t('brand.menu.switchBrand')}
                            </div>
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className={`flex-1 px-3 space-y-1.5 scrollbar-none ${sidebarOpen ? 'overflow-y-auto' : 'overflow-visible'}`}>
                    {sidebarOpen && (
                        <p className="px-3 py-2 text-xs font-semibold text-gray-500 tracking-normal">{t('owner.menu.mainMenu')}</p>
                    )}
                    {menuItems.map((item) => {
                        const Icon = item.icon;


                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === `/brand/${brandId}`}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `relative flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-paymint-green text-black font-semibold shadow-lg shadow-paymint-green/20 active-menu-item'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                                    ${!sidebarOpen ? 'justify-center w-12 h-12 mx-auto' : ''}`
                                }
                            >
                                <Icon size={!sidebarOpen ? 24 : 20} />

                                {sidebarOpen && (
                                    <span className="text-sm font-semibold tracking-normal">{item.label}</span>
                                )}

                                {!sidebarOpen && (
                                    <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-4 rtl:ml-0 rtl:mr-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {sidebarOpen && (
                    <div className="px-3 mt-auto mb-2">
                        <div className="relative group">
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <Smartphone size={16} className="text-gray-400" />
                                <span className="text-sm font-bold">{t('owner.menu.getMobileApp')}</span>
                            </button>
                            {/* QR Code Popup */}
                            <div className="absolute left-full rtl:left-auto rtl:right-full bottom-0 ml-3 rtl:ml-0 rtl:mr-3 bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-[70] translate-x-2 rtl:-translate-x-2 group-hover:translate-x-0 w-[200px]">
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
                                                <img src={PaymintLeafIcon} alt={t('brand.name').charAt(0)} className="w-5 h-5 object-contain" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Text & Badges */}
                                <div className="text-center mt-2">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-3">
                                        {t('owner.menu.scanToDownload')}<br />
                                        <span className="text-paymint-green">{t('brand.name')} {t('common.app')}</span>
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <button className="flex items-center justify-center gap-2.5 w-full py-2 bg-[#050505] dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black rounded-xl transition-all shadow-sm border border-gray-800 dark:border-transparent">
                                            <Apple size={20} />
                                            <div className="flex flex-col items-start text-left rtl:text-right">
                                                <span className="text-[8px] leading-[1] text-gray-400 dark:text-gray-500 tracking-wide">Download on the</span>
                                                <span className="text-sm leading-[1] font-bold mt-0.5">App Store</span>
                                            </div>
                                        </button>
                                        <button className="flex items-center justify-center gap-2.5 w-full py-2 bg-[#050505] dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black rounded-xl transition-all shadow-sm border border-gray-800 dark:border-transparent">
                                            <Play size={18} className="text-emerald-400 dark:text-emerald-500" />
                                            <div className="flex flex-col items-start text-left rtl:text-right">
                                                <span className="text-[8px] leading-[1] text-gray-400 dark:text-gray-500 tracking-wide uppercase">Get it on</span>
                                                <span className="text-sm leading-[1] font-bold mt-0.5">Google Play</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
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
                                <p className="text-xs font-black text-gray-400 tracking-widest truncate">{t('brand.menu.brandAdmin')}</p>
                            </div>

                            <div className="flex items-center gap-1">
                                <ThemeToggle dropdownDirection="up" className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white" />
                                <button
                                    onClick={handleLogout}
                                    className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
                                    title={t('dashboard.menu.logout')}
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
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
                                <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-4 rtl:ml-0 rtl:mr-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
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
                                            className="absolute left-full rtl:left-auto rtl:right-full bottom-10 ml-4 rtl:ml-0 rtl:mr-4 w-64 bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[70] p-2"
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
                                                <div className="relative group">
                                                    <button
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                                                    >
                                                        <Smartphone size={18} />
                                                        <span>{t('owner.menu.getMobileApp')}</span>
                                                    </button>
                                                    {/* QR Code Popup */}
                                                    <div className="absolute left-full rtl:left-auto rtl:right-full bottom-0 ml-2 rtl:ml-0 rtl:mr-2 bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-[80] translate-x-2 rtl:-translate-x-2 group-hover:translate-x-0 w-[200px]">
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
                                                                        <img src={PaymintLeafIcon} alt={t('brand.name').charAt(0)} className="w-5 h-5 object-contain" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Text & Badges */}
                                                        <div className="text-center mt-2">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-3">
                                                                {t('owner.menu.scanToDownload')}<br />
                                                                <span className="text-paymint-green">{t('brand.name')} {t('common.app')}</span>
                                                            </p>
                                                            <div className="flex flex-col gap-2">
                                                                <button className="flex items-center justify-center gap-2.5 w-full py-2 bg-[#050505] dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black rounded-xl transition-all shadow-sm border border-gray-800 dark:border-transparent">
                                                                    <Apple size={20} />
                                                                    <div className="flex flex-col items-start text-left rtl:text-right">
                                                                        <span className="text-[8px] leading-[1] text-gray-400 dark:text-gray-500 tracking-wide">Download on the</span>
                                                                        <span className="text-sm leading-[1] font-bold mt-0.5">App Store</span>
                                                                    </div>
                                                                </button>
                                                                <button className="flex items-center justify-center gap-2.5 w-full py-2 bg-[#050505] dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-black rounded-xl transition-all shadow-sm border border-gray-800 dark:border-transparent">
                                                                    <Play size={18} className="text-emerald-400 dark:text-emerald-500" />
                                                                    <div className="flex flex-col items-start text-left rtl:text-right">
                                                                        <span className="text-[8px] leading-[1] text-gray-400 dark:text-gray-500 tracking-wide uppercase">Get it on</span>
                                                                        <span className="text-sm leading-[1] font-bold mt-0.5">Google Play</span>
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

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
                                                    <span>{t('owner.menu.signOut')}</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.aside>

            {/* Main Content */}
            <div
                className="flex-1 flex flex-col overflow-hidden"
                onClick={() => sidebarOpen && setSidebarOpen(false)}
            >
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
                        <img src={PaymintLeafIcon} className="w-8 h-8 object-contain" alt={t('brand.name').charAt(0)} />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{brand?.name}</span>
                    </div>

                    <ThemeToggle />
                </div>

                {/* Content Landscape */}
                <main className="flex-1 relative bg-gray-50 dark:bg-[#050505] overflow-hidden">
                    <div ref={mainContentRef} className="h-full overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
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
                                <img src={PaymintLeafIcon} className="w-8 h-8 object-contain" alt={t('brand.name').charAt(0)} />
                                <span className="font-bold text-gray-900 dark:text-white">{t('brand.name')}</span>
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
                                        <p className="text-xs font-bold text-paymint-green">{t('brand.menu.activeBrand')}</p>
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
                                <ArrowLeft size={18} className={`transition-transform ${t('common.locale') === 'ar' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                                <span className="text-sm font-bold">{t('brand.menu.backToBrands')}</span>
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
                                                ? 'bg-paymint-green text-black font-semibold shadow-lg shadow-paymint-green/20'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}
                                        `}
                                    >
                                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        <span className="text-sm font-semibold tracking-normal">{item.label}</span>
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
                                    <p className="text-xs text-gray-500">{t('brand.menu.brandAdmin')}</p>
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
                title={t('common.confirmLogoutTitle')}
                message={t('common.confirmLogout')}
                confirmText={t('dashboard.menu.logout')}
                cancelText={t('common.cancel')}
                type="danger"
            />
        </div>
    );
}


