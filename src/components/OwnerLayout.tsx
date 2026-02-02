import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { ConfirmModal } from './ConfirmModal';
import { DeletionRestorationBanner } from './DeletionRestorationBanner';
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
    KeyRound
} from 'lucide-react';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.png';
import PaymintLogoWhite from '../assets/white-green-full-logo.png';
import PaymintLeafIcon from '../assets/small-logo.png';

const menuItems = [
    { path: '/owner', label: 'Overview', icon: LayoutDashboard },
    { path: '/owner/establishments', label: 'Locations', icon: Store },
    { path: '/owner/brands', label: 'Brands', icon: Building2 },
    { path: '/owner/employees', label: 'Employees', icon: Users },
    { path: '/owner/roles', label: 'Global Roles', icon: Shield },
    { path: '/owner/billing', label: 'Billing', icon: CreditCard },
    { path: '/owner/account', label: 'Account Management', icon: KeyRound },
];

export function OwnerLayout() {
    const { account, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const mainContentRef = useRef<HTMLDivElement>(null);

    // Scroll to top on route change
    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
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
            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={{
                    width: sidebarOpen ? 300 : 100,
                    transition: { duration: 0.4, type: "spring", damping: 25, stiffness: 200 }
                }}
                className="relative z-[60] flex flex-col h-screen py-4 bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/[0.05] transition-colors duration-500 group/sidebar"
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
                                    className="h-10 w-auto object-contain dark:hidden group-hover:scale-105 transition-transform"
                                />
                                <img
                                    src={PaymintLogoWhite}
                                    alt="PayMint"
                                    className="h-10 w-auto object-contain hidden dark:block group-hover:scale-105 transition-transform"
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
                                    <img src={PaymintLeafIcon} className="w-6 h-6 object-contain transition-all duration-300 opacity-100 rotate-0 group-hover/sidebar:opacity-0 group-hover/sidebar:rotate-90 absolute" alt="P" />
                                    <PanelLeft
                                        size={24}
                                        className="transition-all duration-300 opacity-0 -rotate-90 group-hover/sidebar:opacity-100 group-hover/sidebar:rotate-0 absolute text-gray-500 dark:text-gray-400 group-hover/sidebar:text-gray-900 dark:group-hover/sidebar:text-white"
                                    />
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                        Open sidebar
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
                    {sidebarOpen && <p className="px-3 text-xs font-black text-gray-400 tracking-[0.2em] mb-4 mt-2">Main Menu</p>}
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

                {/* Owner Portal App Download */}
                {/* Owner Portal App Download - Compact */}
                <div className="px-4 mt-auto mb-2">
                    <div className="relative group">
                        {sidebarOpen ? (
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <Smartphone size={16} className="text-gray-400" />
                                <span className="text-sm font-bold">Mobile App</span>
                            </button>
                        ) : (
                            <button className="w-12 h-12 mx-auto flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <Smartphone size={24} />
                            </button>
                        )}

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
                                Scan to download<br />
                                <span className="text-paymint-green">Paymint App</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer User Profile */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-paymint-green flex items-center justify-center font-black text-black shrink-0 outline outline-2 outline-white dark:outline-black">
                                {account?.firstName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {account?.firstName} {account?.lastName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">Enterprise Owner</p>
                            </div>

                            <div className="flex items-center gap-1">
                                <ThemeToggle dropdownDirection="up" />
                                <button
                                    onClick={handleLogout}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-paymint-red/10 hover:text-paymint-red transition-all"
                                    title="Sign Out"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <ThemeToggle dropdownDirection="up" iconSize={24} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-paymint-green transition-all" />
                            <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-paymint-red/10 hover:text-paymint-red transition-all">
                                <LogOut size={24} />
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
                <DeletionRestorationBanner />
                <div ref={mainContentRef} className="flex-1 overflow-y-auto custom-scrollbar relative p-4 lg:px-10 lg:pt-10 lg:pb-6">
                    <Outlet />
                </div>
            </main >

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                title="Sign Out"
                message="Are you sure you want to sign out of your account?"
                confirmText="Sign Out"
                cancelText="Cancel"
                type="danger"
            />
        </div >
    );
}