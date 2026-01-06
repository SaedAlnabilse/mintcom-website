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
        } else {
            setAllDiscountsSelected(true);
            setAllowedDiscounts([]);
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
      }
      setShowPermissionsDropdown(false);
      setShowDiscountsDropdown(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations (basic)
    if (password && password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    const payload: any = {
        name,
        username,
        email: email || undefined,
        role: role.toUpperCase(),
        permissions: role === 'ADMIN' ? AVAILABLE_PERMISSIONS.map(p => p.id) : permissions,
        allowedDiscounts: allDiscountsSelected ? [] : allowedDiscounts,
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
          className="bg-[#1e1e1e] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-2xl font-bold text-white">
              {initialData ? 'Edit Employee' : 'New Employee'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 pt-2 custom-scrollbar flex-1">
            <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. johndoe"
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                <div className="flex bg-white rounded-xl overflow-hidden border border-gray-200">
                    <button
                        type="button"
                        onClick={() => setRole('ADMIN')}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${role === 'ADMIN' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        Admin
                    </button>
                    <div className="w-px bg-gray-200" />
                    <button
                        type="button"
                        onClick={() => setRole('USER')}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors ${role === 'USER' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        User
                    </button>
                </div>
              </div>

              {/* Permissions */}
              {role === 'USER' && (
                  <div className="bg-[#2a2a2a] border border-gray-700 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowPermissionsDropdown(!showPermissionsDropdown)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                          <div className="flex items-center gap-2">
                              <ShieldCheck size={20} className="text-green-500" />
                              <span className="text-white font-medium">Permissions</span>
                              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full ml-2">
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
                                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${permissions.includes(perm.id) ? 'bg-green-500/10' : 'hover:bg-white/5'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                          <div>
                                              <p className={`text-sm font-medium ${permissions.includes(perm.id) ? 'text-green-400' : 'text-gray-300'}`}>{perm.label}</p>
                                              <p className="text-xs text-gray-500">{perm.description}</p>
                                          </div>
                                          {permissions.includes(perm.id) && <Check size={16} className="text-green-500" />}
                                      </button>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              )}

              {/* Discounts */}
              {role === 'USER' && permissions.includes('discounts') && discountsForUser.length > 0 && (
                  <div className="bg-[#2a2a2a] border border-gray-700 rounded-xl overflow-hidden">
                      <button
                          type="button"
                          onClick={() => setAllDiscountsSelected(!allDiscountsSelected)}
                          className="w-full flex items-center justify-between p-4 text-left border-b border-gray-700/50"
                      >
                           <div className="flex items-center gap-2">
                              <Tag size={20} className="text-green-500" />
                              <span className="text-white font-medium">Allowed Discounts</span>
                          </div>
                          <div className="flex items-center gap-2">
                               <span className="text-sm text-gray-400">{allDiscountsSelected ? 'All Allowed' : 'Custom'}</span>
                               {allDiscountsSelected && <Check size={16} className="text-green-500" />}
                          </div>
                      </button>

                      {!allDiscountsSelected && (
                          <div>
                               <button
                                    type="button"
                                    onClick={() => setShowDiscountsDropdown(!showDiscountsDropdown)}
                                    className="w-full flex items-center justify-between p-3 text-xs text-gray-400 hover:text-white px-4"
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
                                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${allowedDiscounts.includes(discount.id) ? 'bg-green-500/10' : 'hover:bg-white/5'}`}
                                            >
                                                <div>
                                                    <p className={`text-sm font-medium ${allowedDiscounts.includes(discount.id) ? 'text-green-400' : 'text-gray-300'}`}>{discount.name}</p>
                                                    <p className="text-xs text-gray-500">{(discount.percentage * 100).toFixed(0)}% Off</p>
                                                </div>
                                                {allowedDiscounts.includes(discount.id) && <Check size={16} className="text-green-500" />}
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
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    {initialData ? 'New Password (Optional)' : 'Password'}
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={initialData ? "Leave blank to keep current" : "Min 5 characters"}
                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                        required={!initialData}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Confirm Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                    required={!initialData && !!password}
                />
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 flex items-center gap-3 bg-[#1e1e1e]">
            {initialData && onDelete && (
                <button
                    type="button"
                    onClick={() => onDelete(initialData.id)}
                    className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                    <Trash2 size={24} />
                </button>
            )}
            <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border border-gray-700 text-gray-300 font-semibold hover:bg-gray-800 transition-colors"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="employee-form"
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
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
