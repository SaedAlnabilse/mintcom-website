import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { ConfirmModal } from './ConfirmModal';
import {
    LayoutDashboard,
    Store,
    Users,
    CreditCard,
    LogOut,
    Smartphone,
    Building2,
    ChevronRight,
    PanelLeftClose,
    PanelLeft,
    KeyRound,
} from 'lucide-react';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.png';
import PaymintLogoWhite from '../assets/white-green-full-logo.png';
import PaymintLeafIcon from '../assets/small-logo.png';

const menuItems = [
    { path: '/owner', label: 'Overview', icon: LayoutDashboard },
    { path: '/owner/establishments', label: 'Establishments', icon: Store },
    { path: '/owner/brands', label: 'Brands', icon: Building2 },
    { path: '/owner/employees', label: 'Employees', icon: Users },
    { path: '/owner/billing', label: 'Billing', icon: CreditCard },
    { path: '/owner/account', label: 'Account Management', icon: KeyRound },
];

export function OwnerLayout() {
    const { account, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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
                className="relative z-[60] flex flex-col h-screen p-4 bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/[0.05] transition-colors duration-500"
            >
                {/* Sidebar Glow Decor */}
                <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-paymint-green/20 to-transparent opacity-50" />

                {/* Brand Header & Toggle */}
                <div className="h-20 flex items-center justify-between px-2 mb-6 relative shrink-0">
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
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 hover:border-paymint-green/40 transition-all hover:scale-105 group relative"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <img
                                        src={PaymintLeafIcon}
                                        alt="PayMint"
                                        className="h-7 w-7 object-contain scale-110"
                                    />
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                        Expand Sidebar
                                    </div>
                                </div>
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

                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-12 h-12 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[0.03] text-gray-600 dark:text-gray-400 hover:text-paymint-green transition-all border border-gray-200 dark:border-white/[0.05] hover:border-paymint-green/30 group relative"
                    >
                        <PanelLeft size={20} />
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                            Expand Sidebar
                        </div>
                    </button>
                )}

                {/* User Profile Summary - Only when open */}
                {sidebarOpen && (
                    <div className="px-2 mb-6 relative z-10">
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-paymint-green flex items-center justify-center font-black text-black shrink-0">
                                    {account?.firstName?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                                        {account?.firstName} {account?.lastName}
                                    </p>
                                    <p className="text-[10px] font-bold text-paymint-green uppercase tracking-widest">
                                        Enterprise Owner
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Section */}
                <div className={`flex-1 ${sidebarOpen ? 'overflow-y-auto' : 'overflow-visible'} px-2 space-y-1.5 scrollbar-none scroll-smooth pb-4 relative z-10`}>
                    {sidebarOpen && <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 mt-2">Main Menu</p>}
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.path === '/owner'
                            ? location.pathname === '/owner'
                            : location.pathname.startsWith(item.path);

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/owner'}
                                className={`group flex items-center gap-3 p-3.5 rounded-xl font-bold text-sm transition-all duration-300 relative ${isActive
                                    ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white'
                                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                            >
                                <Icon size={20} className={`${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors'}`} />
                                {sidebarOpen && <span className="flex-1">{item.label}</span>}
                                {sidebarOpen && isActive && <ChevronRight size={14} className="opacity-50" />}

                                {!sidebarOpen && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                {/* POS Simulator */}
                <div className="p-2 relative z-10 mt-auto">
                    {sidebarOpen ? (
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-paymint-green dark:to-emerald-600 rounded-xl p-3.5 shadow-xl shadow-indigo-500/10 dark:shadow-paymint-green/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10">
                                <p className="text-[8px] font-black text-white/60 dark:text-black/60 uppercase tracking-[0.2em] mb-0.5">POS Simulator</p>
                                <h4 className="text-xs font-black text-white dark:text-black mb-2.5 tracking-tight">Terminal Access</h4>
                                <button
                                    onClick={() => window.open('/pos-simulator', '_blank')}
                                    className="w-full py-2 px-3 bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30 backdrop-blur-md text-white dark:text-black rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/10 dark:border-black/5"
                                >
                                    <Smartphone size={12} />
                                    Launch System
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => window.open('/pos-simulator', '_blank')}
                            className="w-12 h-12 mx-auto flex items-center justify-center rounded-2xl bg-indigo-600 dark:bg-paymint-green text-white dark:text-black shadow-lg hover:scale-105 transition-all group relative"
                        >
                            <Smartphone size={20} />
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                POS Simulator
                            </div>
                        </button>
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-2 relative z-10">
                    <div className="bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-2xl p-3 space-y-4 shadow-sm">
                        {sidebarOpen ? (
                            <div className="flex items-center justify-between gap-2 px-1">
                                <div className="flex items-center gap-1">
                                    <ThemeToggle dropdownDirection="up" />
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-paymint-red/10 hover:text-paymint-red transition-all font-bold text-xs"
                                >
                                    <LogOut size={16} />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group">
                                    <ThemeToggle dropdownDirection="up" />
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                        Theme
                                    </div>
                                </div>
                                <div className="relative group">
                                    <button onClick={handleLogout} className="p-3 rounded-2xl bg-paymint-red/10 text-paymint-red hover:bg-paymint-red hover:text-white transition-all">
                                        <LogOut size={20} />
                                    </button>
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                                        Log Out
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-paymint-dark transition-all duration-500 border-l border-gray-200 dark:border-white/[0.05]">
                <div className="h-full overflow-y-auto custom-scrollbar relative p-4 lg:px-10 lg:pt-10 lg:pb-6">
                    <Outlet />
                </div>
            </main>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                title="Sign Out"
                message="Are you sure you want to sign out of your account?"
                confirmText="Sign Out"
                cancelText="Stay Logged In"
                type="danger"
            />
        </div>
    );
}