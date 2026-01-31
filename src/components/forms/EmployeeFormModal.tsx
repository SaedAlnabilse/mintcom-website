import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Eye, EyeOff, ChevronDown, Check } from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

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
  customRoleId?: string;
  // Platform access control
  posAccess?: boolean;
  backofficeAccess?: boolean;
  backofficePermissions?: string[];
}

interface CustomRole {
  id: string;
  name: string;
  role: string;
  permissions: string[];
  allowedDiscounts: string[];
  allDiscounts: boolean;
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

const POS_PERMISSIONS = [
  { id: 'accept_payments', label: 'Accept Payments', description: 'Process payments' },
  { id: 'apply_discounts', label: 'Apply Discounts', description: 'Apply discounts to orders' },
  { id: 'change_taxes', label: 'Change Tax', description: 'Change tax rate at checkout' },
  { id: 'open_cash_drawer', label: 'Open Drawer', description: 'Open cash drawer manually' },
  { id: 'view_all_receipts', label: 'View Receipts', description: 'View all past receipts' },
  { id: 'refunds', label: 'Refunds', description: 'Process refunds' },
  { id: 'reprint_receipts', label: 'Reprint', description: 'Reprint receipts' },
  { id: 'inventory', label: 'Manage Items', description: 'Edit menu items' },
  { id: 'view_item_cost', label: 'View Costs', description: 'See item costs' },
  { id: 'settings', label: 'Settings', description: 'Change app settings' },
  { id: 'live_chat', label: 'Support', description: 'Chat with support' },
];

const BACKOFFICE_PERMISSIONS = [
  { id: 'view_reports', label: 'View Reports', description: 'See sales and data' },
  { id: 'manage_items', label: 'Manage Items', description: 'Edit products and inventory' },
  { id: 'view_cost', label: 'View Costs', description: 'See costs and profits' },
  { id: 'manage_employees', label: 'Manage Staff', description: 'Add/edit staff' },
  { id: 'manage_customers', label: 'Manage Customers', description: 'Edit customer info' },
  { id: 'manage_settings', label: 'Settings', description: 'Store settings' },
  { id: 'manage_billing', label: 'Billing', description: 'Payments and plans' },
  { id: 'manage_payment_types', label: 'Payments', description: 'Edit payment methods' },
  { id: 'manage_loyalty', label: 'Loyalty', description: 'Edit loyalty program' },
  { id: 'manage_taxes', label: 'Taxes', description: 'Edit tax rates' },
  { id: 'manage_devices', label: 'Devices', description: 'Manage registers' },
];

export function EmployeeFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  establishments,
  isSubmitting = false,
}: EmployeeFormModalProps) {
  // Get current establishment from context (for dashboard-level pages)
  const { currentEstablishment } = useAuth();

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
  const [backofficePermissions, setBackofficePermissions] = useState<string[]>([]); // New state
  const [allowedDiscounts, setAllowedDiscounts] = useState<string[]>([]);
  const [allDiscountsSelected, setAllDiscountsSelected] = useState(true);

  // Establishment selection for Owner Dashboard
  const [selectedEstablishmentIds, setSelectedEstablishmentIds] = useState<string[]>([]);
  const [establishmentSearch, setEstablishmentSearch] = useState('');
  const [showEstablishmentDropdown, setShowEstablishmentDropdown] = useState(false);

  // Custom Roles
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [selectedCustomRoleId, setSelectedCustomRoleId] = useState<string>('');
  const [lastAppliedTemplate, setLastAppliedTemplate] = useState<CustomRole | null>(null);
  const [showRolesDropdown, setShowRolesDropdown] = useState(false);

  // Platform Access Control
  const [posAccess, setPosAccess] = useState(true);
  const [backofficeAccess, setBackofficeAccess] = useState(false);

  const fetchCustomRoles = async () => {
    // Determine establishment ID - from prop or from context
    let estId: string | undefined;

    // 1. If editing, use the employee's assigned establishment
    if (initialData?.establishmentIds && initialData.establishmentIds.length > 0) {
      estId = initialData.establishmentIds[0];
    }
    // 2. If in Dashboard mode, use current establishment
    else if (currentEstablishment) {
      estId = currentEstablishment.id;
    }
    // 3. Fallback for new employee in Owner mode (use first available)
    else if (establishments && establishments.length > 0) {
      estId = establishments[0].id;
    }

    if (!estId) return;

    try {
      const response = await api.get(`/api/custom-roles/${estId}`);
      setCustomRoles(response.data || []);
    } catch (error) {
      console.error('Error fetching custom roles:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomRoles();
      if (initialData) {
        setName(initialData.name || '');
        setUsername(initialData.username || '');
        setEmail(initialData.email || '');
        setPhone(initialData.phone || '');
        setRole(initialData.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER');
        setPassword('');
        setConfirmPassword('');
        setPermissions(initialData.permissions || ['accept_payments', 'apply_discounts', 'refunds']);
        setBackofficePermissions(initialData.backofficePermissions || []);
        setSelectedCustomRoleId(initialData.customRoleId || '');
        // Platform access control
        setPosAccess(initialData.posAccess !== false); // Default to true
        setBackofficeAccess(initialData.backofficeAccess || false);

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
        setPermissions(['accept_payments', 'apply_discounts', 'refunds']);
        setBackofficePermissions([]);
        setAllDiscountsSelected(true);
        setAllowedDiscounts([]);
        setSelectedCustomRoleId('');
        setLastAppliedTemplate(null);
        // Platform access control - defaults for new employees
        setPosAccess(true);
        setBackofficeAccess(false);

        // If creating new and there's only one establishment, select it by default
        if (establishments && establishments.length === 1) {
          setSelectedEstablishmentIds([establishments[0].id]);
        } else {
          setSelectedEstablishmentIds([]);
        }
      }
      setShowEstablishmentDropdown(false);
      setShowRolesDropdown(false);
    }
  }, [isOpen, initialData]);

  const handleTemplateSelect = (roleTemplate: CustomRole) => {
    // Safely determine the role type
    const roleType = roleTemplate.role && roleTemplate.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
    setRole(roleType);

    setPermissions(roleTemplate.permissions || []);
    setBackofficePermissions(roleTemplate.backofficePermissions || []);
    setAllDiscountsSelected(roleTemplate.allDiscounts);
    setAllowedDiscounts(roleTemplate.allowedDiscounts || []);
    setSelectedCustomRoleId(roleTemplate.id);
    setLastAppliedTemplate(roleTemplate);

    // Sync access control from template
    setPosAccess(roleTemplate.posAccess !== false);
    setBackofficeAccess(roleTemplate.backofficeAccess || false);

    setShowRolesDropdown(false);
  };

  const isModifiedFromTemplate = () => {
    if (!lastAppliedTemplate) return false;

    const permissionsMatch = JSON.stringify([...permissions].sort()) === JSON.stringify([...lastAppliedTemplate.permissions].sort());
    const backofficePermissionsMatch = JSON.stringify([...backofficePermissions].sort()) === JSON.stringify([...(lastAppliedTemplate.backofficePermissions || [])].sort());
    const discountsMatch = allDiscountsSelected === lastAppliedTemplate.allDiscounts &&
      JSON.stringify([...allowedDiscounts].sort()) === JSON.stringify([...(lastAppliedTemplate.allowedDiscounts || [])].sort());

    // Safety check for role match
    const templateRole = lastAppliedTemplate.role ? lastAppliedTemplate.role.toUpperCase() : 'USER';
    const currentRole = role ? role.toUpperCase() : 'USER';
    const roleMatch = currentRole === templateRole;

    const accessMatch = posAccess === (lastAppliedTemplate.posAccess !== false) &&
      backofficeAccess === (lastAppliedTemplate.backofficeAccess || false);

    return !permissionsMatch || !backofficePermissionsMatch || !discountsMatch || !roleMatch || !accessMatch;
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

    // Validate role selection - must be ADMIN or have a custom role selected
    if (role !== 'ADMIN' && !selectedCustomRoleId) {
      newErrors.role = 'Please select a role';
    }

    if (!initialData && !password) newErrors.password = 'Required';
    if (password && password.length < 5) newErrors.password = 'Min 5 chars';
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate establishment selection if in Owner Mode
    if (establishments && selectedEstablishmentIds.length === 0) {
      newErrors.establishments = 'Select at least one location';
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
      permissions: role === 'ADMIN' ? POS_PERMISSIONS.map(p => p.id) : permissions,
      customRoleId: selectedCustomRoleId || undefined,
      allowedDiscounts: allDiscountsSelected ? [] : allowedDiscounts,
      establishmentIds: establishments ? selectedEstablishmentIds : undefined,
      // Platform access control
      posAccess,
      backofficeAccess,
      backofficePermissions: backofficeAccess ? backofficePermissions : [],
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#1E293B] w-[90vw] max-w-lg rounded-[2rem] overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 pb-4 border-b border-gray-100 dark:border-white/5">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {initialData ? 'Edit Employee' : 'New Employee'}
              </h2>
              <p className="text-xs font-bold text-gray-400 tracking-widest mt-1">Staff</p>
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
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                  Name <span className="text-paymint-red">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder="E.g. John Doe"
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                />
                {errors.name && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.name}</p>}
              </div>

              {/* Username */}
              <div>
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                  Username <span className="text-paymint-red">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors({ ...errors, username: '' }); }}
                  placeholder="E.g. johndoe"
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.username ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                />
                {errors.username && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                  Email {role === 'ADMIN' ? <span className="text-paymint-red">*</span> : '(Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                  placeholder="E.g. name@email.com"
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.email ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                />
                {errors.email && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="E.g. +1 234 567 8900"
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors"
                />
              </div>

              {/* Establishment Selection (Only if establishments prop is provided) */}
              {establishments && (
                <div className="relative">
                  <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                    Access <span className="text-paymint-red">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEstablishmentDropdown(!showEstablishmentDropdown)}
                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.establishments ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-left flex items-center justify-between transition-colors`}
                  >
                    <span className={`text-sm font-bold ${selectedEstablishmentIds.length ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                      {selectedEstablishmentIds.length === 0
                        ? 'Select location...'
                        : selectedEstablishmentIds.length === establishments.length
                          ? 'All Locations'
                          : `${selectedEstablishmentIds.length} Location${selectedEstablishmentIds.length === 1 ? '' : 's'}`}
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
                          <div className="p-4 text-center text-xs font-bold text-gray-500">No Locations Found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role Selection - Now uses Role Template dropdown */}
              <div className="relative">
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center justify-between">
                  <span className="flex items-center gap-1">Role <span className="text-paymint-red">*</span></span>
                  {isModifiedFromTemplate() && (
                    <span className="text-paymint-red lowercase font-bold tracking-normal">(Modified)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setShowRolesDropdown(!showRolesDropdown)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-left flex items-center justify-between transition-colors"
                >
                  <span className={`text-sm font-bold ${(selectedCustomRoleId || role === 'ADMIN') ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {role === 'ADMIN'
                      ? 'Admin (Full Access)'
                      : selectedCustomRoleId
                        ? customRoles.find(r => r.id === selectedCustomRoleId)?.name || 'Select Role...'
                        : 'Select Role...'}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showRolesDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showRolesDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl z-30 max-h-60 overflow-y-auto custom-scrollbar shadow-2xl">
                    <div className="p-2">
                      {/* Admin Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setRole('ADMIN');
                          setSelectedCustomRoleId('');
                          setLastAppliedTemplate(null);
                          setPermissions(POS_PERMISSIONS.map(p => p.id));
                          setBackofficePermissions(BACKOFFICE_PERMISSIONS.map(p => p.id));
                          setAllDiscountsSelected(true);
                          setShowRolesDropdown(false);
                          setPosAccess(true);
                          setBackofficeAccess(true);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${role === 'ADMIN' ? 'bg-purple-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                        <div>
                          <span className={`text-xs font-bold ${role === 'ADMIN' ? 'text-purple-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            Admin (Full Access)
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">All permissions enabled</p>
                        </div>
                        {role === 'ADMIN' && <Check size={14} className="text-purple-500" />}
                      </button>

                      {/* Divider */}
                      {customRoles.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-white/5 my-2" />
                      )}

                      {/* Custom Roles */}
                      {customRoles.map(customRole => (
                        <button
                          key={customRole.id}
                          type="button"
                          onClick={() => handleTemplateSelect(customRole)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${selectedCustomRoleId === customRole.id && role !== 'ADMIN' ? 'bg-paymint-green/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                          <div>
                            <span className={`text-xs font-bold ${selectedCustomRoleId === customRole.id && role !== 'ADMIN' ? 'text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}>
                              {customRole.name}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">{customRole.permissions.length} Permissions</p>
                          </div>
                          {selectedCustomRoleId === customRole.id && role !== 'ADMIN' && <Check size={14} className="text-paymint-green" />}
                        </button>
                      ))}

                      {/* No custom roles message */}
                      {customRoles.length === 0 && (
                        <div className="p-3 text-center">
                          <p className="text-xs text-gray-500">No Roles</p>
                          <p className="text-xs text-gray-400 mt-1">Create roles in settings</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {errors.role && (
                  <p className="text-paymint-red text-xs font-bold mt-2">{errors.role}</p>
                )}
              </div>

              {/* Password wrapper start (to match existing indentation/structure) */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
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
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
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
              className="flex-1 h-14 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-black text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="employee-form"
              disabled={isSubmitting}
              className="flex-1 h-14 rounded-xl bg-paymint-green text-black font-black text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
