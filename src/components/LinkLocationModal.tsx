import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
    Store, 
    Check, 
    Loader2, 
    Building2, 
    Search, 
    Users, 
    ChevronRight, 
    ChevronLeft,
    Shield,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getBusinessTypeIcon } from '../utils/businessTypeIcons';
import api from '../config/api';
import toast from 'react-hot-toast';
import { formatInputPlaceholder } from '../utils/textCase';
import { getPersonDisplayName } from '../utils/personName';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton } from './ui';

interface EmployeeForMerging {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    establishmentId: string;
    establishmentName: string;
}

interface EstablishmentEmployees {
    establishmentId: string;
    establishmentName: string;
    employees: EmployeeForMerging[];
}

interface LinkLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    brandId: string;
    onSuccess: () => void;
    existingBrands: any[];
}

export function LinkLocationModal({
    isOpen,
    onClose,
    brandId,
    onSuccess,
    existingBrands
}: LinkLocationModalProps) {
    const { t } = useTranslation();
    const { establishments } = useAuth();
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [employeesForMerging, setEmployeesForMerging] = useState<EstablishmentEmployees[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter establishments that are NOT linked to ANY brand
    const availableEstablishments = useMemo(() => {
        return establishments.filter(
            (est) => !existingBrands.some(brand => 
                brand.establishments?.some((e: any) => e.id === est.id)
            )
        );
    }, [establishments, existingBrands]);

    const filteredEstablishments = useMemo(() => {
        if (!searchQuery.trim()) return availableEstablishments;
        const query = searchQuery.toLowerCase();
        return availableEstablishments.filter(est => 
            est.name.toLowerCase().includes(query) || 
            est.type?.toLowerCase().includes(query)
        );
    }, [availableEstablishments, searchQuery]);

    const toggleEstablishment = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleEmployee = (id: string) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const fetchEmployeesForMerging = async () => {
        if (selectedIds.length === 0) return;

        setIsLoadingEmployees(true);
        try {
            const response = await api.post('/api/brands/employees-for-merging', {
                establishmentIds: selectedIds,
            });

            if (response.data) {
                const sanitizedData = response.data.map((group: any) => ({
                    ...group,
                    employees: group.employees.map((emp: any) => {
                        const realId = emp.employeeId || emp.id || emp._id || emp.userId;
                        return {
                            ...emp,
                            employeeId: realId,
                            id: realId || `temp-${Math.random().toString(36).substr(2, 9)}`
                        };
                    })
                }));
                setEmployeesForMerging(sanitizedData);
            }
        } catch (err) {
            console.error('Failed to fetch employees:', err);
            toast.error(t('owner.staff.syncError'));
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    const handleNext = async () => {
        if (step === 1) {
            if (selectedIds.length === 0) return;
            await fetchEmployeesForMerging();
            setStep(2);
        }
    };

    const handleLink = async () => {
        setIsSubmitting(true);
        try {
            await api.post(`/api/brands/${brandId}/link-establishments`, {
                establishmentIds: selectedIds,
                mergeEmployeeIds: selectedEmployeeIds
            });
            toast.success(t('common.success'));
            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error('Failed to link establishments:', error);
            toast.error(error.response?.data?.message || t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setSelectedIds([]);
        setSelectedEmployeeIds([]);
        setEmployeesForMerging([]);
        setSearchQuery('');
        onClose();
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role?.toUpperCase()) {
            case 'ADMIN': return 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20';
            case 'MANAGER': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnBackdrop={false}>
            <ModalHeader
                title={step === 1 ? t('owner.brands.linkLocations') : t('owner.brands.wizard.step3')}
                subtitle={
                    step === 1
                        ? t('owner.brands.selectLocationsToLink')
                        : t('owner.brands.wizard.finalStepDesc')
                }
                icon={step === 1 ? <Building2 size={24} /> : <Users size={24} />}
                onClose={handleClose}
            />

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-100 dark:bg-white/5 overflow-hidden shrink-0">
                <motion.div
                    initial={{ width: "50%" }}
                    animate={{ width: step === 1 ? "50%" : "100%" }}
                    className="h-full bg-mintcom-green transition-all duration-500"
                />
            </div>

            {/* Content */}
            <ModalBody>
                <div className="space-y-6">
                        {step === 1 ? (
                            <>
                                {/* Search */}
                                {availableEstablishments.length > 0 && (
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                                        <input
                                            maxLength={255}
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={formatInputPlaceholder(t('owner.locations.searchPlaceholder'), t('common.locale'))}
                                            className="w-full pl-14 pr-5 py-4.5 bg-gray-50 dark:bg-black/20 border border-transparent focus:border-mintcom-green/30 rounded-2xl text-[15px] font-sans font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 transition-all h-[60px]"
                                        />
                                    </div>
                                )}

                                {availableEstablishments.length === 0 ? (
                                    <div className="pt-4 pb-0">
                                        <div className="flex flex-col items-center text-center space-y-6">
                                            <div className="w-20 h-20 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm">
                                                <Store size={40} />
                                            </div>
                                            
                                            <div className="space-y-2 px-4">
                                                <h2 className="text-xl font-sans font-bold text-gray-900 dark:text-white tracking-tight">
                                                    {t('owner.brands.disclaimerTitle')}
                                                </h2>
                                                <p className="text-[15px] font-sans font-medium text-gray-500">
                                                    {t('owner.brands.disclaimerSubtitle')}
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 dark:bg-black/20 rounded-3xl p-6 border border-gray-100 dark:border-white/5">
                                                <p className="text-[14px] font-sans font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {t('owner.brands.disclaimerDesc')}
                                                </p>
                                            </div>

                                            <button
                                                onClick={handleClose}
                                                className="w-full py-4 rounded-2xl bg-mintcom-green text-black font-sans font-bold text-sm tracking-tight hover:bg-mintcom-green/90 transition-all shadow-lg shadow-mintcom-green/20 active:scale-[0.98] mt-4"
                                            >
                                                {t('owner.brands.disclaimerAction')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {filteredEstablishments.map((est) => {
                                            const Icon = getBusinessTypeIcon(est.type);
                                            const isSelected = selectedIds.includes(est.id);
                                            return (
                                                <button
                                                    key={est.id}
                                                    onClick={() => toggleEstablishment(est.id)}
                                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                                                        isSelected ? 'border-mintcom-green bg-mintcom-green/5 ring-1 ring-mintcom-green' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:border-mintcom-green/30'
                                                    }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-mintcom-green text-black' : 'bg-white dark:bg-white/5 text-gray-400 group-hover:text-mintcom-green'}`}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{est.name}</h4>
                                                        <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mt-0.5">{est.type} • {est.currency}</p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-mintcom-green border-mintcom-green' : 'border-gray-200 dark:border-white/10'}`}>
                                                        {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-8">
                                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex gap-4">
                                    <Shield className="text-blue-500 shrink-0 mt-1" size={20} />
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 leading-relaxed">
                                        {t('owner.brands.wizard.finalStepDesc')}
                                    </p>
                                </div>

                                {isLoadingEmployees ? (
                                    <div className="py-20 flex flex-col items-center gap-4">
                                        <Loader2 className="animate-spin text-mintcom-green" size={32} />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('owner.brands.wizard.scanningEmployees')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {employeesForMerging.map((group) => (
                                            <div key={group.establishmentId} className="space-y-4">
                                                <div className="flex items-center gap-2 px-1">
                                                    <Store size={14} className="text-mintcom-green" />
                                                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">
                                                        {group.establishmentName}
                                                    </h3>
                                                </div>
                                                    {group.employees.length === 0 ? (
                                                        <div className="p-6 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-3">
                                                            <Users className="text-gray-300 dark:text-gray-600" size={24} />
                                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('owner.staff.noStaff')}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {group.employees.map((emp) => {
                                                                const isSelected = selectedEmployeeIds.includes(emp.employeeId);
                                                                return (
                                                                    <button
                                                                        key={emp.employeeId}
                                                                        onClick={() => toggleEmployee(emp.employeeId)}
                                                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                                                                            isSelected ? 'border-mintcom-green bg-mintcom-green/5' : 'border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-black/10'
                                                                        }`}
                                                                    >
                                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-mintcom-green text-black' : 'bg-white dark:bg-white/5 text-gray-400'}`}>
                                                                            <CheckCircle2 size={20} />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{getPersonDisplayName(emp, t('common.unknown'))}</h4>
                                                                            <p className="text-[10px] font-medium text-gray-500 truncate">{emp.email}</p>
                                                                        </div>
                                                                        <span className={`px-2 py-1 rounded-lg border text-[10px] font-black tracking-widest ${getRoleBadgeColor(emp.role)}`}>
                                                                            {emp.role}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
            </ModalBody>

            {/* Footer */}
            {availableEstablishments.length > 0 && (
                <ModalFooter>
                    <ModalCancelButton onClick={step === 1 ? handleClose : () => setStep(1)}>
                        {step === 2 && <ChevronLeft size={16} />}
                        {step === 1 ? t('common.cancel') : t('common.back')}
                    </ModalCancelButton>
                    {step === 1 ? (
                        <ModalSubmitButton
                            type="button"
                            onClick={handleNext}
                            disabled={selectedIds.length === 0 || isLoadingEmployees}
                            loading={isLoadingEmployees}
                        >
                            {t('common.next')}
                            <ChevronRight size={16} />
                        </ModalSubmitButton>
                    ) : (
                        <ModalSubmitButton
                            type="button"
                            onClick={handleLink}
                            loading={isSubmitting}
                        >
                            <Building2 size={18} />
                            {t('owner.brands.linkLocations')}
                        </ModalSubmitButton>
                    )}
                </ModalFooter>
            )}
        </Modal>
    );
}
