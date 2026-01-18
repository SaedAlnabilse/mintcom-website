import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Eye, EyeOff, ShieldCheck, ChevronDown, Check, Tag } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  username: string;
  role: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  permissions?: string[];
  allowedDiscounts?: string[];
  establishmentIds?: string[];
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
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('USER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        setPhone(initialData.phone || '');
        setRole(initialData.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER');
        setPassword('');
        setConfirmPassword('');
        setPermissions(initialData.permissions || ['pos', 'discounts', 'refunds']);

        if (initialData.allowedDiscounts && initialData.allowedDiscounts.length > 0) {
          setAllDiscountsSelected(false);
          setAllowedDiscounts(initialData.allowedDiscounts);
        } else {
          setAllDiscountsSelected(true);
          setAllowedDiscounts([]);
        }

        // Populate establishments from initialData if available
        if (initialData.establishmentIds && initialData.establishmentIds.length > 0) {
          setSelectedEstablishmentIds(initialData.establishmentIds);
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
        setPhone('');
        setRole('USER');
        setPassword('');
        setConfirmPassword('');
        setPermissions(['pos', 'discounts', 'refunds']);
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

    // Split name into first and last name
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.slice(1).join(' ');

    const payload: any = {
      firstName,
      ...(lastName && { lastName }),
      username,
      email: email || undefined,
      phone: phone || undefined,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-[2rem] overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 pb-4 border-b border-gray-100 dark:border-white/5">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                {initialData ? 'Edit Employee' : 'New Employee'}
              </h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Workforce Access</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-8 pt-4 custom-scrollbar flex-1">
            <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Name */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                  Full Name <span className="text-paymint-red">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder="e.g. John Doe"
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                />
                {errors.name && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.name}</p>}
              </div>

              {/* Username */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                  Username <span className="text-paymint-red">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors({ ...errors, username: '' }); }}
                  placeholder="e.g. johndoe"
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.username ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                />
                {errors.username && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                  Email {role === 'ADMIN' ? <span className="text-paymint-red">*</span> : '(Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                  placeholder="e.g. john@example.com"
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.email ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                />
                {errors.email && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 234 567 8900"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors"
                />
              </div>

              {/* Establishment Selection (Only if establishments prop is provided) */}
              {establishments && (
                <div className="relative">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                    Access <span className="text-paymint-red">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEstablishmentDropdown(!showEstablishmentDropdown)}
                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.establishments ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-left flex items-center justify-between transition-colors`}
                  >
                    <span className={`text-sm font-bold ${selectedEstablishmentIds.length ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                      {selectedEstablishmentIds.length === 0
                        ? 'Select establishments...'
                        : selectedEstablishmentIds.length === establishments.length
                          ? 'All Establishments'
                          : `${selectedEstablishmentIds.length} location${selectedEstablishmentIds.length === 1 ? '' : 's'} selected`}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${showEstablishmentDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {errors.establishments && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.establishments}</p>}

                  {/* Dropdown */}
                  {showEstablishmentDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl z-20 max-h-60 overflow-hidden flex flex-col shadow-2xl">
                      {/* Search */}
                      <div className="p-3 border-b border-gray-100 dark:border-white/5">
                        <input
                          type="text"
                          placeholder="Search locations..."
                          value={establishmentSearch}
                          onChange={(e) => setEstablishmentSearch(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-lg px-3 py-2 text-xs font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0"
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
                                <span className={`text-xs font-bold ${isSelected ? 'text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {est.name}
                                </span>
                                {isSelected && <Check size={14} className="text-paymint-green" />}
                              </button>
                            );
                          })}
                        {establishments.filter(e => e.name.toLowerCase().includes(establishmentSearch.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-xs font-bold text-gray-500">No locations found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                  Role <span className="text-paymint-red">*</span>
                </label>
                <div className="flex bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${role === 'ADMIN' ? 'bg-paymint-green text-black shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('USER')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${role === 'USER' ? 'bg-paymint-green text-black shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    User
                  </button>
                </div>
              </div>

              {/* Permissions */}
              {role === 'USER' && (
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors">
                  <button
                    type="button"
                    onClick={() => setShowPermissionsDropdown(!showPermissionsDropdown)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-paymint-green" />
                      <span className="text-xs font-black uppercase tracking-wide text-gray-900 dark:text-white">Permissions</span>
                      <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-md ml-2">
                        {permissions.length} selected
                      </span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${showPermissionsDropdown ? 'rotate-180' : ''}`} />
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
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${permissions.includes(perm.id) ? 'bg-paymint-green/10' : 'hover:bg-white dark:hover:bg-white/5'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div>
                              <p className={`text-xs font-bold ${permissions.includes(perm.id) ? 'text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}>{perm.label}</p>
                              <p className="text-[10px] text-gray-500 font-medium">{perm.description}</p>
                            </div>
                            {permissions.includes(perm.id) && <Check size={14} className="text-paymint-green" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Discounts */}
              {role === 'USER' && permissions.includes('discounts') && discountsForUser.length > 0 && (
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors">
                  <button
                    type="button"
                    onClick={() => setAllDiscountsSelected(!allDiscountsSelected)}
                    className="w-full flex items-center justify-between p-4 text-left border-b border-gray-200 dark:border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <Tag size={18} className="text-paymint-green" />
                      <span className="text-xs font-black uppercase tracking-wide text-gray-900 dark:text-white">Allowed Discounts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{allDiscountsSelected ? 'All Allowed' : 'Custom'}</span>
                      {allDiscountsSelected && <Check size={14} className="text-paymint-green" />}
                    </div>
                  </button>

                  {!allDiscountsSelected && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowDiscountsDropdown(!showDiscountsDropdown)}
                        className="w-full flex items-center justify-between p-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 transition-colors uppercase tracking-wide"
                      >
                        <span>Select Specific Discounts ({allowedDiscounts.length})</span>
                        <ChevronDown size={14} className={`transition-transform ${showDiscountsDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showDiscountsDropdown && (
                        <div className="px-4 pb-4 space-y-1">
                          {discountsForUser.map(discount => (
                            <button
                              key={discount.id}
                              type="button"
                              onClick={() => toggleDiscount(discount.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${allowedDiscounts.includes(discount.id) ? 'bg-paymint-green/10' : 'hover:bg-white dark:hover:bg-white/5'}`}
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
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                  {initialData ? 'New Password (Optional)' : 'Password'} {(!initialData) && <span className="text-paymint-red">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                    placeholder={initialData ? "Leave blank to keep current" : "Min 5 characters"}
                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.password ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 pr-12 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.password}</p>}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                  Confirm Password {(!initialData || password) && <span className="text-paymint-red">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }); }}
                    placeholder="Confirm password"
                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.confirmPassword ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 pr-12 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.confirmPassword}</p>}
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-8 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-4 bg-white dark:bg-[#1E293B]">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="w-14 h-14 flex items-center justify-center bg-paymint-red/10 text-paymint-red rounded-xl hover:bg-paymint-red/20 transition-colors border border-paymint-red/20"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="employee-form"
              disabled={isSubmitting}
              className="flex-1 h-14 rounded-xl bg-paymint-green text-black font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                initialData ? 'Save Changes' : 'Add Employee'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}




