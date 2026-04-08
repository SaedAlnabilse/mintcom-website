import { MobileAppModal } from './MobileAppModal';
import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
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
    ArrowLeft
} from 'lucide-react';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.svg';
import PaymintLogoWhite from '../assets/white-green-full-logo.svg';
import PaymintLeafIcon from '../assets/small-logo.svg';

export function OwnerLayout() {
    const { t } = useTranslation();
    const { account, logout } = useAuth();
    const isRtl = t('common.locale') === 'ar';

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
    const [mobileAppModalOpen, setMobileAppModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);
    const [collapsedNavTooltip, setCollapsedNavTooltip] = useState<{ label: string; top: number; offset: number } | null>(null);

    useEffect(() => {
        document.body.classList.add('dashboard-font-unified');
        return () => {
            document.body.classList.remove('dashboard-font-unified');
        };
    }, []);

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

    useEffect(() => {
        setCollapsedNavTooltip(null);
    }, [location.pathname, sidebarOpen]);

    const showCollapsedNavTooltip = (target: HTMLElement, label: string) => {
        if (sidebarOpen || !sidebarRef.current) {
            return;
        }

        const itemRect = target.getBoundingClientRect();
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        const tooltipGap = 10;

        setCollapsedNavTooltip({
            label,
            top: itemRect.top - sidebarRect.top + (itemRect.height / 2),
            offset: isRtl
                ? (sidebarRect.right - itemRect.left) + tooltipGap
                : (itemRect.right - sidebarRect.left) + tooltipGap,
        });
    };

    const hideCollapsedNavTooltip = () => {
        setCollapsedNavTooltip(null);
    };

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans flex overflow-hidden selection:bg-paymint-green selection:text-black transition-colors duration-500"
        >
            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                ref={sidebarRef}
                initial={false}
                animate={{
                    width: sidebarOpen ? 300 : 100,
                    transition: { duration: 0.4, type: "spring", damping: 25, stiffness: 200 }
                }}
                className={`
                    relative z-[100] flex-col h-screen py-4 bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/[0.05] transition-colors duration-500 group/sidebar
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
                                onClick={() => navigate('/')}
                            >
                                <ArrowLeft size={16} className="text-gray-400 mr-2 group-hover:-translate-x-1 transition-transform" />
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
                                <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900/90 text-white text-xs px-2 py-1 rounded">
                                    {t('nav.home', 'Home')}
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
                                <button
                                    className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 hover:border-paymint-green/40 text-paymint-green transition-all group relative"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <img src={PaymintLeafIcon} width={32} height={32} loading="eager" decoding="async" className="w-8 h-8 object-contain transition-all duration-300 opacity-100 rotate-0 group-hover/sidebar:opacity-0 group-hover/sidebar:rotate-90 absolute" alt="P" />
                                    <PanelLeft
                                        size={24}
                                        className="transition-all duration-300 opacity-0 -rotate-90 group-hover/sidebar:opacity-100 group-hover/sidebar:rotate-0 absolute text-gray-500 dark:text-gray-400 group-hover/sidebar:text-gray-900 dark:group-hover/sidebar:text-white"
                                    />
                                    <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
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

                {/* Navigation Section */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto overflow-x-visible px-3 space-y-1.5 scrollbar-none scroll-smooth pb-4 relative z-10"
                    onScroll={hideCollapsedNavTooltip}
                >
                    {sidebarOpen && <p className="px-3 py-2 text-xs font-semibold text-gray-500 tracking-normal mb-4 mt-2">{t('owner.menu.mainMenu')}</p>}
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/owner'}
                                onClick={() => {
                                    setSidebarOpen(false);
                                    setCollapsedNavTooltip(null);
                                }}
                                onMouseEnter={(event) => showCollapsedNavTooltip(event.currentTarget, item.label)}
                                onMouseLeave={hideCollapsedNavTooltip}
                                onFocus={(event) => showCollapsedNavTooltip(event.currentTarget, item.label)}
                                onBlur={hideCollapsedNavTooltip}
                                aria-label={!sidebarOpen ? item.label : undefined}
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
                            </NavLink>
                        );
                    })}
                </div>

                {!sidebarOpen && collapsedNavTooltip && (
                    <div
                        className="pointer-events-none absolute top-0 -translate-y-1/2 z-[80]"
                        style={{
                            top: collapsedNavTooltip.top,
                            left: isRtl ? undefined : collapsedNavTooltip.offset,
                            right: isRtl ? collapsedNavTooltip.offset : undefined,
                        }}
                    >
                        <div className="px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg whitespace-nowrap border border-white/10 shadow-xl">
                            {collapsedNavTooltip.label}
                        </div>
                    </div>
                )}

                {/* Footer User Profile */}
                <div className="p-3 border-t border-gray-100 dark:border-white/5 relative shrink-0">
                    {sidebarOpen ? (
                        <div className="space-y-1">
                            {/* Profile Header */}
                            <div className="flex items-center gap-3 p-3 mb-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm text-black font-bold text-xs">
                                    {account?.firstName?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                        {account?.firstName} {account?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{account?.email || t('owner.menu.enterpriseOwner')}</p>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="flex justify-end">
                                <LanguageSwitcher
                                    dropdownDirection="up"
                                    className="w-full"
                                    buttonClassName="w-full justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:!bg-gray-100 dark:hover:!bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left !bg-transparent dark:!bg-transparent !border-transparent focus:outline-none focus:ring-0 focus:!bg-transparent focus:!border-transparent active:!bg-transparent active:!border-transparent"
                                    menuClassName="w-full min-w-0"
                                    iconSize={20}
                                />
                            </div>

                            <ThemeToggle
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                                showLabel={true}
                                dropdownDirection="up"
                                iconSize={20}
                            />

                            <button onClick={() => setMobileAppModalOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left">
                                    <Smartphone size={16} className="text-gray-400" />
                                    <span>{t('owner.menu.getMobileApp')}</span>
                                </button>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all text-left"
                            >
                                <LogOut size={20} />
                                <span>{t('dashboard.menu.logout')}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative group">
                                <LanguageSwitcher
                                    compact
                                    showGlobeIcon={false}
                                    dropdownDirection="right"
                                    buttonClassName="w-12 h-12 rounded-xl !px-0 !py-0 flex items-center justify-center gap-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                                />
                                <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0 group-focus-within:translate-x-0">
                                    {t('common.aria.changeLanguage')}
                                </div>
                            </div>

                            {/* Mobile App Icon for Closed Sidebar */}
                            <button
                                onClick={() => setMobileAppModalOpen(true)}
                                className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all relative group"
                            >
                                <Smartphone size={24} />
                                {/* Tooltip */}
                                <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                                    {t('owner.menu.getMobileApp')}
                                </div>
                            </button>
                            <div className="relative group">
                                <ThemeToggle
                                    dropdownDirection="right"
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all"
                                    iconSize={24}
                                />
                                <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0 group-focus-within:translate-x-0">
                                    {t('theme.switchTheme')}
                                </div>
                            </div>

                            {/* Logout Icon */}
                            <button
                                onClick={handleLogout}
                                className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all relative group"
                            >
                                <LogOut size={24} />
                                {/* Tooltip */}
                                <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                                    {t('dashboard.menu.logout')}
                                </div>
                            </button>
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
                        alt={t('brand.name')}
                        className="h-8 w-auto object-contain dark:hidden"
                    />
                    <img
                        src={PaymintLogoWhite}
                        alt={t('brand.name')}
                        className="h-8 w-auto object-contain hidden dark:block"
                    />
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher
                            compact
                            dropdownDirection="up"
                            buttonClassName="h-10 px-2.5"
                        />
                        <ThemeToggle dropdownDirection="down" />
                    </div>
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
                        className="fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/5 shadow-2xl z-[100] flex flex-col lg:hidden"
                    >
                        {/* Close Button */}
                        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <img src={PaymintLeafIcon} className="w-8 h-8 object-contain" alt="P" />
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{t('brand.name')}</span>
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
                            <div className="flex items-center gap-2 mb-3">
                                <LanguageSwitcher
                                    compact
                                    dropdownDirection="up"
                                    buttonClassName="h-10 px-2.5"
                                />
                                <ThemeToggle dropdownDirection="up" />
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center">
                                    <span className="text-black font-bold">{account?.firstName?.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{account?.firstName}</p>
                                    <p className="text-xs text-gray-500">{t('owner.menu.enterpriseOwner')}</p>
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
            
            <MobileAppModal isOpen={mobileAppModalOpen} onClose={() => setMobileAppModalOpen(false)} />
        </div >
    );
}
