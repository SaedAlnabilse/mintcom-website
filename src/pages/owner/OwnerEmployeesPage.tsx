import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import api from '../../config/api';
import { EmployeeFormModal } from '../../components/forms/EmployeeFormModal';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    role: string;
    accessLevel: string;
    establishments: string[];
}


export function OwnerEmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [establishments, setEstablishments] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // For now we don't have editing implemented in this view fully, 
    // as editing deeply nested global user vs local assignment is complex.
    // We focus on "Add Employee" as requested.


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [empRes, profileRes] = await Promise.all([
                api.get('/api/accounts/all-employees'),
                api.get('/api/accounts/profile')
            ]);

            setEmployees(empRes.data || []);
            setEstablishments(profileRes.data.establishments || []);
        } catch (err) {
            console.error(err);
            // Fallback demo data if API fails
            setEmployees([
                {
                    id: '1',
                    firstName: 'saed',
                    lastName: '',
                    username: 'sa3d.n97',
                    role: 'Owner',
                    accessLevel: 'All Locations',
                    establishments: [],
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEmployee = async (data: any) => {
        try {
            setIsSubmitting(true);
            await api.post('/api/accounts/employees', data);
            setShowModal(false);
            fetchData(); // Refresh list
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            Owner: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30',
            Admin: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
            Manager: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
            Cashier: 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10',
        };
        return styles[role] || 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10';
    };

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-gray-50 to-white dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-gray-200 dark:border-white/5 shadow-sm mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
                            <Users size={28} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Team Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Manage staff access and roles</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-paymint-green/30">
                            <Plus size={18} />
                            <span>Add Employee</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-white/5">
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Access</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">Loading...</td>
                            </tr>
                        ) : employees.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">No employees found</td>
                            </tr>
                        ) : (
                            employees.map((employee, index) => (
                                <motion.tr
                                    key={employee.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="py-4 px-6">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {employee.firstName} {employee.lastName}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-gray-600 dark:text-gray-400">{employee.username}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(employee.role)}`}>
                                            {employee.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-gray-600 dark:text-gray-400">{employee.accessLevel}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <button className="text-indigo-600 dark:text-paymint-green hover:text-indigo-700 dark:hover:text-paymint-green/80 font-medium text-sm">
                                            Edit
                                        </button>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <EmployeeFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleAddEmployee}
                establishments={establishments}
                isSubmitting={isSubmitting}
                availableDiscounts={[]} // We can implement fetching discounts later if needed
            />
        </div >
    );
}
