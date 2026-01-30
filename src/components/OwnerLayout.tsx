import { useState } from 'react';
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
    ChevronRight,
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
                    width: sidebarOpen ? 300 : 80,
                    transition: { duration: 0.4, type: "spring", damping: 25, stiffness: 200 }
                }}
                className="relative z-[60] flex flex-col h-screen py-4 bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/[0.05] transition-colors duration-500"
            >
                {/* Sidebar Glow Decor */}
                <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-paymint-green/20 to-transparent opacity-50" />

                {/* Brand Header & Toggle */}
                <div className="h-20 flex items-center justify-between px-6 mb-6 relative shrink-0">
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
                                    className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 hover:border-paymint-green/40 transition-all hover:scale-105 group relative"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <img
                                        src={PaymintLeafIcon}
                                        alt="PayMint"
                                        className="h-6 w-6 object-contain scale-110"
                                    />
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
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
                        className="w-10 h-10 mx-auto mb-6 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.03] text-gray-600 dark:text-gray-400 hover:text-paymint-green transition-all border border-gray-200 dark:border-white/[0.05] hover:border-paymint-green/30 group relative"
                    >
                        <PanelLeft size={18} />
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                            Expand Sidebar
                        </div>
                    </button>
                )}

                {/* User Profile Summary - Only when open */}


                {/* Navigation Section */}
                <div className={`flex-1 ${sidebarOpen ? 'overflow-y-auto' : 'overflow-visible'} px-4 space-y-1.5 scrollbar-none scroll-smooth pb-4 relative z-10`}>
                    {sidebarOpen && <p className="px-3 text-[10px] font-black text-gray-400 tracking-[0.2em] mb-4 mt-2">Main Menu</p>}
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
                                className={`group flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 relative ${isActive
                                    ? 'bg-paymint-green text-black shadow-md shadow-paymint-green/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:text-gray-900 dark:hover:text-white'
                                    } ${!sidebarOpen ? 'w-10 h-10 justify-center px-0 mx-auto' : ''}`}
                            >
                                <Icon size={20} strokeWidth={2.5} className={`${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors'}`} />
                                {sidebarOpen && <span className="flex-1 tracking-wide">{item.label}</span>}
                                {sidebarOpen && isActive && <ChevronRight size={14} strokeWidth={3} className="opacity-40" />}

                                {!sidebarOpen && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-[10px] font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
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
                            <button className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                                <Smartphone size={18} />
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
                                <p className="text-[10px] text-gray-500 truncate">Enterprise Owner</p>
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
                            <div className="w-9 h-9 rounded-full bg-paymint-green flex items-center justify-center font-black text-black shrink-0 outline outline-2 outline-white dark:outline-black mb-1 mx-auto">
                                {account?.firstName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="relative group w-10 h-10 mx-auto flex items-center justify-center">
                                <ThemeToggle dropdownDirection="up" />
                            </div>
                            <div className="relative group w-10 h-10 mx-auto flex items-center justify-center">
                                <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-paymint-red/10 hover:text-paymint-red transition-all">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.aside >

            {/* Main Content Area */}
            < main className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-paymint-dark transition-all duration-500 border-l border-gray-200 dark:border-white/[0.05] flex flex-col" >
                <DeletionRestorationBanner />
                <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 lg:px-10 lg:pt-10 lg:pb-6">
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