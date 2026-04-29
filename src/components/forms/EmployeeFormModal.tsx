import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation, Trans } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Eye, EyeOff, ChevronDown, Check, MapPin } from 'lucide-react';
import api from '../../config/api';
import {
  POS_PERMISSIONS as CANONICAL_POS_PERMISSIONS,
  BACKOFFICE_PERMISSIONS as CANONICAL_BACKOFFICE_PERMISSIONS,
  normalizePermissions,
} from '../../config/permissions';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { formatInputPlaceholder } from '../../utils/textCase';

interface StaffMember {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
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
  role?: string; // legacy/compat
  baseRole?: string;
  permissions: string[];
  allowedDiscounts: string[];
  allDiscounts?: boolean;
  // Access Control
  posAccess: boolean;
  backofficeAccess: boolean;
  backofficePermissions: string[];
  // Source tracking
  establishmentId?: string;
  establishmentName?: string;
  isGlobal?: boolean;
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
  onSubmit: (data: Partial<StaffMember> & { password?: string; pinCode?: string }) => Promise<void>;
  onDelete?: (id: string) => void;
  initialData?: StaffMember | null;
  availableDiscounts?: Discount[];
  establishments?: { id: string; name: string }[];
  isSubmitting?: boolean;
}

type CustomRoleApiPayload = {
  id?: string;
  name?: string;
  role?: string;
  baseRole?: string;
  permissions?: unknown;
  allowedDiscounts?: unknown;
  allDiscounts?: boolean;
  posAccess?: boolean;
  backofficeAccess?: boolean;
  backofficePermissions?: unknown;
  establishmentId?: string;
  establishmentName?: string;
  isGlobal?: boolean;
  [key: string]: unknown;
};

const normalizePermissionList = (values: unknown): string[] => {
  if (!Array.isArray(values)) return [];
  return normalizePermissions(values.filter((value): value is string => typeof value === 'string'));
};

const BACKOFFICE_DEFAULT_PERMISSION_IDS = ['dashboard', 'view_orders'] as const;
const LEGACY_AUTO_BACKOFFICE_PERMISSION_IDS = ['dashboard', 'view_orders', 'view_reports'] as const;
const LEGACY_AUTO_BACKOFFICE_PERMISSION_ID_SET = new Set<string>(LEGACY_AUTO_BACKOFFICE_PERMISSION_IDS);

const ALLOWED_POS_PERMISSION_IDS: Set<string> = new Set(CANONICAL_POS_PERMISSIONS.map(({ id }) => id));
const ALLOWED_BACKOFFICE_PERMISSION_IDS: Set<string> = new Set([
  ...CANONICAL_BACKOFFICE_PERMISSIONS.map(({ id }) => id),
  ...BACKOFFICE_DEFAULT_PERMISSION_IDS,
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

const normalizeAndFilterPermissions = (
  values: unknown,
  allowedPermissions: Set<string>,
): string[] => normalizePermissionList(values).filter((permission) => allowedPermissions.has(permission));

const normalizePermissionId = (permissionId: string): string => {
  const normalized = normalizePermissions([permissionId]);
  return normalized[0] || permissionId.trim().toLowerCase();
};

const normalizeCustomRolesPayload = (payload: unknown): CustomRole[] => {
  const payloadWithItems = payload as { items?: unknown };
  const items: CustomRoleApiPayload[] = Array.isArray(payload)
    ? (payload as CustomRoleApiPayload[])
    : Array.isArray(payloadWithItems?.items)
      ? (payloadWithItems.items as CustomRoleApiPayload[])
      : [];

  return items.map((r) => ({
    id: typeof r?.id === 'string' ? r.id : '',
    name: typeof r?.name === 'string' ? r.name : '',
    role: r?.role || r?.baseRole || 'USER',
    baseRole: r?.baseRole || r?.role || 'USER',
    permissions: normalizeAndFilterPermissions(r?.permissions, ALLOWED_POS_PERMISSION_IDS),
    backofficePermissions: normalizeAndFilterPermissions(r?.backofficePermissions, ALLOWED_BACKOFFICE_PERMISSION_IDS),
    allowedDiscounts: Array.isArray(r?.allowedDiscounts) ? r.allowedDiscounts : [],
    allDiscounts:
      typeof r?.allDiscounts === 'boolean'
        ? r.allDiscounts
        : !(Array.isArray(r?.allowedDiscounts) && r.allowedDiscounts.length > 0),
    posAccess: r?.posAccess !== false,
    backofficeAccess: !!r?.backofficeAccess,
    establishmentId: typeof r?.establishmentId === 'string' ? r.establishmentId : undefined,
    establishmentName: typeof r?.establishmentName === 'string' ? r.establishmentName : undefined,
    isGlobal: !!r?.isGlobal,
  }));
};

export function EmployeeFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  establishments,
  isSubmitting = false,
}: EmployeeFormModalProps) {
  const { t } = useTranslation();
  // Get current establishment from context (for dashboard-level pages)
  const { currentEstablishment, account } = useAuth();

  const POS_PERMISSIONS = useMemo(() => {
    return CANONICAL_POS_PERMISSIONS.map(({ id, label, description }) => ({
      id,
      label: t(`staff.permissions.pos_list.${id}`, { defaultValue: label }),
      description: t(`staff.permissions.descriptions.${id}`, { defaultValue: description }),
    }));
  }, [t]);

  const BACKOFFICE_PERMISSIONS = useMemo(() => {
    return CANONICAL_BACKOFFICE_PERMISSIONS
      .filter(p => !['manage_establishment_profile', 'manage_tax_currency', 'manage_receipt_settings', 'delete_establishment'].includes(p.id))
      .map(({ id, label, description }) => ({
        id,
        label: t(`staff.permissions.backoffice_list.${id}`, { defaultValue: label }),
        description: t(`staff.permissions.descriptions.${id}`, { defaultValue: description }),
      }));
  }, [t]);

  useScrollLock(isOpen);

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
  const [activeDropdown, setActiveDropdown] = useState<'ESTABLISHMENT' | 'ROLE' | null>(null);
  const establishmentButtonRef = useRef<HTMLButtonElement>(null);

  // Custom Roles
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [selectedCustomRoleId, setSelectedCustomRoleId] = useState<string>('');
  const [lastAppliedTemplate, setLastAppliedTemplate] = useState<CustomRole | null>(null);
  const [expandedRoleSections, setExpandedRoleSections] = useState<Set<string>>(new Set());
  const rolesButtonRef = useRef<HTMLButtonElement>(null);

  // Platform Access Control
  const [posAccess, setPosAccess] = useState(true);
  const [backofficeAccess, setBackofficeAccess] = useState(false);
  const normalizedCurrentPermissionSet = useMemo(
    () =>
      new Set(
        normalizePermissions(
          (Array.isArray(account?.permissions) ? account.permissions : []) as string[],
        ),
      ),
    [account?.permissions],
  );
  const canAssignAdminRole = normalizedCurrentPermissionSet.has('*');

  const canAssignAdvancedPermission = useCallback(
    (permissionId: string): boolean =>
      canAssignAdminRole ||
      normalizedCurrentPermissionSet.has(normalizePermissionId(permissionId)),
    [canAssignAdminRole, normalizedCurrentPermissionSet],
  );

  const getDefaultBackofficePermissions = useCallback(
    (): string[] =>
      BACKOFFICE_DEFAULT_PERMISSION_IDS.filter((permission) =>
        canAssignAdvancedPermission(permission),
      ),
    [canAssignAdvancedPermission],
  );

  const isLegacyAutoBackofficePermissionSet = useCallback(
    (requestedPermissions: string[] | undefined): boolean => {
      if (!Array.isArray(requestedPermissions)) return false;

      const normalizedUnique = Array.from(
        new Set(
          requestedPermissions
            .filter((permission): permission is string => typeof permission === 'string')
            .map((permission) => normalizePermissionId(permission)),
        ),
      );

      if (normalizedUnique.length !== LEGACY_AUTO_BACKOFFICE_PERMISSION_ID_SET.size) {
        return false;
      }

      return normalizedUnique.every((permission) =>
        LEGACY_AUTO_BACKOFFICE_PERMISSION_ID_SET.has(permission),
      );
    },
    [],
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

      const sanitized = sanitizeAssignableBackofficePermissions(requestedPermissions);
      const normalizeLegacyAutoSelection =
        isLegacyAutoBackofficePermissionSet(requestedPermissions) ||
        isLegacyAutoBackofficePermissionSet(sanitized);
      const normalizedSanitized = normalizeLegacyAutoSelection
        ? sanitized.filter((permission) => permission !== 'view_reports')
        : sanitized;

      return Array.from(
        new Set([
          ...normalizedSanitized,
          ...getDefaultBackofficePermissions(),
        ]),
      );
    },
    [
      getDefaultBackofficePermissions,
      isLegacyAutoBackofficePermissionSet,
      sanitizeAssignableBackofficePermissions,
    ],
  );

  const roleHasUnauthorizedPermissions = useCallback(
    (roleTemplate: CustomRole): boolean => {
      const templateBaseRole = (
        roleTemplate.baseRole ||
        roleTemplate.role ||
        'USER'
      ).toUpperCase();

      if (templateBaseRole === 'ADMIN' && !canAssignAdminRole) {
        return true;
      }

      const requestedPosPermissions = Array.isArray(roleTemplate.permissions)
        ? roleTemplate.permissions
        : [];
      const requestedBackofficePermissions = Array.isArray(
        roleTemplate.backofficePermissions,
      )
        ? roleTemplate.backofficePermissions
        : [];

      const hasUnauthorizedPos = requestedPosPermissions.some((permission) => {
        const normalized = normalizePermissionId(permission);
        return !(
          canAssignAdminRole ||
          BASIC_POS_ASSIGNABLE_PERMISSION_IDS.has(normalized) ||
          normalizedCurrentPermissionSet.has(normalized)
        );
      });

      const hasUnauthorizedBackoffice = requestedBackofficePermissions.some(
        (permission) => !canAssignAdvancedPermission(permission),
      );

      return hasUnauthorizedPos || hasUnauthorizedBackoffice;
    },
    [
      canAssignAdminRole,
      canAssignAdvancedPermission,
      normalizedCurrentPermissionSet,
    ],
  );
  const assignableCustomRoles = useMemo(
    () => customRoles.filter((roleTemplate) => !roleHasUnauthorizedPermissions(roleTemplate)),
    [customRoles, roleHasUnauthorizedPermissions],
  );

  const fetchCustomRoles = useCallback(async () => {
    // In Owner/Brand mode - fetch global roles + establishment roles
    if (establishments && establishments.length > 0) {
      if (selectedEstablishmentIds.length === 0) {
        setCustomRoles([]);
        return;
      }

      try {
        const allRoles: CustomRole[] = [];
        const seenIds = new Set<string>();

        // 1. First fetch global/owner roles
        try {
          const globalResponse = await api.get('/api/custom-roles/owner/global');
          const globalRoles = normalizeCustomRolesPayload(globalResponse.data);

          for (const r of globalRoles) {
            if (!seenIds.has(r.id)) {
              seenIds.add(r.id);
              allRoles.push({
                ...r,
                isGlobal: true,
                establishmentName: t('staff.form.allLocations')
              });
            }
          }
        } catch {
          // Global roles endpoint might not exist or be empty - continue
          console.log('No global roles found');
        }

        // 2. Fetch roles from each selected establishment
        for (const estId of selectedEstablishmentIds) {
          const est = establishments.find(e => e.id === estId);
          const response = await api.get(`/api/custom-roles/${estId}`);
          const roles = normalizeCustomRolesPayload(response.data);

          for (const r of roles) {
            if (!seenIds.has(r.id)) {
              seenIds.add(r.id);
              allRoles.push({
                ...r,
                establishmentId: estId,
                establishmentName: est?.name || t('common.none'),
                isGlobal: false
              });
            }
          }
        }

        setCustomRoles(allRoles);
      } catch (error) {
        console.error('Error fetching custom roles:', error);
      }
      return;
    }

    // Dashboard mode - fetch from current establishment
    let estId: string | undefined;
    if (initialData?.establishmentIds && initialData.establishmentIds.length > 0) {
      estId = initialData.establishmentIds[0];
    } else if (currentEstablishment) {
      estId = currentEstablishment.id;
    }

    if (!estId) return;

    try {
      const response = await api.get(`/api/custom-roles/${estId}`);
      const rolesWithNames = normalizeCustomRolesPayload(response.data).map((r) => ({
        ...r,
        establishmentName: r.establishmentName || currentEstablishment?.name || t('staff.form.locationLabel')
      }));
      setCustomRoles(rolesWithNames);
    } catch (error) {
      console.error('Error fetching custom roles:', error);
    }
  }, [currentEstablishment, establishments, initialData?.establishmentIds, selectedEstablishmentIds, t]);

  // Fetch roles whenever the modal is open and relevant role scope changes
  useEffect(() => {
    if (!isOpen) return;
    fetchCustomRoles();
  }, [fetchCustomRoles, isOpen]);

  // Clear role selection when the selected role is no longer assignable
  useEffect(() => {
    if (!isOpen || !selectedCustomRoleId) return;

    const stillValid = assignableCustomRoles.some((r) => r.id === selectedCustomRoleId);
    if (!stillValid) {
      setSelectedCustomRoleId('');
      setLastAppliedTemplate(null);
    }
  }, [assignableCustomRoles, isOpen, selectedCustomRoleId]);

  useEffect(() => {
    if (activeDropdown === 'ESTABLISHMENT' && establishmentButtonRef.current) {
      setTimeout(() => {
        establishmentButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else if (activeDropdown === 'ROLE' && rolesButtonRef.current) {
      setTimeout(() => {
        rolesButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [activeDropdown]);

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
        const initialBackofficeAccess = initialData.backofficeAccess || false;
        setPermissions(
          sanitizeAssignablePosPermissions(
            normalizeAndFilterPermissions(
              initialData.permissions || ['pos', 'discounts', 'refunds'],
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
            initialBackofficeAccess,
          ),
        );
        setSelectedCustomRoleId(initialData.customRoleId || '');
        // Platform access control
        setPosAccess(initialData.posAccess !== false); // Default to true
        setBackofficeAccess(initialBackofficeAccess);

        if (initialData.allowedDiscounts && initialData.allowedDiscounts.length > 0) {
          setAllDiscountsSelected(false);
          setAllowedDiscounts(initialData.allowedDiscounts);
        } else {
          setAllDiscountsSelected(true);
          setAllowedDiscounts([]);
        }

        // Populate establishments from initialData if available
        if (establishments) {
          if (initialData.establishmentIds && initialData.establishmentIds.length > 0) {
            setSelectedEstablishmentIds(initialData.establishmentIds);
          } else if (establishments.length === 1) {
            // If there is only one establishment, pre-select it
            setSelectedEstablishmentIds([establishments[0].id]);
          } else {
            setSelectedEstablishmentIds([]);
          }
        }

      } else {
        setName('');
        setUsername('');
        setEmail('');
        setPhone('');
        setRole('USER');
        setPassword('');
        setConfirmPassword('');
        setPermissions(['pos', 'dashboard', 'discounts', 'refunds']);
        setBackofficePermissions(
          buildEffectiveBackofficePermissions(
            [...BACKOFFICE_DEFAULT_PERMISSION_IDS],
            true,
          ),
        );
        setAllDiscountsSelected(true);
        setAllowedDiscounts([]);
        setSelectedCustomRoleId('');
        setLastAppliedTemplate(null);
        // Platform access control - defaults for new employees
        setPosAccess(true);
        setBackofficeAccess(true); // Website is considered back office also

        // If creating new and there's only one establishment, select it by default
        if (establishments) {
          if (establishments.length === 1) {
            setSelectedEstablishmentIds([establishments[0].id]);
          } else {
            setSelectedEstablishmentIds([]);
          }
        }
      }
      setActiveDropdown(null);
    }
  }, [
    isOpen,
    initialData,
    establishments,
    buildEffectiveBackofficePermissions,
    sanitizeAssignablePosPermissions,
  ]);

  const toggleSection = (sectionId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const isExpanding = !expandedRoleSections.has(sectionId);
    const element = e.currentTarget;

    setExpandedRoleSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });

    if (isExpanding) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    }
  };

  const handleTemplateSelect = (roleTemplate: CustomRole) => {
    if (roleHasUnauthorizedPermissions(roleTemplate)) {
      return;
    }

    // Safely determine the role type
    const templateRole = (roleTemplate.baseRole || roleTemplate.role || 'USER').toUpperCase();
    const roleType =
      templateRole === 'ADMIN' && canAssignAdminRole ? 'ADMIN' : 'USER';
    setRole(roleType);

    const filteredPosPermissions = sanitizeAssignablePosPermissions(
      normalizeAndFilterPermissions(
        roleTemplate.permissions,
        ALLOWED_POS_PERMISSION_IDS,
      ),
    );
    const templateBackofficeAccess = roleTemplate.backofficeAccess || false;
    const filteredBackofficePermissions = buildEffectiveBackofficePermissions(
      normalizeAndFilterPermissions(
        roleTemplate.backofficePermissions,
        ALLOWED_BACKOFFICE_PERMISSION_IDS,
      ),
      templateBackofficeAccess,
    );

    setPermissions(filteredPosPermissions);
    setBackofficePermissions(filteredBackofficePermissions);
    setAllDiscountsSelected(
      typeof roleTemplate.allDiscounts === 'boolean'
        ? roleTemplate.allDiscounts
        : (roleTemplate.allowedDiscounts || []).length === 0,
    );
    setAllowedDiscounts(roleTemplate.allowedDiscounts || []);
    setSelectedCustomRoleId(roleTemplate.id);
    setLastAppliedTemplate({
      ...roleTemplate,
      baseRole: roleType,
      permissions: filteredPosPermissions,
      backofficePermissions: filteredBackofficePermissions,
    });

    // Sync access control from template
    setPosAccess(roleTemplate.posAccess !== false);
    setBackofficeAccess(templateBackofficeAccess);

    setActiveDropdown(null);
  };

  const isModifiedFromTemplate = () => {
    if (!lastAppliedTemplate) return false;

    const permissionsMatch = JSON.stringify([...permissions].sort()) === JSON.stringify([...lastAppliedTemplate.permissions].sort());
    const backofficePermissionsMatch = JSON.stringify([...backofficePermissions].sort()) === JSON.stringify([...(lastAppliedTemplate.backofficePermissions || [])].sort());
    const discountsMatch = allDiscountsSelected === lastAppliedTemplate.allDiscounts &&
      JSON.stringify([...allowedDiscounts].sort()) === JSON.stringify([...(lastAppliedTemplate.allowedDiscounts || [])].sort());

    // Safety check for role match
    const templateRole = (lastAppliedTemplate.baseRole || lastAppliedTemplate.role || 'USER').toUpperCase();
    const currentRole = role ? role.toUpperCase() : 'USER';
    const roleMatch = currentRole === templateRole;

    const accessMatch = posAccess === (lastAppliedTemplate.posAccess !== false) &&
      backofficeAccess === (lastAppliedTemplate.backofficeAccess || false);

    return !permissionsMatch || !backofficePermissionsMatch || !discountsMatch || !roleMatch || !accessMatch;
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setErrors({}), 0);
    }
  }, [isOpen]);

  const errorBannerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t('staff.errors.nameRequired');
    if (!username.trim()) newErrors.username = t('staff.errors.usernameRequired');
    if ((role === 'ADMIN' || backofficeAccess) && !email.trim()) {
      newErrors.email = t('staff.errors.emailRequired');
    }

    if (role === 'ADMIN' && !canAssignAdminRole) {
      newErrors.role = t('staff.errors.roleNotAllowed', {
        defaultValue: 'You cannot assign the admin role.',
      });
    }

    // Validate role selection - must be ADMIN or have a custom role selected
    if (role !== 'ADMIN' && !selectedCustomRoleId) {
      newErrors.role = t('staff.errors.roleRequired');
    }

    if (
      selectedCustomRoleId &&
      !assignableCustomRoles.some((customRole) => customRole.id === selectedCustomRoleId)
    ) {
      newErrors.role = t('staff.errors.roleNotAllowed', {
        defaultValue: 'You cannot assign this role template.',
      });
    }

    if (!initialData && !password) newErrors.password = t('staff.errors.passwordRequired');
    if (password && password.length < 5) newErrors.password = t('staff.errors.passwordMin');
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('staff.errors.passwordsNotMatch');
    }

    // Validate establishment selection if in Owner Mode
    if (establishments && selectedEstablishmentIds.length === 0) {
      newErrors.establishments = t('staff.errors.selectLocation');
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

    setErrors({});

    // Split name into first and last name
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || t('staff.form.defaultFirstName');
    const lastName = nameParts.slice(1).join(' ');
    const sanitizedPosPermissions = sanitizeAssignablePosPermissions(
      normalizeAndFilterPermissions(permissions, ALLOWED_POS_PERMISSION_IDS),
    );
    const effectiveBackofficePermissions = buildEffectiveBackofficePermissions(
      normalizeAndFilterPermissions(backofficePermissions, ALLOWED_BACKOFFICE_PERMISSION_IDS),
      backofficeAccess,
    );

    const payload: Partial<StaffMember> & { password?: string; pinCode?: string } = {
      firstName,
      ...(lastName && { lastName }),
      username,
      email: email || undefined,
      phone: phone || undefined,
      role: role.toUpperCase(),
      permissions: role === 'ADMIN'
        ? POS_PERMISSIONS.map(p => p.id)
        : Array.from(new Set([
            ...sanitizedPosPermissions,
            ...(posAccess ? ['pos', 'void_items'] : []),
          ])),
      customRoleId:
        selectedCustomRoleId &&
        assignableCustomRoles.some((customRole) => customRole.id === selectedCustomRoleId)
          ? selectedCustomRoleId
          : undefined,
      allowedDiscounts: allDiscountsSelected ? [] : allowedDiscounts,
      ...(establishments && { establishmentIds: selectedEstablishmentIds }),
      // Platform access control
      posAccess,
      backofficeAccess,
      backofficePermissions: effectiveBackofficePermissions,
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
          className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/10"
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 border-b border-gray-200 dark:border-white/10">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {initialData ? t('staff.editEmployee') : t('staff.newEmployee')}
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
            <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Error Banner */}
              {Object.keys(errors).length > 0 && (
                <div ref={errorBannerRef} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {t('common.validationError')}
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                  {t('staff.form.nameLabel')} <span className="text-paymint-red">*</span>
                </label>
                <input maxLength={255}
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder={formatInputPlaceholder(t('staff.form.namePlaceholder'), t('common.locale'))}
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                />
                {errors.name && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.name}</p>}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                  {t('staff.form.usernameLabel')} <span className="text-paymint-red">*</span>
                </label>
                <input maxLength={255}
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors({ ...errors, username: '' }); }}
                  placeholder={formatInputPlaceholder(t('staff.form.usernamePlaceholder'), t('common.locale'))}
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.username ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                />
                {errors.username && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.username}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                  {t('staff.form.emailLabel')} {role === 'ADMIN' ? <span className="text-paymint-red">*</span> : t('staff.form.emailOptional')}
                </label>
                <input maxLength={255}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
                  placeholder={formatInputPlaceholder(t('staff.form.emailPlaceholder'), t('common.locale'))}
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.email ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
                />
                {errors.email && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                  {t('staff.form.phoneLabel')} {t('staff.form.phoneOptional')}
                </label>
                <input maxLength={255}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={formatInputPlaceholder(t('staff.form.phonePlaceholder'), t('common.locale'))}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors"
                />
              </div>

              {/* Establishment Selection (Only if establishments prop is provided) */}
              {establishments && (
                <div className="relative space-y-2">
                  <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                    {t('staff.form.accessLabel')} <span className="text-paymint-red">*</span>
                  </label>
                  <button
                    ref={establishmentButtonRef}
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'ESTABLISHMENT' ? null : 'ESTABLISHMENT')}
                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.establishments ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-left flex items-center justify-between transition-colors`}
                  >
                    <span className={`text-sm font-bold ${selectedEstablishmentIds.length ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                      {selectedEstablishmentIds.length === 0
                        ? t('staff.form.selectLocation')
                        : selectedEstablishmentIds.length === establishments.length
                          ? t('staff.form.allLocations')
                          : t('staff.form.locationsCount', { count: selectedEstablishmentIds.length })}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${activeDropdown === 'ESTABLISHMENT' ? 'rotate-180' : ''}`} />
                  </button>
                  {errors.establishments && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.establishments}</p>}

                  {/* Portal Dropdown */}
                  <AnimatePresence>
                    {activeDropdown === 'ESTABLISHMENT' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl z-[50] max-h-[340px] flex flex-col shadow-2xl overflow-hidden"
                      >
                        {/* Search */}
                        <div className="relative p-3 border-b border-gray-100 dark:border-white/5 shrink-0">
                          <input maxLength={255}
                            type="text"
                            placeholder={formatInputPlaceholder(t('common.search'), t('common.locale'))}
                            value={establishmentSearch}
                            onChange={(e) => setEstablishmentSearch(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-lg pl-3 pr-11 py-2 text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-0"
                            autoFocus
                          />
                          {establishmentSearch && (
                            <button
                              type="button"
                              onClick={() => setEstablishmentSearch('')}
                              aria-label={t('common.clearSearch', 'Clear search')}
                              className="absolute right-5 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                              <X size={11} strokeWidth={2.75} />
                            </button>
                          )}
                        </div>
                        {/* List */}
                        <div className="overflow-y-auto p-2 custom-scrollbar flex-1 min-h-0">
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
                            <div className="p-4 text-center text-xs font-bold text-gray-500">{t('products.messages.noMatches')}</div>
                          )}
                        </div>
                        {/* Footer */}
                        <div className="p-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(null)}
                            className="w-full py-2.5 bg-paymint-green text-black font-black text-xs tracking-wide rounded-lg hover:bg-paymint-green/90 transition-colors shadow-sm"
                          >
                            {t('common.done')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Role Selection - Now uses Role Template dropdown */}
              <div className="relative space-y-2">
                <label className="block text-sm font-normal text-gray-600 dark:text-gray-300 flex items-center justify-between tracking-normal">
                  <span className="flex items-center gap-1">{t('staff.form.roleLabel')} <span className="text-paymint-red">*</span></span>
                  {isModifiedFromTemplate() && (
                    <span className="text-paymint-red lowercase font-bold tracking-normal">{t('staff.form.modified')}</span>
                  )}
                </label>
                {/* Show hint if no establishments selected in owner mode */}
                {establishments && selectedEstablishmentIds.length === 0 ? (
                  <div className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-left">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500">{t('staff.form.selectLocation')}</span>
                  </div>
                ) : (
                  <>
                    <button
                      ref={rolesButtonRef}
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === 'ROLE' ? null : 'ROLE')}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-left flex items-center justify-between transition-colors"
                    >
                      <span className={`text-sm font-bold ${(selectedCustomRoleId || role === 'ADMIN') ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                        {role === 'ADMIN'
                          ? t('staff.form.adminRole')
                          : selectedCustomRoleId
                            ? assignableCustomRoles.find(r => r.id === selectedCustomRoleId)?.name || t('staff.form.selectRole')
                            : t('staff.form.selectRole')}
                      </span>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${activeDropdown === 'ROLE' ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dashboard Mode: Show current establishment name under role selection */}
                    {!establishments && currentEstablishment?.name && (
                      <div className="flex items-center gap-1.5 mt-1.5 px-1 opacity-80">
                        <MapPin size={10} className="text-paymint-green" />
                        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-tight">{currentEstablishment.name}</span>
                      </div>
                    )}

                    <AnimatePresence>
                      {activeDropdown === 'ROLE' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl z-[50] max-h-80 flex flex-col shadow-2xl overflow-hidden"
                        >
                          <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                            {/* Admin Option */}
                            {canAssignAdminRole && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRole('ADMIN');
                                  setSelectedCustomRoleId('');
                                  setLastAppliedTemplate(null);
                                  setPermissions(POS_PERMISSIONS.map(p => p.id));
                                  setBackofficePermissions(
                                    sanitizeAssignableBackofficePermissions(
                                      BACKOFFICE_PERMISSIONS.map(p => p.id),
                                    ),
                                  );
                                  setAllDiscountsSelected(true);
                                  setActiveDropdown(null);
                                  setPosAccess(true);
                                  setBackofficeAccess(true);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${role === 'ADMIN' ? 'bg-purple-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                              >
                                <div>
                                  <span className={`text-xs font-bold ${role === 'ADMIN' ? 'text-purple-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {t('staff.form.adminRole')}
                                  </span>
                                  <p className="text-xs font-bold text-gray-500 mt-0.5">{t('staff.form.adminDesc')}</p>
                                </div>
                                {role === 'ADMIN' && <Check size={14} className="text-purple-500" />}
                              </button>
                            )}

                            {/* Global Roles Section - Accordion */}
                            {assignableCustomRoles.filter(r => r.isGlobal).length > 0 && (
                              <div className="mt-2">
                                <div className="border-t border-gray-100 dark:border-white/5 mb-2" />
                                <button
                                  type="button"
                                  onClick={(e) => toggleSection('global', e)}
                                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                  <span className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest uppercase">{t('staff.form.globalRoles')}</span>
                                  <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${expandedRoleSections.has('global') ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                  {expandedRoleSections.has('global') && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      {assignableCustomRoles.filter(r => r.isGlobal).map(customRole => (
                                        <button
                                          key={customRole.id}
                                          type="button"
                                          onClick={() => handleTemplateSelect(customRole)}
                                          className={`w-full flex items-center justify-between p-3 pl-5 rounded-lg text-left transition-colors ${selectedCustomRoleId === customRole.id && role !== 'ADMIN' ? 'bg-paymint-green/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                        >
                                          <div>
                                            <span className={`text-xs font-bold ${selectedCustomRoleId === customRole.id && role !== 'ADMIN' ? 'text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                              {customRole.name}
                                            </span>
                                            <p className="text-xs font-bold text-gray-500 mt-0.5">{t('staff.form.permissionsCount', { count: customRole.permissions.length + (customRole.backofficePermissions?.length || 0) })}</p>
                                          </div>
                                          {selectedCustomRoleId === customRole.id && role !== 'ADMIN' && <Check size={14} className="text-paymint-green" />}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}

                            {/* Establishment-Specific Roles - Accordion */}
                            {(() => {
                              const estRoles = assignableCustomRoles.filter(r => !r.isGlobal);
                              // Group by establishment
                              const grouped: Record<string, CustomRole[]> = {};
                              estRoles.forEach(r => {
                                const key = r.establishmentName || t('staff.form.accessLabel');
                                if (!grouped[key]) grouped[key] = [];
                                grouped[key].push(r);
                              });

                              return Object.entries(grouped).map(([estName, roles]) => (
                                <div key={estName} className="mt-2">
                                  <div className="border-t border-gray-100 dark:border-white/5 mb-2" />
                                  <button
                                    type="button"
                                    onClick={(e) => toggleSection(estName, e)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                  >
                                    <span className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest uppercase truncate max-w-[200px]">{estName}</span>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${expandedRoleSections.has(estName) ? 'rotate-180' : ''}`} />
                                  </button>
                                  <AnimatePresence>
                                    {expandedRoleSections.has(estName) && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        {roles.map(customRole => (
                                          <button
                                            key={customRole.id}
                                            type="button"
                                            onClick={() => handleTemplateSelect(customRole)}
                                            className={`w-full flex items-center justify-between p-3 pl-5 rounded-lg text-left transition-colors ${selectedCustomRoleId === customRole.id && role !== 'ADMIN' ? 'bg-paymint-green/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                          >
                                            <div>
                                              <span className={`text-xs font-bold ${selectedCustomRoleId === customRole.id && role !== 'ADMIN' ? 'text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {customRole.name}
                                              </span>
                                              <p className="text-xs font-bold text-gray-500 mt-0.5">{t('staff.form.permissionsCount', { count: customRole.permissions.length + (customRole.backofficePermissions?.length || 0) })}</p>
                                            </div>
                                            {selectedCustomRoleId === customRole.id && role !== 'ADMIN' && <Check size={14} className="text-paymint-green" />}
                                          </button>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ));
                            })()}

                            {/* No custom roles message */}
                            {assignableCustomRoles.length === 0 && (
                              <div className="p-3 text-center">
                                <p className="text-xs text-gray-500">{t('staff.form.noRoles')}</p>
                                <p className="text-xs font-bold text-gray-500 mt-1">{t('staff.form.createRolesInSettings')}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
                {errors.role && (
                  <p className="text-paymint-red text-xs font-bold mt-2">{errors.role}</p>
                )}

                {/* UX Improvement: Location Disclaimer */}
                {!establishments && (
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-paymint-green/10 text-paymint-green flex items-center justify-center shrink-0">
                      <MapPin size={16} />
                    </div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                      <Trans
                        i18nKey="staff.form.locationDisclaimer"
                        components={[
                          <a
                            key="owner-portal-link"
                            href="/owner/employees"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-paymint-green hover:underline cursor-pointer"
                          />
                        ]}
                      />
                    </p>                  </div>
                )}
              </div>

              {/* Password wrapper start (to match existing indentation/structure) */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-2">
                <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                  {initialData ? t('staff.form.newPasswordOptional') : t('staff.form.passwordLabel')} {(!initialData) && <span className="text-paymint-red">*</span>}
                </label>
                <div className="relative">
                  <input maxLength={255}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                    placeholder={formatInputPlaceholder(initialData ? t('staff.form.leaveBlank') : t('staff.form.passwordPlaceholder'), t('common.locale'))}
                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.password ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 pr-12 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
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

              <div className="space-y-2">
                <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                  {t('staff.form.confirmPasswordLabel')} {(!initialData || password) && <span className="text-paymint-red">*</span>}
                </label>
                <div className="relative">
                  <input maxLength={255}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }); }}
                    placeholder={formatInputPlaceholder(t('staff.form.confirmPasswordPlaceholder'), t('common.locale'))}
                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.confirmPassword ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 pr-12 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-colors`}
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
          <div className="p-4 sm:p-8 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 sm:gap-4 bg-white dark:bg-[#1E293B] sticky bottom-0 pb-safe">
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
              className="flex-1 h-12 sm:h-14 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-barlow font-black text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="employee-form"
              disabled={isSubmitting}
              className="flex-1 h-12 sm:h-14 rounded-xl bg-paymint-green text-black font-barlow font-black text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                initialData ? t('common.save') : t('common.add')
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}


