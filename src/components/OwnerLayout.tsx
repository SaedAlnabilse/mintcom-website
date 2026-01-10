import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import {
    LayoutDashboard,
    Store,
    Users,
    CreditCard,
    LogOut,
    Smartphone,
    Building2,
} from 'lucide-react';

const menuItems = [
    { path: '/owner', label: 'Overview', icon: LayoutDashboard },
    { path: '/owner/establishments', label: 'Establishments', icon: Store },
    { path: '/owner/brands', label: 'Brands', icon: Building2 },
    { path: '/owner/employees', label: 'Employees', icon: Users },
    { path: '/owner/billing', label: 'Billing', icon: CreditCard },
];

export function OwnerLayout() {
    const { account, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-56 bg-white dark:bg-[#0A0A0A] border-r border-gray-200 dark:border-white/5 flex flex-col transition-colors duration-300">
                {/* Logo */}
                <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100 dark:border-white/5">
                    <div className="w-8 h-8 bg-indigo-600 dark:bg-paymint-green rounded-lg flex items-center justify-center">
                        <Store size={18} className="text-white dark:text-black" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">OmniPOS</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
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
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive
                                    ? 'bg-indigo-50 dark:bg-paymint-green/10 text-indigo-600 dark:text-paymint-green'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-indigo-600 dark:text-paymint-green' : 'text-gray-400'} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* POS Simulator */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5">
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">POS Simulator</p>
                        <button
                            onClick={() => window.open('/pos-simulator', '_blank')}
                            className="w-full py-2.5 px-4 bg-indigo-600 dark:bg-paymint-green text-white dark:text-black rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 dark:hover:bg-paymint-green/90 transition-colors"
                        >
                            <Smartphone size={18} />
                            Open App
                        </button>
                    </div>
                </div>

                {/* User Footer with Theme Toggle */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-400">
                            Logged in as <span className="font-medium text-gray-600 dark:text-gray-300">{account?.firstName?.toLowerCase()}</span>
                        </p>
                        <ThemeToggle dropdownDirection="up" />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <LogOut size={16} />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
