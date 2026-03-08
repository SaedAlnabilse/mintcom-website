import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Check, Smartphone, Monitor } from 'lucide-react';
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

  const [name, setName] = useState('');
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
      return;
    }

    const payload: Omit<CustomRole, 'id'> = {
      name: name.trim(),
      baseRole: 'USER', // Default base role for custom roles
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
          className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col border border-gray-200 dark:border-white/10 shadow-2xl"
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-8 pb-4 border-b border-gray-100 dark:border-white/5">
            <div>
              <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">
                {initialData ? t('roles.editRole') : t('roles.newRole')}
              </h2>
              <p className="text-xs font-bold text-gray-400 tracking-widest mt-1">{t('roles.permissions')}</p>
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
              {/* Name Input */}
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder={t('roles.form.roleNamePlaceholder')}
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
                      <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        {t('roles.pos.title')}
                        <QuickInfo text={t('roles.pos.defaultSalesInfo', { defaultValue: 'Sales screen access is included by default when this section is enabled.' })} />
                      </h3>
                      <p className="text-xs text-gray-500 max-w-[250px] leading-relaxed">{t('roles.pos.description')}</p>
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
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('roles.form.allowAllDiscounts')}</p>
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
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${backofficeAccess ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/5'}`}>
                      <Monitor size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        {t('roles.backoffice.title')}
                        <QuickInfo text={`${t('dashboard.menu.dashboard')} & ${t('dashboard.menu.orders')} - Included by default with Back Office access`} />
                      </h3>
                      <p className="text-xs text-gray-500 max-w-[250px] leading-relaxed">{t('roles.backoffice.description')}</p>
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
                          <div key={perm.id}>
                            <div
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
                                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => toggleBackofficePermission(sub.id)}
                                  >
                                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${backofficePermissions.includes(sub.id)
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

