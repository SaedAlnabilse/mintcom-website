import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users,
    Store,
    UserCheck,
    Shield,
    Mail,
    Search
} from 'lucide-react';
import api from '../../config/api';

interface Brand {
    id: string;
    name: string;
    ownerPosId: string;
    establishments: {
        id: string;
        name: string;
        type: string;
        currency: string;
    }[];
}

interface Employee {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string | null;
    isActive: boolean;
    establishments: {
        id: string;
        name: string;
        role: string;
    }[];
}

export function BrandTeamPage() {
    const { brandId } = useParams<{ brandId: string }>();
    const context = useOutletContext<{ brand: Brand | null }>();
    const brand = context?.brand;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (brandId) {
            fetchEmployees();
        }
    }, [brandId]);

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/brands/${brandId}/employees`);
            setEmployees(response.data || []);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadgeColor = (role: string) => {
        switch (role.toUpperCase()) {
            case 'MANAGER':
                return 'bg-purple-500/10 text-purple-500';
            case 'CASHIER':
                return 'bg-blue-500/10 text-blue-500';
            case 'ADMIN':
                return 'bg-paymint-green/10 text-paymint-green';
            default:
                return 'bg-gray-500/10 text-gray-500';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-gray-50 to-white dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/20">
                            <Users size={32} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Brand Team</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                Shared employees across {brand?.name} locations
                            </p>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                                    <Users size={20} className="text-paymint-green" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{employees.length}</p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <UserCheck size={20} className="text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                                        {employees.filter(e => e.isActive).length}
                                    </p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Shield size={20} className="text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                                        {employees.filter(e => e.establishments.some(est => est.role === 'MANAGER')).length}
                                    </p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Managers</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Store size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                                        {brand?.establishments.length || 0}
                                    </p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Locations</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team List */}
            <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl border border-gray-200 dark:border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                            <Users size={20} className="text-paymint-green" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">All Team Members</h2>
                            <p className="text-xs text-gray-500">Employees shared across brand locations</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-10 h-10 border-4 border-paymint-green border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-16">
                        <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500">{searchQuery ? 'No employees match your search' : 'No team members found'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredEmployees.map((employee, index) => (
                            <motion.div
                                key={employee.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-paymint-green/50 transition-all"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center border border-white/10 shadow-lg">
                                        <span className="text-white font-black text-lg">
                                            {employee.firstName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-gray-900 dark:text-white truncate">
                                            {employee.firstName} {employee.lastName}
                                        </h3>
                                        <p className="text-xs text-gray-500 truncate">@{employee.username}</p>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${employee.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                </div>

                                {employee.email && (
                                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                                        <Mail size={14} />
                                        <span className="truncate">{employee.email}</span>
                                    </div>
                                )}

                                {/* Locations & Roles */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Locations</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {employee.establishments.map((est) => (
                                            <div
                                                key={est.id}
                                                className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-black/20 rounded-lg"
                                            >
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{est.name}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${getRoleBadgeColor(est.role)}`}>
                                                    {est.role}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
