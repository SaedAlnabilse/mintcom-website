import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Check, Smartphone, Monitor } from 'lucide-react';
import api from '../config/api';
import { useScrollLock } from '../hooks/useScrollLock';

interface CustomRole {
  id: string;
  name: string;
  baseRole: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'USER';
  permissions: string[];
  allowedDiscounts: string[];
  // Access Control
  posAccess: boolean;
  backofficeAccess: boolean;
  backofficePermissions: string[];
}

interface Discount {
  id: string;
  name: string;
  percentage: number;
  adminOnly: boolean;
}

interface CustomRoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: CustomRole | null;
  isSubmitting?: boolean;
}

const POS_PERMISSIONS = [
  { id: 'accept_payments', label: 'Accept Payments', description: 'Process payments' },
  { id: 'apply_discounts', label: 'Apply Discounts', description: 'Apply discounts' },
  { id: 'change_taxes', label: 'Change Taxes', description: 'Modify tax rate' },
  { id: 'open_cash_drawer', label: 'Open Drawer', description: 'Open drawer manually' },
  { id: 'view_all_receipts', label: 'View Receipts', description: 'See all receipts' },
  { id: 'refunds', label: 'Refunds', description: 'Process refunds' },
  { id: 'reprint_receipts', label: 'Reprint', description: 'Reprint receipts' },
  { id: 'manage_items', label: 'Manage Items', description: 'Edit menu' },
  { id: 'view_item_cost', label: 'View Costs', description: 'See costs' },
  { id: 'settings', label: 'Settings', description: 'App settings' },
  { id: 'live_chat', label: 'Support', description: 'Chat support' },
];

const BACKOFFICE_PERMISSIONS = [
  { id: 'view_reports', label: 'Reports', description: 'Sales reports' },
  { id: 'view_orders', label: 'Orders', description: 'Transaction history' },
  { id: 'manage_inventory', label: 'Inventory', description: 'Manage stock' },
  { id: 'view_costs', label: 'Costs', description: 'See costs' },
  { id: 'manage_employees', label: 'Staff', description: 'Manage team' },
  { id: 'manage_customers', label: 'Customers', description: 'Manage customers' },
  { id: 'manage_discounts', label: 'Discounts', description: 'Manage offers' },
  { id: 'manage_payment_methods', label: 'Payments', description: 'Payment types' },
  { id: 'manage_settings', label: 'Settings', description: 'Store settings' },
  { id: 'view_activity_logs', label: 'Logs', description: 'System logs' },
  { id: 'manage_billing', label: 'Billing', description: 'Subscription' },
];

export function CustomRoleFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}: CustomRoleFormModalProps) {
  const [name, setName] = useState('');

  useScrollLock(isOpen);

  // Access Control State
  const [posAccess, setPosAccess] = useState(true);
  const [backofficeAccess, setBackofficeAccess] = useState(false);

  // Permissions State
  const [permissions, setPermissions] = useState<string[]>([]); // Pos permissions
  const [backofficePermissions, setBackofficePermissions] = useState<string[]>([]); // Back office permissions

  // Discount State
  const [allowedDiscounts, setAllowedDiscounts] = useState<string[]>([]);
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [allDiscountsSelected, setAllDiscountsSelected] = useState(true);

  // UI State
  const [showDiscountsDropdown, setShowDiscountsDropdown] = useState(false);
  const discountsContainerRef = useRef<HTMLDivElement>(null); // Ref for scrolling
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (showDiscountsDropdown && discountsContainerRef.current) {
      setTimeout(() => {
        discountsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [showDiscountsDropdown]);

  useEffect(() => {
    if (isOpen) {
      fetchDiscounts();
      if (initialData) {
        setName(initialData.name || '');
        setPosAccess(initialData.posAccess !== false); // Default true
        setBackofficeAccess(initialData.backofficeAccess || false);
        setPermissions(initialData.permissions || []);

        // Handle Backoffice Permissions (with legacy mapping)
        const initialBackofficePerms = [...(initialData.backofficePermissions || [])];
        if (initialBackofficePerms.includes('manage_items') && !initialBackofficePerms.includes('manage_inventory')) {
          initialBackofficePerms.push('manage_inventory');
        }
        if (initialBackofficePerms.includes('view_cost') && !initialBackofficePerms.includes('view_costs')) {
          initialBackofficePerms.push('view_costs');
        }
        if (initialBackofficePerms.includes('manage_payment_types') && !initialBackofficePerms.includes('manage_payment_methods')) {
          initialBackofficePerms.push('manage_payment_methods');
        }

        setBackofficePermissions(initialBackofficePerms);
        setAllowedDiscounts(initialData.allowedDiscounts || []);
        setAllDiscountsSelected(initialData.allowedDiscounts?.length === 0);
      } else {
        // Defaults for new role
        setName('');
        setPosAccess(true);
        setBackofficeAccess(false);
        setPermissions(['accept_payments', 'apply_discounts']);
        setBackofficePermissions([]);
        setAllowedDiscounts([]);
        setAllDiscountsSelected(true);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const fetchDiscounts = async () => {
    try {
      const response = await api.get('/app-settings/discounts');
      setAvailableDiscounts(response.data || []);
    } catch (err) {
      console.error('Failed to load discounts');
    }
  };

  const togglePermission = (permissionId: string) => {
    setPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleBackofficePermission = (permissionId: string) => {
    setBackofficePermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleDiscount = (discountId: string) => {
    setAllowedDiscounts(prev =>
      prev.includes(discountId)
        ? prev.filter(id => id !== discountId)
        : [...prev, discountId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Required';

    // Validation: At least one permission must be enabled
    const finalPermissions = posAccess ? permissions : [];
    const finalBackofficePermissions = backofficeAccess ? backofficePermissions : [];

    if (finalPermissions.length === 0 && finalBackofficePermissions.length === 0) {
      newErrors.general = 'Role must have at least one permission enabled';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      name: name.trim(),
      baseRole: 'USER', // Default base role for custom roles
      permissions: finalPermissions,
      allowedDiscounts: allDiscountsSelected ? [] : allowedDiscounts,
      // Access Control
      posAccess,
      backofficeAccess,
      backofficePermissions: finalBackofficePermissions,
    };

    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#1E293B] w-[95vw] sm:w-full max-w-xl rounded-2xl overflow-hidden max-h-[85vh] flex flex-col border border-gray-200 dark:border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 pb-4 border-b border-gray-100 dark:border-white/5">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {initialData ? 'Edit Role' : 'New Custom Role'}
              </h2>
              <p className="text-xs font-bold text-gray-400 tracking-widest mt-1">Permissions</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-8 pt-4 custom-scrollbar flex-1">
            <form id="role-form" onSubmit={handleSubmit} className="space-y-8">
              {errors.general && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {errors.general}
                </div>
              )}
              {/* Name Input */}
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder="Role Name"
                  className={`w-full bg-transparent border-b-2 ${errors.name ? 'border-paymint-red' : 'border-gray-200 dark:border-gray-700'} py-3 text-xl font-bold text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-paymint-green transition-colors`}
                />
                {errors.name && <p className="absolute -bottom-5 left-0 text-xs font-bold text-paymint-red">{errors.name}</p>}
              </div>

              {/* Pos Section */}
              <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden transition-all duration-300">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.02]"
                  onClick={() => setPosAccess(!posAccess)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${posAccess ? 'bg-paymint-green text-white shadow-lg shadow-paymint-green/20' : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/5'}`}>
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">Pos App</h3>
                      <p className="text-xs text-gray-500 max-w-[250px] leading-relaxed">Employees can log in to the app using personal Pin code</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`w-14 h-8 rounded-full transition-all duration-300 relative ${posAccess ? 'bg-paymint-green shadow-inner' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${posAccess ? 'left-[calc(100%-1.75rem)]' : 'left-1'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {posAccess && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 dark:border-white/10"
                    >
                      <div className="p-5 space-y-6">
                        {/* Pos Permissions List */}
                        <div className="space-y-3">
                          {POS_PERMISSIONS.map(perm => (
                            <div
                              key={perm.id}
                              className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                              onClick={() => togglePermission(perm.id)}
                            >
                              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${permissions.includes(perm.id)
                                ? 'bg-paymint-green border-paymint-green shadow-sm'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
                                }`}>
                                {permissions.includes(perm.id) && <Check size={14} className="text-white" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-none">{perm.label}</p>
                                {perm.description && <p className="text-xs text-gray-400 mt-1 font-medium">{perm.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Discounts Section */}
                        <div className="pt-4 border-t border-gray-200 dark:border-white/10" ref={discountsContainerRef}>
                          <div
                            className="flex items-center justify-between py-2 cursor-pointer group"
                            onClick={() => setShowDiscountsDropdown(!showDiscountsDropdown)}
                          >
                            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">Allowed Discounts</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 bg-white dark:bg-white/5 px-2 py-1 rounded-md border border-gray-200 dark:border-white/10">
                                {allDiscountsSelected ? 'All Allowed' : `${allowedDiscounts.length} Selected`}
                              </span>
                              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${showDiscountsDropdown ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          <AnimatePresence>
                            {showDiscountsDropdown && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-2 pt-3 overflow-hidden"
                              >
                                <div
                                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setAllDiscountsSelected(!allDiscountsSelected);
                                    if (!allDiscountsSelected) setAllowedDiscounts([]);
                                  }}
                                >
                                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${allDiscountsSelected
                                    ? 'bg-paymint-green border-paymint-green shadow-sm'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
                                    }`}>
                                    {allDiscountsSelected && <Check size={14} className="text-white" />}
                                  </div>
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow all discounts</p>
                                </div>

                                {!allDiscountsSelected && availableDiscounts.map(discount => (
                                  <div
                                    key={discount.id}
                                    className="flex items-start gap-3 pl-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => toggleDiscount(discount.id)}
                                  >
                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${allowedDiscounts.includes(discount.id)
                                      ? 'bg-paymint-green border-paymint-green shadow-sm'
                                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
                                      }`}>
                                      {allowedDiscounts.includes(discount.id) && <Check size={14} className="text-white" />}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {discount.name} ({discount.percentage * 100}%)
                                    </p>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Back Office Section */}
              <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden transition-all duration-300">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.02]"
                  onClick={() => setBackofficeAccess(!backofficeAccess)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${backofficeAccess ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/5'}`}>
                      <Monitor size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">Back Office</h3>
                      <p className="text-xs text-gray-500 max-w-[250px] leading-relaxed">Employees can log in to the back office using their email and password</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`w-14 h-8 rounded-full transition-all duration-300 relative ${backofficeAccess ? 'bg-paymint-green shadow-inner' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${backofficeAccess ? 'left-[calc(100%-1.75rem)]' : 'left-1'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {backofficeAccess && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 dark:border-white/10"
                    >
                      <div className="p-5 space-y-3">
                        {BACKOFFICE_PERMISSIONS.map(perm => (
                          <div
                            key={perm.id}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => toggleBackofficePermission(perm.id)}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${backofficePermissions.includes(perm.id)
                              ? 'bg-paymint-green border-paymint-green shadow-sm'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
                              }`}>
                              {backofficePermissions.includes(perm.id) && <Check size={14} className="text-white" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-none">{perm.label}</p>
                              {perm.description && <p className="text-xs text-gray-400 mt-1 font-medium">{perm.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-8 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-4 bg-white dark:bg-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-black text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="role-form"
              disabled={isSubmitting}
              className="flex-1 h-14 rounded-xl bg-paymint-green text-black font-black text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                initialData ? 'Save Changes' : 'Create Role'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
