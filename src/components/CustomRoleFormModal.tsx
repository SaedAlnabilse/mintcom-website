import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Check, Info } from 'lucide-react';
import api from '../config/api';
import { QuickInfo } from './QuickInfo';
import {
  POS_PERMISSIONS as CANONICAL_POS_PERMISSIONS,
  BACKOFFICE_PERMISSIONS as CANONICAL_BACKOFFICE_PERMISSIONS,
  normalizePermissions,
} from '../config/permissions';
import { useScrollLock } from '../hooks/useScrollLock';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';

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
  onSubmit: (data: Omit<CustomRole, 'id'>) => Promise<void>;
  initialData?: CustomRole | null;
  isSubmitting?: boolean;
}

interface PermissionItem {
  id: string;
  label: string;
  description: string;
}

const BACKOFFICE_DEFAULT_PERMISSION_IDS = [
  'dashboard',
  'view_orders',
] as const;
const LEGACY_AUTO_DEFAULT_BACKOFFICE_IDS = [
  'dashboard',
  'view_orders',
  'view_reports',
] as const;
const LEGACY_AUTO_DEFAULT_BACKOFFICE_SET = new Set<string>(
  LEGACY_AUTO_DEFAULT_BACKOFFICE_IDS,
);

const ALLOWED_POS_PERMISSION_IDS: Set<string> = new Set(CANONICAL_POS_PERMISSIONS.map(({ id }) => id));
const ALLOWED_BACKOFFICE_PERMISSION_IDS: Set<string> = new Set([
  ...CANONICAL_BACKOFFICE_PERMISSIONS.map(({ id }) => id),
  ...BACKOFFICE_DEFAULT_PERMISSION_IDS,
]);
const SETTINGS_SUB_PERMISSION_IDS = new Set([
  'manage_establishment_profile',
  'manage_tax_currency',
  'manage_receipt_settings',
  'delete_establishment',
]);
const BASIC_POS_ASSIGNABLE_PERMISSION_IDS = new Set([
  'pos',
  'void_items',
  'open_cash_drawer',
  'change_taxes',
  'pay_in_pay_out',
  'dashboard',
  'view_shift_reports',
  'restock_items',
  'manage_open_tickets',
  'refunds',
  'discounts',
  'loyalty_system_access',
  'reprint_receipts',
  'live_chat',
]);

const normalizePermissionList = (values: string[] | undefined): string[] => {
  if (!Array.isArray(values)) return [];
  return normalizePermissions(values);
};

const normalizeAndFilterPermissions = (
  values: string[] | undefined,
  allowedPermissions: Set<string>,
): string[] => normalizePermissionList(values).filter((permission) => allowedPermissions.has(permission));

const normalizePermissionId = (permissionId: string): string => {
  const normalized = normalizePermissions([permissionId]);
  return normalized[0] || permissionId.trim().toLowerCase();
};

export function CustomRoleFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}: CustomRoleFormModalProps) {
  const { t } = useTranslation();
  const { account } = useAuth();
  const normalizedCurrentPermissionSet = useMemo(() => {
    const accountPermissions = Array.isArray(account?.permissions)
      ? account.permissions
      : [];
    const accountBackofficePermissions = Array.isArray(
      (account as any)?.backofficePermissions,
    )
      ? (account as any).backofficePermissions
      : [];

    return new Set(
      normalizePermissions(
        [...accountPermissions, ...accountBackofficePermissions] as string[],
      ),
    );
  }, [account]);
  const canAssignAdminRole = normalizedCurrentPermissionSet.has('*');

  const canAssignAdvancedPermission = useCallback(
    (permissionId: string): boolean =>
      canAssignAdminRole ||
      normalizedCurrentPermissionSet.has(normalizePermissionId(permissionId)),
    [canAssignAdminRole, normalizedCurrentPermissionSet],
  );

  const DEFAULT_BACKOFFICE_PERMISSION_IDS = useMemo(
    () =>
      [...BACKOFFICE_DEFAULT_PERMISSION_IDS].filter((permission) =>
        canAssignAdvancedPermission(permission),
      ),
    [canAssignAdvancedPermission],
  );

  const sanitizeAssignablePosPermissions = useCallback(
    (requestedPermissions: string[] | undefined): string[] => {
      if (!Array.isArray(requestedPermissions)) return [];

      const seen = new Set<string>();
      const result: string[] = [];
      for (const permission of requestedPermissions) {
        const normalized = normalizePermissionId(permission);
        const canAssign =
          canAssignAdminRole ||
          BASIC_POS_ASSIGNABLE_PERMISSION_IDS.has(normalized) ||
          normalizedCurrentPermissionSet.has(normalized);

        if (canAssign && !seen.has(normalized)) {
          seen.add(normalized);
          result.push(normalized);
        }
      }
      return result;
    },
    [canAssignAdminRole, normalizedCurrentPermissionSet],
  );

  const sanitizeAssignableBackofficePermissions = useCallback(
    (requestedPermissions: string[] | undefined): string[] => {
      if (!Array.isArray(requestedPermissions)) return [];

      const seen = new Set<string>();
      const result: string[] = [];
      for (const permission of requestedPermissions) {
        const normalized = normalizePermissionId(permission);
        const canAssign =
          ALLOWED_BACKOFFICE_PERMISSION_IDS.has(normalized) &&
          canAssignAdvancedPermission(normalized);

        if (canAssign && !seen.has(normalized)) {
          seen.add(normalized);
          result.push(normalized);
        }
      }

      return result;
    },
    [canAssignAdvancedPermission],
  );

  const buildEffectiveBackofficePermissions = useCallback(
    (requestedPermissions: string[] | undefined, accessEnabled: boolean): string[] => {
      if (!accessEnabled) return [];

      const requested = normalizeAndFilterPermissions(
        requestedPermissions,
        ALLOWED_BACKOFFICE_PERMISSION_IDS,
      );
      const sanitizedRequested =
        sanitizeAssignableBackofficePermissions(requested);
      const sanitizedRequestedSet = new Set(sanitizedRequested);

      // Legacy compatibility:
      // older versions auto-injected view_reports as a hidden default.
      // If a role only contains that historical auto-default trio, normalize
      // it back to the current 2-default behavior.
      const hasOnlyLegacyAutoDefaults =
        sanitizedRequested.length > 0 &&
        sanitizedRequested.every((permission) =>
          LEGACY_AUTO_DEFAULT_BACKOFFICE_SET.has(permission),
        ) &&
        LEGACY_AUTO_DEFAULT_BACKOFFICE_IDS.every((permission) =>
          sanitizedRequestedSet.has(permission),
        );

      const normalizedRequested = hasOnlyLegacyAutoDefaults
        ? sanitizedRequested.filter((permission) => permission !== 'view_reports')
        : sanitizedRequested;

      return Array.from(
        new Set([
          ...normalizedRequested,
          ...DEFAULT_BACKOFFICE_PERMISSION_IDS,
        ]),
      );
    },
    [
      DEFAULT_BACKOFFICE_PERMISSION_IDS,
      sanitizeAssignableBackofficePermissions,
    ],
  );

  const POS_PERMISSIONS = useMemo<PermissionItem[]>(() => {
    return CANONICAL_POS_PERMISSIONS.map((permission) => ({
      id: permission.id,
      label: t(`staff.permissions.pos_list.${permission.id}`, { defaultValue: permission.label }),
      description: t(`staff.permissions.descriptions.${permission.id}`, { defaultValue: permission.description }),
    }));
  }, [t]);

  const BACKOFFICE_PERMISSIONS = useMemo<PermissionItem[]>(() => {
    return CANONICAL_BACKOFFICE_PERMISSIONS
      .filter(p => !['manage_establishment_profile', 'manage_tax_currency', 'manage_receipt_settings', 'delete_establishment'].includes(p.id))
      .filter(p => canAssignAdvancedPermission(p.id))
      .map((permission) => ({
        id: permission.id,
        label: permission.label,
        description: permission.label, // Make them work as the text is distribution/description
      }));
  }, [canAssignAdvancedPermission]);

  const SETTINGS_SUB_PERMISSIONS = useMemo<PermissionItem[]>(() => {
    return CANONICAL_BACKOFFICE_PERMISSIONS
      .filter(p => ['manage_establishment_profile', 'manage_tax_currency', 'manage_receipt_settings', 'delete_establishment'].includes(p.id))
      .filter(p => canAssignAdvancedPermission(p.id))
      .map((permission) => ({
        id: permission.id,
        label: permission.label,
        description: permission.description,
      }));
  }, [canAssignAdvancedPermission]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [baseRole, setBaseRole] = useState<CustomRole['baseRole']>('USER');
  const [errors, setErrors] = useState<Record<string, string>>({});

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


  const fetchDiscounts = async () => {
    try {
      const response = await api.get('/app-settings/discounts');
      setAvailableDiscounts(response.data || []);
    } catch {
      console.error('Failed to load discounts');
    }
  };

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
        setBaseRole(initialData.baseRole || 'USER');
        setPosAccess(initialData.posAccess !== false); // Default true
        setBackofficeAccess(initialData.backofficeAccess || false);
        setPermissions(
          sanitizeAssignablePosPermissions(
            normalizeAndFilterPermissions(
              initialData.permissions,
              ALLOWED_POS_PERMISSION_IDS,
            ),
          ),
        );
        setBackofficePermissions(
          buildEffectiveBackofficePermissions(
            normalizeAndFilterPermissions(
              initialData.backofficePermissions,
              ALLOWED_BACKOFFICE_PERMISSION_IDS,
            ),
            initialData.backofficeAccess || false,
          ),
        );
        setAllowedDiscounts(initialData.allowedDiscounts || []);
        setAllDiscountsSelected(initialData.allowedDiscounts?.length === 0);
        setShowDiscountsDropdown((initialData.allowedDiscounts?.length || 0) > 0);
      } else {
        // Defaults for new role
        setName('');
        setBaseRole('USER');
        setPosAccess(true);
        setBackofficeAccess(false);
        setPermissions(
          sanitizeAssignablePosPermissions(
            POS_PERMISSIONS.map((permission) => permission.id),
          ),
        );
        setBackofficePermissions([]);
        setAllowedDiscounts([]);
        setAllDiscountsSelected(true);
        setShowDiscountsDropdown(false);
      }
      setErrors({});
    }
  }, [
    initialData,
    isOpen,
    DEFAULT_BACKOFFICE_PERMISSION_IDS,
    POS_PERMISSIONS,
    buildEffectiveBackofficePermissions,
    sanitizeAssignablePosPermissions,
  ]);

  const togglePermission = (permissionId: string) => {
    const isCurrentlySelected = permissions.includes(permissionId);
    const isEnabling = !isCurrentlySelected;

    setPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );

    // If discounts permission is enabled, reveal discounts chooser and scroll to it.
    if (permissionId === 'discounts' && isEnabling) {
      setAllDiscountsSelected(false);
      setShowDiscountsDropdown(true);
      setTimeout(() => {
        discountsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }

    // If discounts permission is disabled, hide/reset the discounts chooser.
    if (permissionId === 'discounts' && !isEnabling) {
      setShowDiscountsDropdown(false);
      setAllDiscountsSelected(true);
      setAllowedDiscounts([]);
    }
  };

  const toggleBackofficePermission = (permissionId: string) => {
    if (!canAssignAdvancedPermission(permissionId)) {
      return;
    }

    setBackofficePermissions(prev => {
      const isSelected = prev.includes(permissionId);
      const isSettingsParent = permissionId === 'manage_settings';
      const isSettingsChild = SETTINGS_SUB_PERMISSION_IDS.has(permissionId);

      if (isSelected) {
        if (isSettingsParent) {
          return prev.filter(
            (permission) =>
              permission !== 'manage_settings' &&
              !SETTINGS_SUB_PERMISSION_IDS.has(permission),
          );
        }
        return prev.filter((permission) => permission !== permissionId);
      }

      const next = [...prev, permissionId];
      if (
        isSettingsChild &&
        !next.includes('manage_settings') &&
        canAssignAdvancedPermission('manage_settings')
      ) {
        next.push('manage_settings');
      }

      return Array.from(new Set(next));
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

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t('common.required');

    // Validation: At least one permission must be enabled or posAccess implies defaults
    const finalPermissions = posAccess
      ? sanitizeAssignablePosPermissions(
          normalizeAndFilterPermissions(permissions, ALLOWED_POS_PERMISSION_IDS),
        )
      : [];
    const effectiveBackofficePermissions = buildEffectiveBackofficePermissions(
      backofficePermissions,
      backofficeAccess,
    );

    if (finalPermissions.length === 0 && effectiveBackofficePermissions.length === 0 && !posAccess) {
      newErrors.general = t('roles.validation.atLeastOnePermission');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the first field that has an error
      setTimeout(() => {
        const firstErrorField = scrollRef.current?.querySelector('.border-paymint-red, .ring-paymint-red\\/20');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    const payload: Omit<CustomRole, 'id'> = {
      name: name.trim(),
      baseRole,
      permissions: posAccess ? Array.from(new Set([...finalPermissions, 'pos', 'void_items'])) : [],
      allowedDiscounts: allDiscountsSelected ? [] : allowedDiscounts,
      // Access Control
      posAccess,
      backofficeAccess,
      backofficePermissions: backofficeAccess 
        ? effectiveBackofficePermissions
        : [],
    };

    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
        className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans"
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col border border-gray-200 dark:border-white/10"
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 border-b border-gray-100 dark:border-white/5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {initialData ? t('roles.editRole') : t('roles.newRole')} | {t('roles.permissions')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-4 sm:p-8 pt-4 custom-scrollbar flex-1 pb-safe">
            <form id="role-form" onSubmit={handleSubmit} className="space-y-8">
              {errors.general && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {errors.general}
                </div>
              )}

              {/* Role Setup Help Info */}
              <div className="px-4 py-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Info size={14} strokeWidth={2.5} />
                </div>
                <p className="text-xs sm:text-sm text-blue-700/80 dark:text-blue-300/80 font-medium leading-relaxed">
                  {t('roles.form.roleSetupHelp')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Name Input */}
                <div className="relative space-y-2">
                  <label className="label-strong block">{formatInputLabel(t('roles.form.roleNameLabel'), t('common.locale'))}</label>
                  <input maxLength={255}
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                    placeholder={formatInputPlaceholder(t('roles.form.roleNamePlaceholder'), t('common.locale'))}
                    className={`w-full bg-transparent border-b-2 ${errors.name ? 'border-paymint-red' : 'border-gray-200 dark:border-gray-700'} py-2 text-lg font-bold text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-paymint-green transition-colors`}
                  />
                  {errors.name && <p className="absolute -bottom-5 left-0 text-xs font-bold text-paymint-red">{errors.name}</p>}
                </div>

                {/* Base Role Selection */}
                <div className="relative space-y-2">
                  <label className="label-strong block">{formatInputLabel(t('roles.form.baseRoleLabel'), t('common.locale'))}</label>
                  <select
                    value={baseRole}
                    onChange={(e) => setBaseRole(e.target.value as CustomRole['baseRole'])}
                    className="w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 py-2 text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:border-paymint-green transition-colors appearance-none cursor-pointer"
                  >
                    <option value="USER" className="dark:bg-[#1E293B]">{t('staff.roles.user')}</option>
                    <option value="CASHIER" className="dark:bg-[#1E293B]">{t('staff.roles.cashier')}</option>
                    <option value="MANAGER" className="dark:bg-[#1E293B]">{t('staff.roles.manager')}</option>
                  </select>
                  <div className={`absolute bottom-3 ${t('common.locale') === 'ar' ? 'left-2' : 'right-2'} pointer-events-none text-gray-400`}>
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>

              {/* Pos Section */}
              <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden transition-all duration-300">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.02]"
                  onClick={() => setPosAccess(!posAccess)}
                >
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      {t('roles.pos.title')}
                      <QuickInfo text={t('roles.pos.defaultSalesInfo', { defaultValue: 'Sales screen access is included by default when this section is enabled.' })} />
                    </h3>
                    <p className="text-xs text-gray-500 max-w-[250px] leading-relaxed">{t('roles.pos.description')}</p>
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
                        {/* POS Defaults Info */}
                        <div className="px-3 py-2.5 rounded-xl bg-paymint-green/5 border border-paymint-green/10 flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-paymint-green/10 text-paymint-green flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-paymint-green uppercase tracking-wider mb-0.5">{t('roles.form.includedByDefault')}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                              {t('roles.pos.includedDefaults')}
                            </p>
                          </div>
                        </div>

                        {/* Pos Permissions List */}
                        <div className="space-y-3">
                          {POS_PERMISSIONS.map(perm => (
                            <div
                              key={perm.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                              onClick={() => togglePermission(perm.id)}
                            >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${permissions.includes(perm.id)
                                ? 'bg-paymint-green border-paymint-green shadow-sm'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
                                }`}>
                                {permissions.includes(perm.id) && <Check size={14} className="text-white" />}
                              </div>
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-none">{perm.label}</p>
                                {perm.description && 
                                 perm.description.toLowerCase().trim() !== perm.label.toLowerCase().trim() && 
                                 perm.description.toLowerCase().replace(/[^a-z0-9]/g, '') !== perm.label.toLowerCase().replace(/[^a-z0-9]/g, '') && (
                                  <QuickInfo text={perm.description} />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Discounts Section */}
                        {permissions.includes('discounts') && (
                          <div className="pt-4 border-t border-gray-200 dark:border-white/10" ref={discountsContainerRef}>
                            <div
                              className="flex items-center justify-between py-2 cursor-pointer group"
                              onClick={() => setShowDiscountsDropdown(!showDiscountsDropdown)}
                            >
                              <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">{t('roles.form.allowedDiscounts')}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500 bg-white dark:bg-white/5 px-2 py-1 rounded-md border border-gray-200 dark:border-white/10">
                                  {allDiscountsSelected ? t('roles.form.allAllowed') : t('roles.form.selectedCount', { count: allowedDiscounts.length })}
                                </span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${showDiscountsDropdown ? 'rotate-180' : ''} ${t('common.locale') === 'ar' ? 'mr-auto' : ''}`} />
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
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => {
                                      setAllDiscountsSelected(!allDiscountsSelected);
                                      if (!allDiscountsSelected) setAllowedDiscounts([]);
                                    }}
                                  >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${allDiscountsSelected
                                      ? 'bg-paymint-green border-paymint-green shadow-sm'
                                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
                                      }`}>
                                      {allDiscountsSelected && <Check size={14} className="text-white" />}
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('roles.form.allowAllDiscounts')}</p>
                                  </div>

                                  {!allDiscountsSelected && availableDiscounts.map(discount => (
                                    <div
                                      key={discount.id}
                                      className="flex items-start gap-3 pl-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                      onClick={() => toggleDiscount(discount.id)}
                                    >
                                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${allowedDiscounts.includes(discount.id)
                                        ? 'bg-paymint-green border-paymint-green shadow-sm'
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
                                        }`}>
                                        {allowedDiscounts.includes(discount.id) && <Check size={14} className="text-white" />}
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {discount.name} ({(discount.percentage * 100).toLocaleString(t('common.locale'))}%)
                                      </p>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Back Office Section */}
              <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden transition-all duration-300">
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/[0.02]"
                  onClick={() =>
                    setBackofficeAccess((prev) => {
                      const next = !prev;
                      if (next) {
                        setBackofficePermissions((current) =>
                          buildEffectiveBackofficePermissions(current, true),
                        );
                      }
                      return next;
                    })
                  }
                >
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      {t('roles.backoffice.title')}
                      <QuickInfo text="Basic sales operations are included by default with back office access." />
                    </h3>
                    <p className="text-xs text-gray-500 max-w-[250px] leading-relaxed">{t('roles.backoffice.description')}</p>
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
                        {/* Backoffice Defaults Info */}
                        <div className="px-3 py-2.5 rounded-xl bg-paymint-green/5 border border-paymint-green/10 flex items-start gap-2.5 mb-4">
                          <div className="w-5 h-5 rounded-full bg-paymint-green/10 text-paymint-green flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-paymint-green uppercase tracking-wider mb-0.5">{t('roles.form.includedByDefault')}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                              {t('roles.backoffice.includedDefaults')}
                            </p>
                          </div>
                        </div>

                        {BACKOFFICE_PERMISSIONS.map(perm => (
                          <div key={perm.id}>
                            <div
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                              onClick={() => toggleBackofficePermission(perm.id)}
                            >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${backofficePermissions.includes(perm.id)
                                ? 'bg-paymint-green border-paymint-green shadow-sm'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
                                }`}>
                                {backofficePermissions.includes(perm.id) && <Check size={14} className="text-white" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-none">{perm.label}</p>
                              </div>
                            </div>

                            {/* Settings Sub-permissions */}
                            {perm.id === 'manage_settings' && backofficePermissions.includes('manage_settings') && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="ml-8 mt-2 space-y-2 border-l-2 border-paymint-green/20 pl-4 mb-4"
                              >
                                {SETTINGS_SUB_PERMISSIONS.map(sub => (
                                  <div
                                    key={sub.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => toggleBackofficePermission(sub.id)}
                                  >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${backofficePermissions.includes(sub.id)
                                      ? 'bg-paymint-green border-paymint-green shadow-sm'
                                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
                                      }`}>
                                      {backofficePermissions.includes(sub.id) && <Check size={12} className="text-white" />}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-gray-600 dark:text-gray-300 leading-none">{sub.label}</p>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
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
          <div className="p-4 sm:p-8 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 sm:gap-4 bg-white dark:bg-[#1E293B] sticky bottom-0 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 sm:h-14 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-black text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="role-form"
              disabled={isSubmitting}
              className="flex-1 h-12 sm:h-14 rounded-xl bg-paymint-green text-black font-black text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                initialData ? t('common.saveChanges') : t('roles.createRole')
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}


