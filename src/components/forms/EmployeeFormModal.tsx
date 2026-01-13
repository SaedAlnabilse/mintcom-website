import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Eye, EyeOff, ShieldCheck, ChevronDown, Check, Tag } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  username: string;
  role: string;
  email?: string;
  employeeId?: string;
  permissions?: string[];
  allowedDiscounts?: string[];
}

interface Discount {
  id: string;
  name: string;
  percentage: number;
  adminOnly: boolean;
}

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onDelete?: (id: string) => void;
  initialData?: StaffMember | null;
  availableDiscounts?: Discount[];

  establishments?: { id: string; name: string }[];
  isSubmitting?: boolean;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'pos', label: 'POS System', description: 'Access to sales screen' },
  { id: 'dashboard', label: 'Dashboard', description: 'View sales summary & analytics' },
  { id: 'reports', label: 'Reports', description: 'View sales reports' },
  { id: 'settings', label: 'Settings', description: 'App configuration' },
  { id: 'inventory', label: 'Inventory', description: 'Manage stock' },
  { id: 'refunds', label: 'Refunds', description: 'Process refunds' },
  { id: 'discounts', label: 'Discounts', description: 'Apply discounts' },
  { id: 'employees', label: 'Manage Employees', description: 'Add/Edit users' },
];

export function EmployeeFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,

  availableDiscounts = [],
  establishments,
  isSubmitting = false,
}: EmployeeFormModalProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allowedDiscounts, setAllowedDiscounts] = useState<string[]>([]);
  const [allDiscountsSelected, setAllDiscountsSelected] = useState(true);

  // Establishment selection for Owner Dashboard
  const [selectedEstablishmentIds, setSelectedEstablishmentIds] = useState<string[]>([]);
  const [establishmentSearch, setEstablishmentSearch] = useState('');
  const [showEstablishmentDropdown, setShowEstablishmentDropdown] = useState(false);

  const [showPermissionsDropdown, setShowPermissionsDropdown] = useState(false); // Default closed on web to save space
  const [showDiscountsDropdown, setShowDiscountsDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setUsername(initialData.username || '');
        setEmail(initialData.email || '');
        setRole(initialData.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER');
        setPassword('');
        setConfirmPassword('');
        setPermissions(initialData.permissions || ['pos']);

        if (initialData.allowedDiscounts && initialData.allowedDiscounts.length > 0) {
          setAllDiscountsSelected(false);
          setAllowedDiscounts(initialData.allowedDiscounts);
          setAllDiscountsSelected(true);
          setAllowedDiscounts([]);
        }

        // If editing an existing employee (initialData), we might need to populate their establishments
        // But the current initialData interface doesn't strictly have establishmentIds array easily accessible in the same way
        // If we are in "Owner Mode" (establishments prop exists), we should try to extract them if available
        // For now, if editing, we might need to pass establishmentIds in initialData if we want to pre-fill it.
        // Assuming initialData might have 'establishmentIds' or we just default to empty if new.
        if ((initialData as any)?.establishmentIds) {
          setSelectedEstablishmentIds((initialData as any).establishmentIds);
        } else if (establishments && establishments.length === 1) {
          // If there is only one establishment, pre-select it
          setSelectedEstablishmentIds([establishments[0].id]);
        } else {
          setSelectedEstablishmentIds([]);
        }

      } else {
        setName('');
        setUsername('');
        setEmail('');
        setRole('USER');
        setPassword('');
        setConfirmPassword('');
        setPermissions(['pos']);
        setAllDiscountsSelected(true);
        setAllowedDiscounts([]);

        // If creating new and there's only one establishment, select it by default
        if (establishments && establishments.length === 1) {
          setSelectedEstablishmentIds([establishments[0].id]);
        } else {
          setSelectedEstablishmentIds([]);
        }
      }
      setShowPermissionsDropdown(false);
      setShowDiscountsDropdown(false);
      setShowEstablishmentDropdown(false);
    }
  }, [isOpen, initialData]);

  const togglePermission = (permissionId: string) => {
    setPermissions(prev => {
      const isRemoving = prev.includes(permissionId);
      let newPermissions = isRemoving
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];

      if (!isRemoving && (permissionId === 'discounts' || permissionId === 'refunds')) {
        if (!newPermissions.includes('pos')) newPermissions.push('pos');
      }
      return newPermissions;
    });
  };

  const toggleDiscount = (discountId: string) => {
    setAllowedDiscounts(prev =>
      prev.includes(discountId)
        ? prev.filter(id => id !== discountId)
        : [...prev, discountId]
    );
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Required';
    if (!username.trim()) newErrors.username = 'Required';
    if (role === 'ADMIN' && !email.trim()) newErrors.email = 'Required';

    if (!initialData && !password) newErrors.password = 'Required';
    if (password && password.length < 5) newErrors.password = 'Min 5 chars';
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate establishment selection if in Owner Mode
    if (establishments && selectedEstablishmentIds.length === 0) {
      newErrors.establishments = 'Select at least one establishment';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const payload: any = {
      name,
      username,
      email: email || undefined,
      role: role.toUpperCase(),
      permissions: role === 'ADMIN' ? AVAILABLE_PERMISSIONS.map(p => p.id) : permissions,

      allowedDiscounts: allDiscountsSelected ? [] : allowedDiscounts,
      establishmentIds: establishments ? selectedEstablishmentIds : undefined,
    };

    if (password) {
      payload.password = password;
    }

    if (!initialData) {
      // Generate mock pin for compatibility
      payload.pinCode = Math.floor(1000 + Math.random() * 9000).toString();
    }

    await onSubmit(payload);
  };

  const discountsForUser = role === 'ADMIN'
    ? availableDiscounts
    : availableDiscounts.filter(d => !d.adminOnly);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#1e1e1e] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'Edit Employee' : 'New Employee'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 pt-2 custom-scrollbar flex-1">
            <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder="e.g. John Doe"
                  className={`w-full bg-gray-50 dark:bg-[#2a2a2a] border ${errors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-700'} rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-paymint-green transition-colors`}
                />
                {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name}</p>}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors({ ...errors, username: '' }); }}
                  placeholder="e.g. johndoe"
                  className={`w-full bg-gray-50 dark:bg-[#2a2a2a] border ${errors.username ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-700'} rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-paymint-green transition-colors`}
                />
                {errors.username && <p className="mt-1 text-xs font-bold text-red-500">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Email {role === 'ADMIN' ? <span className="text-red-500">*</span> : '(Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                  placeholder="e.g. john@example.com"
                  className={`w-full bg-gray-50 dark:bg-[#2a2a2a] border ${errors.email ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-700'} rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-paymint-green transition-colors`}
                />
                {errors.email && <p className="mt-1 text-xs font-bold text-red-500">{errors.email}</p>}
              </div>

              {/* Establishment Selection (Only if establishments prop is provided) */}
              {establishments && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Access <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEstablishmentDropdown(!showEstablishmentDropdown)}
                    className={`w-full bg-gray-50 dark:bg-[#2a2a2a] border ${errors.establishments ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-700'} rounded-xl px-4 py-3 text-left flex items-center justify-between transition-colors`}
                  >
                    <span className={selectedEstablishmentIds.length ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                      {selectedEstablishmentIds.length === 0
                        ? 'Select establishments...'
                        : selectedEstablishmentIds.length === establishments.length
                          ? 'All Establishments'
                          : `${selectedEstablishmentIds.length} location${selectedEstablishmentIds.length === 1 ? '' : 's'} selected`}
                    </span>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${showEstablishmentDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {errors.establishments && <p className="mt-1 text-xs font-bold text-red-500">{errors.establishments}</p>}

                  {/* Dropdown */}
                  {showEstablishmentDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-60 overflow-hidden flex flex-col">
                      {/* Search */}
                      <div className="p-3 border-b border-gray-100 dark:border-white/5">
                        <input
                          type="text"
                          placeholder="Search locations..."
                          value={establishmentSearch}
                          onChange={(e) => setEstablishmentSearch(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0"
                          autoFocus
                        />
                      </div>
                      {/* List */}
                      <div className="overflow-y-auto p-2 custom-scrollbar">
                        {establishments
                          .filter(e => e.name.toLowerCase().includes(establishmentSearch.toLowerCase()))
                          .map(est => {
                            const isSelected = selectedEstablishmentIds.includes(est.id);
                            return (
                              <button
                                key={est.id}
                                type="button"
                                onClick={() => {
                                  setSelectedEstablishmentIds(prev =>
                                    prev.includes(est.id)
                                      ? prev.filter(id => id !== est.id)
                                      : [...prev, est.id]
                                  );
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${isSelected ? 'bg-paymint-green/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                              >
                                <span className={`text-sm font-medium ${isSelected ? 'text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {est.name}
                                </span>
                                {isSelected && <Check size={16} className="text-paymint-green" />}
                              </button>
                            );
                          })}
                        {establishments.filter(e => e.name.toLowerCase().includes(establishmentSearch.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-sm text-gray-500">No locations found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Role <span className="text-red-500">*</span></label>
                <div className="flex bg-white dark:bg-white rounded-xl overflow-hidden border border-gray-200 dark:border-gray-200">
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${role === 'ADMIN' ? 'bg-paymint-green text-black' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    Admin
                  </button>
                  <div className="w-px bg-gray-200" />
                  <button
                    type="button"
                    onClick={() => setRole('USER')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${role === 'USER' ? 'bg-paymint-green text-black' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    User
                  </button>
                </div>
              </div>

              {/* Permissions */}
              {role === 'USER' && (
                <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-colors">
                  <button
                    type="button"
                    onClick={() => setShowPermissionsDropdown(!showPermissionsDropdown)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={20} className="text-paymint-green" />
                      <span className="text-gray-900 dark:text-white font-medium">Permissions</span>
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full ml-2">
                        {permissions.length} selected
                      </span>
                    </div>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${showPermissionsDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showPermissionsDropdown && (
                    <div className="px-4 pb-4 space-y-1">
                      {AVAILABLE_PERMISSIONS.map(perm => {
                        const isLocked = perm.id === 'pos' && (permissions.includes('refunds') || permissions.includes('discounts'));
                        return (
                          <button
                            key={perm.id}
                            type="button"
                            disabled={isLocked}
                            onClick={() => togglePermission(perm.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${permissions.includes(perm.id) ? 'bg-paymint-green/10' : 'hover:bg-gray-100 dark:hover:bg-white/5'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div>
                              <p className={`text-sm font-medium ${permissions.includes(perm.id) ? 'text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}>{perm.label}</p>
                              <p className="text-xs text-gray-500">{perm.description}</p>
                            </div>
                            {permissions.includes(perm.id) && <Check size={16} className="text-paymint-green" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Discounts */}
              {role === 'USER' && permissions.includes('discounts') && discountsForUser.length > 0 && (
                <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-colors">
                  <button
                    type="button"
                    onClick={() => setAllDiscountsSelected(!allDiscountsSelected)}
                    className="w-full flex items-center justify-between p-4 text-left border-b border-gray-200 dark:border-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <Tag size={20} className="text-paymint-green" />
                      <span className="text-gray-900 dark:text-white font-medium">Allowed Discounts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{allDiscountsSelected ? 'All Allowed' : 'Custom'}</span>
                      {allDiscountsSelected && <Check size={16} className="text-paymint-green" />}
                    </div>
                  </button>

                  {!allDiscountsSelected && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowDiscountsDropdown(!showDiscountsDropdown)}
                        className="w-full flex items-center justify-between p-3 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 transition-colors"
                      >
                        <span>Select Specific Discounts ({allowedDiscounts.length})</span>
                        <ChevronDown size={16} className={`transition-transform ${showDiscountsDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showDiscountsDropdown && (
                        <div className="px-4 pb-4 space-y-1">
                          {discountsForUser.map(discount => (
                            <button
                              key={discount.id}
                              type="button"
                              onClick={() => toggleDiscount(discount.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${allowedDiscounts.includes(discount.id) ? 'bg-paymint-green/10' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                              <div>
                                <p className={`text-sm font-medium ${allowedDiscounts.includes(discount.id) ? 'text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}>{discount.name}</p>
                                <p className="text-xs text-gray-500">{(discount.percentage * 100).toFixed(0)}% Off</p>
                              </div>
                              {allowedDiscounts.includes(discount.id) && <Check size={16} className="text-paymint-green" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {initialData ? 'New Password (Optional)' : 'Password'} {(!initialData) && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                    placeholder={initialData ? "Leave blank to keep current" : "Min 5 characters"}
                    className={`w-full bg-gray-50 dark:bg-[#2a2a2a] border ${errors.password ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-700'} rounded-xl px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-paymint-green transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs font-bold text-red-500">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Confirm Password {(!initialData || password) && <span className="text-red-500">*</span>}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }); }}
                  placeholder="Confirm password"
                  className={`w-full bg-gray-50 dark:bg-[#2a2a2a] border ${errors.confirmPassword ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-700'} rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-paymint-green transition-colors`}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs font-bold text-red-500">{errors.confirmPassword}</p>}
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50 dark:bg-[#1e1e1e] transition-colors">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="w-12 h-12 flex items-center justify-center bg-accent/10 text-accent rounded-xl hover:bg-accent/20 transition-colors"
              >
                <Trash2 size={24} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="employee-form"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-paymint-green text-black font-bold hover:bg-paymint-green/90 transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-paymint-green/20"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                initialData ? 'Save' : 'Add'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}



