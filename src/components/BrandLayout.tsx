import { SidebarUserProfileFooter } from './layout/SidebarUserProfileFooter';
import { MobileAppModal } from './MobileAppModal';
import { OWNER_ANDROID_DOWNLOAD_URL, OWNER_IOS_DOWNLOAD_URL } from '../config/downloads';
import { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DeletionRestorationBanner } from './DeletionRestorationBanner';
import { AlertsBell } from './notifications/AlertsBell';
import { useTranslation } from 'react-i18next';
import { useIsCompactSidebar } from '../hooks/useIsCompactSidebar';
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
} from 'lucide-react';

import api from '../config/api';
import { FullScreenLoader } from './LoadingState';
import { ModalCloseButton } from './ui/ModalCloseButton';
import { activeRowClass, inactiveRowClass, inactiveMobileRowClass, avatarClass, userCardClass, userNameClass, userEmailClass } from './ui/sharedStyles';

// Mintcom Logo imports
import MintcomLogoGreen from '../assets/green-full-logo.svg';
import MintcomLogoWhite from '../assets/white-green-full-logo.svg';
import MintcomLeafIcon from '../assets/small-logo.svg';
import { ConfirmModal } from './ConfirmModal';

interface Brand {
    id: string;
    name: string;
    establishmentLoginId: string;
    establishments: {
        id: string;
        name: string;
        currency?: string;
    }[];
}

const SIDEBAR_STATE_KEY = 'brand_sidebar_expanded';

// Remove getMenuItems function as it is now inside the component with useMemo


export function BrandLayout() {
    const { t } = useTranslation();
    const isRtl = t('common.locale') === 'ar';
    const isCompact = useIsCompactSidebar();
    const { brandId } = useParams<{ brandId: string }>();
    const { account, establishments, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileAppModalOpen, setMobileAppModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [brand, setBrand] = useState<Brand | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);
    const [collapsedNavTooltip, setCollapsedNavTooltip] = useState<{ label: string; top: number; offset: number } | null>(null);

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

    const brandLocations = useMemo(() => {
        const accountLocations = new Map(establishments.map((establishment) => [establishment.id, establishment]));

        return (brand?.establishments ?? []).map((brandLocation) => {
            const accountLocation = accountLocations.get(brandLocation.id);
            return {
                id: brandLocation.id,
                name: brandLocation.name || accountLocation?.name || '',
                slug: accountLocation?.establishmentLoginId,
                currency: brandLocation.currency || accountLocation?.currency,
            };
        });
    }, [brand, establishments]);
    const brandEstablishmentIds = useMemo(
        () => brandLocations.map((location) => location.id),
        [brandLocations],
    );

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

    const handleLogout = () => setIsLogoutModalOpen(true);
    const confirmLogout = () => { logout(); };
    const goBackToOwner = () => {
        navigate('/owner/brands');
    };

    if (isLoading) {
        return <FullScreenLoader message={t('brand.dashboard.loading')} />;
    }

    return (
        <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="h-screen bg-cream-100 dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 font-sans flex overflow-hidden selection:bg-mintcom-green selection:text-black transition-colors duration-500"
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

            {/* Sidebar */}
            <motion.aside
                ref={sidebarRef}
                initial={false}
                animate={{
                    width: sidebarOpen ? (isCompact ? 260 : 300) : (isCompact ? 80 : 100),
                    transition: { duration: 0.3, type: "spring", damping: 25, stiffness: 200 }
                }}
                className={`
                    dashboard-sidebar relative z-[100] flex flex-col h-full max-h-screen py-4 bg-white dark:bg-zinc-900/60 border-r border-stone-200 dark:border-zinc-800 transition-colors duration-500 group/sidebar ${sidebarOpen ? 'overflow-hidden' : 'overflow-visible'}
                    ${mobileMenuOpen ? 'fixed left-0 top-0 w-[280px]' : 'hidden lg:flex'}
                `}
            >
                {/* Logo Section */}
                <div className="dashboard-sidebar-header h-20 flex items-center justify-between px-6 mb-2 relative shrink-0">
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
                                <img
                                    src={MintcomLogoGreen}
                                    alt={t('brand.name')}
                                    width={160}
                                    height={40}
                                    loading="eager"
                                    decoding="async"
                                    className="h-10 w-auto object-contain dark:hidden transition-transform"
                                />
                                <img
                                    src={MintcomLogoWhite}
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
                                    className="logo-icon-btn w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 hover:border-mintcom-green/40 text-mintcom-green transition-all group relative"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <img src={MintcomLeafIcon} width={32} height={32} loading="eager" decoding="async" className="w-8 h-8 object-contain transition-all duration-300 opacity-100 rotate-0 group-hover/sidebar:opacity-0 group-hover/sidebar:rotate-90 absolute" alt={t('brand.name').charAt(0)} />
                                    <PanelLeft
                                        size={24}
                                        className="transition-all duration-300 opacity-0 -rotate-90 group-hover/sidebar:opacity-100 group-hover/sidebar:rotate-0 absolute text-stone-500 dark:text-zinc-400 group-hover/sidebar:text-stone-900 dark:group-hover/sidebar:text-zinc-100"
                                    />
                                    <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-stone-900 dark:bg-zinc-800 backdrop-blur-md text-stone-100 dark:text-zinc-100 text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-stone-800 dark:border-zinc-700 shadow-md translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                                        {t('owner.menu.openSidebar')}
                                    </div>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-xl text-stone-400 hover:text-mintcom-green hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all"
                        >
                            <PanelLeftClose size={20} />
                        </button>
                    )}
                </div>

                {/* Simplified Back to Brands Section */}
                <div className={`px-3 ${sidebarOpen ? 'mb-4 mt-2' : 'flex justify-center mb-1.5'}`}>
                    {sidebarOpen ? (
                        <button
                            onClick={goBackToOwner}
                            className="dashboard-sidebar-card w-full flex items-center gap-3 p-3.5 rounded-xl text-stone-500 dark:text-zinc-400 hover:text-mintcom-green hover:bg-mintcom-green/5 transition-all group border border-transparent hover:border-mintcom-green/20"
                        >
                            <ArrowLeft size={18} className={`transition-transform ${isRtl ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                            <div className="flex-1 min-w-0 text-left rtl:text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400 dark:text-zinc-500 group-hover:text-mintcom-green/70 transition-colors leading-none mb-1.5">
                                    {t('brand.menu.backToBrands')}
                                </p>
                                <h2 className="text-sm font-bold text-stone-700 dark:text-zinc-300 group-hover:text-stone-900 dark:group-hover:text-zinc-100 truncate">
                                    {brand?.name || t('common.loading')}
                                </h2>
                            </div>
                        </button>
                    ) : (
                        <button
                            onClick={goBackToOwner}
                            className="w-12 h-12 flex items-center justify-center rounded-xl text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-100 transition-all group relative"
                        >
                            <ArrowLeft size={24} className={isRtl ? 'rotate-180' : ''} />
                            <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-stone-900 dark:bg-zinc-800 backdrop-blur-md text-stone-100 dark:text-zinc-100 text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-stone-800 dark:border-zinc-700 shadow-md translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                                <span className="truncate">{t('brand.menu.switchBrand')}</span>
                            </div>
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav
                    className="dashboard-sidebar-nav flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 space-y-1.5 scrollbar-none pb-4 relative z-10"
                    onScroll={hideCollapsedNavTooltip}
                >

                    {sidebarOpen && (
                        <p className="dashboard-sidebar-section-title px-3 py-2 text-xs font-semibold text-stone-500 dark:text-zinc-400 tracking-normal">{t('brand.menu.mainMenu')}</p>
                    )}
                    {menuItems.map((item) => {
                        const Icon = item.icon;


                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === `/brand/${brandId}`}
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
                                    `dashboard-sidebar-item relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group
                                    ${isActive ? activeRowClass : inactiveRowClass}
                                    ${!sidebarOpen ? 'dashboard-sidebar-collapsed-btn justify-center w-12 h-12 mx-auto' : ''}`
                                }
                            >
                                <Icon size={!sidebarOpen ? 24 : 20} />

                                {sidebarOpen && (
                                    <span className="text-sm font-semibold tracking-normal">{item.label}</span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {!sidebarOpen && collapsedNavTooltip && (
                    <div
                        className="pointer-events-none absolute top-0 -translate-y-1/2 z-[80]"
                        style={{
                            top: collapsedNavTooltip.top,
                            left: isRtl ? undefined : collapsedNavTooltip.offset,
                            right: isRtl ? collapsedNavTooltip.offset : undefined,
                        }}
                    >
                        <div className="px-3 py-1.5 bg-stone-900 dark:bg-zinc-800 backdrop-blur-md text-stone-100 dark:text-zinc-100 text-xs font-sans font-medium tracking-normal rounded-lg whitespace-nowrap border border-stone-800 dark:border-zinc-700 shadow-md">
                            {collapsedNavTooltip.label}
                        </div>
                    </div>
                )}

                {/* Footer User Profile */}
                <SidebarUserProfileFooter
                    sidebarOpen={sidebarOpen}
                    scope="brand"
                    locations={brandLocations}
                    establishmentIds={brandEstablishmentIds}
                    onOpenMobileAppModal={() => setMobileAppModalOpen(true)}
                    onLogout={handleLogout}
                />
            </motion.aside>

            {/* Main Content */}
            <div
                className="flex-1 flex flex-col overflow-hidden"
                onClick={() => sidebarOpen && setSidebarOpen(false)}
            >
                <DeletionRestorationBanner />
                {/* Top Bar (Mobile) */}
                <div className="lg:hidden flex items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-zinc-900/60 border-b border-stone-200 dark:border-zinc-800" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label={t('common.aria.openMenu', { defaultValue: 'Open menu' })}
                        className="min-h-[44px] min-w-[44px] p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center shrink-0"
                    >
                        <Menu size={24} className="text-stone-600 dark:text-zinc-400" />
                    </button>

                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                        <img src={MintcomLeafIcon} className="w-8 h-8 object-contain shrink-0" alt={t('brand.name').charAt(0)} />
                        <span className="text-base font-bold text-stone-900 dark:text-zinc-100 truncate">{brand?.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <AlertsBell
                            scope="brand"
                            establishmentIds={brandEstablishmentIds}
                            locations={brandLocations}
                        />
                        <ThemeToggle />
                    </div>
                </div>

                {/* Content Landscape */}
                <main className="flex-1 relative bg-cream-100 dark:bg-zinc-950 overflow-hidden flex flex-col">
                    <div ref={mainContentRef} className="flex-1 overflow-y-auto relative z-10 custom-scrollbar p-4 lg:px-10 lg:pt-8 lg:pb-6 pb-24 w-full">
                        <Outlet context={{ brand }} />
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.aside
                        initial={{ x: isRtl ? 280 : -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: isRtl ? 280 : -280 }}
                        transition={{ type: "spring", damping: 28, stiffness: 260 }}
                        role="dialog"
                        aria-modal="true"
                        className="fixed start-0 top-0 h-[100dvh] w-[85vw] max-w-[300px] min-w-[260px] bg-white dark:bg-zinc-900/60 border-e border-stone-200 dark:border-zinc-800 shadow-md z-[100] flex flex-col lg:hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
                    >
                        {/* Close Button */}
                        <div className="flex items-center justify-between h-16 shrink-0 px-4 border-b border-stone-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3 min-w-0">
                                <img src={MintcomLeafIcon} className="w-8 h-8 object-contain shrink-0" alt={t('brand.name').charAt(0)} />
                                <span className="font-bold text-stone-900 dark:text-zinc-100 truncate">{t('brand.name')}</span>
                            </div>
                            <ModalCloseButton
                                onClose={() => setMobileMenuOpen(false)}
                                label={t('common.close', { defaultValue: 'Close menu' })}
                            />
                        </div>

                        {/* Brand Card */}
                        <div className="p-4">
                            <div className="p-4 bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-mintcom-green/20 flex items-center justify-center">
                                        <Building2 size={20} className="text-mintcom-green" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-700 dark:text-mintcom-green">{t('brand.menu.activeBrand')}</p>
                                        <h2 className="text-sm font-bold text-stone-900 dark:text-zinc-100 truncate">{brand?.name}</h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overscroll-contain custom-scrollbar pb-4">
                            <button
                                onClick={goBackToOwner}
                                className="w-full flex items-center gap-3 p-3 rounded-xl text-stone-500 dark:text-zinc-400 hover:text-mintcom-green hover:bg-mintcom-green/5 transition-all group mb-4"
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
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200
                                            ${isActive ? activeRowClass : inactiveMobileRowClass}
                                        `}
                                    >
                                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        <span className="text-sm font-semibold tracking-normal">{item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* Footer */}
                        <div className="p-4 border-t border-stone-200 dark:border-zinc-800 shrink-0">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <LanguageSwitcher
                                    compact
                                    dropdownDirection="up"
                                    buttonClassName="h-10 px-2.5"
                                />
                                <ThemeToggle dropdownDirection="up" />
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            >
                                <LogOut size={20} />
                                <span>{t('dashboard.menu.logout')}</span>
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                message={t('common.confirmLogout')}
                confirmText={t('dashboard.menu.logout')}
                cancelText={t('common.cancel')}
                type="danger"
            />
        
      
    
            <MobileAppModal
                isOpen={mobileAppModalOpen}
                onClose={() => setMobileAppModalOpen(false)}
                androidUrl={OWNER_ANDROID_DOWNLOAD_URL}
                iosUrl={OWNER_IOS_DOWNLOAD_URL}
            />
        </div>
    );
}
