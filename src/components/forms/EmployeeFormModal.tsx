import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation, Trans } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Eye, EyeOff, ChevronDown, Check, MapPin, Globe, Plus } from 'lucide-react';
import api from '../../config/api';
import {
  POS_PERMISSIONS as CANONICAL_POS_PERMISSIONS,
  BACKOFFICE_PERMISSIONS as CANONICAL_BACKOFFICE_PERMISSIONS,
  BASIC_POS_ASSIGNABLE_PERMISSION_IDS,
  normalizePermissions,
} from '../../config/permissions';
import { useAuth } from '../../context/AuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { formatInputPlaceholder } from '../../utils/textCase';
import { CustomRoleFormModal } from '../CustomRoleFormModal';

interface StaffMember {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username: string;
  role: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  employeeId?: string;
  permissions?: string[];
  allowedDiscounts?: string[];
  establishmentIds?: string[];
  // null is a real value on the wire: it detaches the role template.
  customRoleId?: string | null;
  // Platform access control
  posAccess?: boolean;
  backofficeAccess?: boolean;
  backofficePermissions?: string[];
  assignments?: EmployeeAssignment[];
  isAccountOwner?: boolean;
  isOwnerAccount?: boolean;
  isProtected?: boolean;
}

interface EmployeeAssignment {
  establishmentId: string;
  establishmentName?: string;
  role?: string;
  permissions?: string[];
  allowedDiscounts?: string[];
  customRoleId?: string | null;
  // Sent by /api/accounts/all-employees. Kept so a role that is not in the
  // fetched template list still renders by name instead of "Select Role".
  customRoleName?: string | null;
  customRoleScope?: 'GLOBAL' | 'LOCATION' | null;
  backofficeAccess?: boolean;
  backofficePermissions?: string[];
  posAccess?: boolean;
  isActive?: boolean;
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
  onSubmit: (data: Partial<StaffMember> & { password?: string }) => Promise<void>;
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
/** What a plain employee starts with: new hires and Admin/template downgrades alike. */
const DEFAULT_EMPLOYEE_POS_PERMISSIONS = ['pos', 'dashboard', 'discounts', 'refunds'] as const;
const LEGACY_AUTO_BACKOFFICE_PERMISSION_IDS = ['dashboard', 'view_orders', 'view_reports'] as const;
const LEGACY_AUTO_BACKOFFICE_PERMISSION_ID_SET = new Set<string>(LEGACY_AUTO_BACKOFFICE_PERMISSION_IDS);

const ALLOWED_POS_PERMISSION_IDS: Set<string> = new Set(CANONICAL_POS_PERMISSIONS.map(({ id }) => id));
const ALLOWED_BACKOFFICE_PERMISSION_IDS: Set<string> = new Set([
  ...CANONICAL_BACKOFFICE_PERMISSIONS.map(({ id }) => id),
  ...BACKOFFICE_DEFAULT_PERMISSION_IDS,
]);
/** Staff password: 4+ chars plain POS staff, 6+ for ADMIN/Back Office. No complexity. */
const EMPLOYEE_PASSWORD_MIN_LENGTH = 4;
const PRIVILEGED_EMPLOYEE_PASSWORD_MIN_LENGTH = 6;

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

/**
 * Tells apart the three kinds of role a picker can offer: a built-in one, an
 * account-wide template shared by every branch, and a role that belongs to a
 * single branch. Built-in needs no badge — it is the unmarked default.
 */
function RoleScopeBadge({
  scope,
  t,
}: {
  scope?: 'BUILTIN' | 'GLOBAL' | 'BRANCH';
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  if (scope !== 'GLOBAL' && scope !== 'BRANCH') return null;

  const isGlobal = scope === 'GLOBAL';

  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
        isGlobal
          ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
          : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
      }`}
    >
      {isGlobal ? <Globe size={9} /> : <MapPin size={9} />}
      {isGlobal
        ? t('staff.form.globalBadge', { defaultValue: 'Global' })
        : t('staff.form.branchBadge', { defaultValue: 'Branch' })}
    </span>
  );
}

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
  const isOwnerMode = Boolean(
    initialData &&
      (initialData.isAccountOwner ||
        initialData.isOwnerAccount ||
        initialData.isProtected ||
        initialData.role?.toUpperCase() === 'ACCOUNT_OWNER'),
  );

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
  const [roleSelectionTarget, setRoleSelectionTarget] = useState<'ALL' | string>('ALL');
  const [sameRoleForAllLocations, setSameRoleForAllLocations] = useState(true);
  const [assignmentRoleIds, setAssignmentRoleIds] = useState<Record<string, string>>({});
  // Role names as the server reported them per assignment, so an existing
  // assignment still shows its role name while templates are still loading.
  const [assignmentRoleNames, setAssignmentRoleNames] = useState<Record<string, string>>({});
  const [assignmentRoleScopes, setAssignmentRoleScopes] = useState<
    Record<string, 'GLOBAL' | 'BRANCH'>
  >({});
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isSavingNewRole, setIsSavingNewRole] = useState(false);
  const establishmentButtonRef = useRef<HTMLButtonElement>(null);

  // Custom Roles
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [selectedCustomRoleId, setSelectedCustomRoleId] = useState<string>('');
  // Whether the operator actually picked a role in this session. An edit that
  // never touches the role picker must not send a role decision at all, so the
  // backend keeps (or drops) the existing link on its own terms instead of the
  // form re-asserting a role it only ever displayed.
  const [rolePickerTouched, setRolePickerTouched] = useState(false);
  // The built-in "Employee" role: an assignment that follows no template and
  // carries its own permissions. Tracked separately because it is not implied
  // by any other field - an employee with neither Admin nor a template has it.
  const [builtInEmployeeRoleSelected, setBuiltInEmployeeRoleSelected] = useState(false);
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

  const builtInRoleOptionId = useCallback(
    (roleValue: string) => `builtin:${roleValue.toUpperCase()}`,
    [],
  );
  const customRoleOptionId = useCallback((roleId: string) => `custom:${roleId}`, []);

  const getRoleTemplateByOptionId = useCallback(
    (optionId?: string) => {
      if (!optionId?.startsWith('custom:')) return undefined;
      return assignableCustomRoles.find((customRole) => customRole.id === optionId.slice(7));
    },
    [assignableCustomRoles],
  );

  const getRoleOptionLabel = useCallback(
    (optionId?: string) => {
      if (!optionId) return t('staff.form.selectRole');
      if (optionId.startsWith('builtin:')) {
        const builtInRole = optionId.slice(8);
        if (builtInRole === 'ADMIN') return t('staff.form.adminRole');
        // No longer selectable. Only reachable for assignments saved before
        // named roles became mandatory, so it reads as the legacy state it is.
        if (builtInRole === 'USER') {
          return t('staff.form.legacyNoRole', {
            defaultValue: 'No role (legacy custom permissions)',
          });
        }
        return t(`staff.roles.${builtInRole.toLowerCase()}`, {
          defaultValue: builtInRole.charAt(0) + builtInRole.slice(1).toLowerCase(),
        });
      }

      const customRole = getRoleTemplateByOptionId(optionId);
      if (customRole?.name) return customRole.name;

      // The template list is fetched per selected location, so a role can be
      // assigned but not present in it (still loading, or scoped to a branch
      // that is no longer selected). Fall back to the name the server sent with
      // the assignment rather than showing "Select Role" over a real role.
      const assignedName = assignmentRoleNames[optionId];
      return assignedName || t('staff.form.selectRole');
    },
    [assignmentRoleNames, getRoleTemplateByOptionId, t],
  );

  /**
   * Scope of an option, used for the badge on the trigger and in the list so
   * "which of these is shared across branches?" is answerable at a glance.
   */
  const getRoleOptionScope = useCallback(
    (optionId?: string): 'BUILTIN' | 'GLOBAL' | 'BRANCH' | undefined => {
      if (!optionId) return undefined;
      if (optionId.startsWith('builtin:')) return 'BUILTIN';
      const template = getRoleTemplateByOptionId(optionId);
      if (template) return template.isGlobal ? 'GLOBAL' : 'BRANCH';
      return assignmentRoleScopes[optionId];
    },
    [assignmentRoleScopes, getRoleTemplateByOptionId],
  );

  /**
   * The role chosen for a target, or `undefined` when nothing has been chosen.
   *
   * This must never invent a value for a location. It used to fall back to the
   * account-wide `role`, which is derived server-side as "the first assignment
   * that is ADMIN" — so an employee who was Admin at one branch had every other
   * branch silently display *and save* Admin (Full Access). It also made the
   * "pick a role for each location" validation dead code, because the getter
   * could never return a falsy value.
   */
  const getRoleOptionForTarget = useCallback(
    (target: 'ALL' | string): string | undefined => {
      if (target === 'ALL') {
        if (selectedCustomRoleId) return customRoleOptionId(selectedCustomRoleId);
        if (role === 'ADMIN' || builtInEmployeeRoleSelected) {
          return builtInRoleOptionId(role);
        }
        return undefined;
      }

      // In same-role mode every location follows the single top-level choice.
      if (sameRoleForAllLocations) {
        if (selectedCustomRoleId) return customRoleOptionId(selectedCustomRoleId);
        if (role === 'ADMIN' || builtInEmployeeRoleSelected) {
          return builtInRoleOptionId(role);
        }
        return undefined;
      }

      return assignmentRoleIds[target];
    },
    [
      assignmentRoleIds,
      builtInEmployeeRoleSelected,
      builtInRoleOptionId,
      customRoleOptionId,
      role,
      sameRoleForAllLocations,
      selectedCustomRoleId,
    ],
  );

  // Email is mandatory whenever the selected role grants access to the
  // website/backoffice (those platforms authenticate by email). POS-only
  // roles keep the email optional.
  const roleOptionRequiresEmail = useCallback(
    (optionId?: string): boolean => {
      if (!optionId) return false;
      if (optionId.startsWith('builtin:')) {
        return optionId.slice(8).toUpperCase() === 'ADMIN';
      }
      const template = getRoleTemplateByOptionId(optionId);
      if (!template) {
        // Role template not loaded/assignable - fall back to the tracked flag.
        return backofficeAccess;
      }
      return (
        (template.baseRole || template.role || 'USER').toUpperCase() === 'ADMIN' ||
        !!template.backofficeAccess
      );
    },
    [backofficeAccess, getRoleTemplateByOptionId],
  );

  const requiresEmail = useMemo(() => {
    if (role === 'ADMIN') return true;
    if (
      establishments &&
      !sameRoleForAllLocations &&
      selectedEstablishmentIds.length > 0
    ) {
      return selectedEstablishmentIds.some((establishmentId) =>
        roleOptionRequiresEmail(getRoleOptionForTarget(establishmentId)),
      );
    }
    if (!selectedCustomRoleId) return false;
    return roleOptionRequiresEmail(customRoleOptionId(selectedCustomRoleId));
  }, [
    customRoleOptionId,
    establishments,
    getRoleOptionForTarget,
    role,
    roleOptionRequiresEmail,
    sameRoleForAllLocations,
    selectedCustomRoleId,
    selectedEstablishmentIds,
  ]);

  /**
   * A saved assignment counts as configured only when it points at the built-in
   * Admin role or a named template. `builtin:USER` is the legacy "no role,
   * hand-tuned permissions" state, which can still be read off old rows but can
   * no longer be saved.
   */
  const isLegacyNoRoleOption = (optionId?: string) =>
    optionId === builtInRoleOptionId('USER');

  const isRoleChosenForTarget = (target: 'ALL' | string) => {
    const optionId = getRoleOptionForTarget(target);
    return !!optionId && !isLegacyNoRoleOption(optionId);
  };

  /**
   * Where a role created from this form should live. A role picked for one
   * location belongs to that location; a role meant for several locations at
   * once has to be an account-wide global role.
   */
  const newRoleTargetEstablishmentId =
    roleSelectionTarget !== 'ALL'
      ? roleSelectionTarget
      : selectedEstablishmentIds.length === 1
        ? selectedEstablishmentIds[0]
        : currentEstablishment && !establishments
          ? currentEstablishment.id
          : undefined;

  const newRoleScopeLabel = newRoleTargetEstablishmentId
    ? t('staff.form.createRoleForLocation', {
        location:
          establishments?.find((item) => item.id === newRoleTargetEstablishmentId)?.name ||
          currentEstablishment?.name ||
          t('staff.form.locationLabel'),
        defaultValue: 'For {{location}}',
      })
    : t('staff.form.createRoleGlobal', {
        defaultValue: 'Shared across all locations',
      });

  const handleCreateRoleSubmit = async (data: Record<string, unknown>) => {
    setIsSavingNewRole(true);
    try {
      const response = newRoleTargetEstablishmentId
        ? await api.post(`/api/custom-roles/${newRoleTargetEstablishmentId}`, data)
        : await api.post('/api/custom-roles/owner/global', data);

      const created = response.data;
      if (created?.id) {
        // Show it immediately rather than waiting for the next refetch, then
        // apply it to whichever target the picker was opened for.
        setCustomRoles((current) => [
          ...current,
          ...normalizeCustomRolesPayload([created]),
        ]);
        handleTemplateSelect(normalizeCustomRolesPayload([created])[0]);
      }
      setIsCreatingRole(false);
    } finally {
      setIsSavingNewRole(false);
    }
  };

  // What the role list should show as selected. It follows the target being
  // edited; previously it read the account-wide role, so opening the picker for
  // any location showed the same option ticked regardless of that location.
  const activeTargetOptionId = getRoleOptionForTarget(roleSelectionTarget);

  const isRoleVisibleForTarget = useCallback(
    (customRole: CustomRole, target: 'ALL' | string) => {
      if (customRole.isGlobal) return true;
      if (!establishments) return true;
      if (target !== 'ALL') return customRole.establishmentId === target;
      return selectedEstablishmentIds.length === 1 && customRole.establishmentId === selectedEstablishmentIds[0];
    },
    [establishments, selectedEstablishmentIds],
  );

  const fetchCustomRoles = useCallback(async () => {
    if (isOwnerMode) {
      setCustomRoles([]);
      return;
    }

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
            if (seenIds.has(r.id)) continue;
            seenIds.add(r.id);

            // This endpoint returns the account's global roles alongside the
            // branch's own, and the server tags which is which. Stamping
            // `establishmentId: estId` onto everything would file a global
            // template under the branch accordion.
            if (r.isGlobal) {
              allRoles.push({
                ...r,
                establishmentId: undefined,
                establishmentName: t('staff.form.allLocations')
              });
              continue;
            }

            allRoles.push({
              ...r,
              establishmentId: r.establishmentId || estId,
              establishmentName: r.establishmentName || est?.name || t('common.none'),
              isGlobal: false
            });
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
      // Same as owner mode: the response mixes account-level global templates
      // with this branch's own roles, distinguished by the server's `isGlobal`.
      const rolesWithNames = normalizeCustomRolesPayload(response.data).map((r) =>
        r.isGlobal
          ? {
              ...r,
              establishmentId: undefined,
              establishmentName: t('staff.form.allLocations')
            }
          : {
              ...r,
              establishmentId: r.establishmentId || estId,
              establishmentName:
                r.establishmentName || currentEstablishment?.name || t('staff.form.locationLabel')
            }
      );
      setCustomRoles(rolesWithNames);
    } catch (error) {
      console.error('Error fetching custom roles:', error);
    }
  }, [currentEstablishment, establishments, initialData?.establishmentIds, isOwnerMode, selectedEstablishmentIds, t]);

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
    } else if (activeDropdown === 'ROLE') {
      // Scroll to the trigger that was actually clicked. Using the shared
      // trigger's ref scrolled to the wrong place in per-location mode, where
      // that trigger is not even rendered.
      setTimeout(() => {
        const openTrigger = document.querySelector(
          `[data-role-trigger="${roleSelectionTarget}"]`,
        );
        (openTrigger || rolesButtonRef.current)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 150);
    }
  }, [activeDropdown, roleSelectionTarget]);

  useEffect(() => {
    if (activeDropdown !== 'ROLE') return;

    const nextExpandedSections = new Set<string>();
    assignableCustomRoles.forEach((customRole) => {
      if (!isRoleVisibleForTarget(customRole, roleSelectionTarget)) return;
      if (customRole.isGlobal) {
        nextExpandedSections.add('global');
        return;
      }

      nextExpandedSections.add(customRole.establishmentName || t('staff.form.accessLabel'));
    });

    setExpandedRoleSections(nextExpandedSections);
  }, [activeDropdown, assignableCustomRoles, isRoleVisibleForTarget, roleSelectionTarget, t]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setUsername(initialData.username || '');
        setEmail(initialData.email || '');
        setPhone(initialData.phone || '');
        setRole(isOwnerMode ? 'ACCOUNT_OWNER' : initialData.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER');
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
        setRolePickerTouched(false);
        setBuiltInEmployeeRoleSelected(
          !initialData.customRoleId &&
            initialData.role.toUpperCase() !== 'ADMIN' &&
            !isOwnerMode,
        );
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
          if (isOwnerMode) {
            setSelectedEstablishmentIds(establishments.map((establishment) => establishment.id));
          } else if (initialData.establishmentIds && initialData.establishmentIds.length > 0) {
            setSelectedEstablishmentIds(initialData.establishmentIds);
          } else if (establishments.length === 1) {
            // If there is only one establishment, pre-select it
            setSelectedEstablishmentIds([establishments[0].id]);
          } else {
            setSelectedEstablishmentIds([]);
          }
        }

        const activeAssignments = (initialData.assignments || []).filter(
          (assignment) => assignment.isActive !== false,
        );
        const nextAssignmentRoleIds: Record<string, string> = {};
        const nextAssignmentRoleNames: Record<string, string> = {};
        const nextAssignmentRoleScopes: Record<string, 'GLOBAL' | 'BRANCH'> = {};
        activeAssignments.forEach((assignment) => {
          const optionId = assignment.customRoleId
            ? customRoleOptionId(assignment.customRoleId)
            : builtInRoleOptionId((assignment.role || initialData.role || 'USER').toUpperCase());
          nextAssignmentRoleIds[assignment.establishmentId] = optionId;

          if (assignment.customRoleId && assignment.customRoleName) {
            nextAssignmentRoleNames[optionId] = assignment.customRoleName;
          }
          if (assignment.customRoleId && assignment.customRoleScope) {
            nextAssignmentRoleScopes[optionId] =
              assignment.customRoleScope === 'GLOBAL' ? 'GLOBAL' : 'BRANCH';
          }
        });
        setAssignmentRoleIds(nextAssignmentRoleIds);
        setAssignmentRoleNames(nextAssignmentRoleNames);
        setAssignmentRoleScopes(nextAssignmentRoleScopes);
        const uniqueRoleOptions = Array.from(new Set(Object.values(nextAssignmentRoleIds)));
        setSameRoleForAllLocations(uniqueRoleOptions.length <= 1);

      } else {
        setName('');
        setUsername('');
        setEmail('');
        setPhone('');
        setRole('USER');
        setPassword('');
        setConfirmPassword('');
        setPermissions([...DEFAULT_EMPLOYEE_POS_PERMISSIONS]);
        setBackofficePermissions(
          buildEffectiveBackofficePermissions(
            [...BACKOFFICE_DEFAULT_PERMISSION_IDS],
            true,
          ),
        );
        setAllDiscountsSelected(true);
        setAllowedDiscounts([]);
        setSelectedCustomRoleId('');
        setRolePickerTouched(false);
        setBuiltInEmployeeRoleSelected(false);
        setLastAppliedTemplate(null);
        setAssignmentRoleIds({});
        setAssignmentRoleNames({});
        setAssignmentRoleScopes({});
        setSameRoleForAllLocations(true);
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
    builtInRoleOptionId,
    customRoleOptionId,
    isOwnerMode,
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

    setRolePickerTouched(true);

    if (roleSelectionTarget !== 'ALL') {
      setAssignmentRoleIds((prev) => ({
        ...prev,
        [roleSelectionTarget]: customRoleOptionId(roleTemplate.id),
      }));
      setActiveDropdown(null);
      return;
    }

    // Safely determine the role type
    const templateRole = (roleTemplate.baseRole || roleTemplate.role || 'USER').toUpperCase();
    const roleType =
      templateRole === 'ADMIN' && canAssignAdminRole ? 'ADMIN' : 'USER';
    setRole(roleType);
    setBuiltInEmployeeRoleSelected(false);

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
    if (sameRoleForAllLocations) {
      setAssignmentRoleIds((prev) => {
        const next = { ...prev };
        selectedEstablishmentIds.forEach((establishmentId) => {
          next[establishmentId] = customRoleOptionId(roleTemplate.id);
        });
        return next;
      });
    }
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
  const [usernameAvailabilityError, setUsernameAvailabilityError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  // Local verified flag so the form can flip to "Email verified" without a full remount
  // (parent list refresh updates initialData.emailVerified via props).
  const [localEmailVerified, setLocalEmailVerified] = useState(
    Boolean(initialData?.emailVerified),
  );

  // Whether the email in the field still matches the saved, verifiable address.
  // A freshly typed address only becomes verifiable after the form is saved.
  const emailMatchesSaved =
    (email || '').trim().toLowerCase() ===
    (initialData?.email || '').trim().toLowerCase();

  const handleResendVerification = async () => {
    if (!initialData?.id) return;
    setResendState('sending');
    try {
      await api.post(`/api/accounts/employees/${initialData.id}/resend-verification`);
      setResendState('sent');
    } catch {
      setResendState('error');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setErrors({}), 0);
      setUsernameAvailabilityError('');
      setIsCheckingUsername(false);
      setResendState('idle');
      setLocalEmailVerified(Boolean(initialData?.emailVerified));
    }
  }, [isOpen, initialData?.id, initialData?.emailVerified]);

  // Parent may refresh staff after the employee clicks the email link — reflect it live.
  useEffect(() => {
    if (initialData?.emailVerified) {
      setLocalEmailVerified(true);
    }
  }, [initialData?.emailVerified]);

  // While pending, quietly re-check verification so the badge flips to green
  // as soon as the employee confirms the link (no need to close the form).
  useEffect(() => {
    if (!isOpen || !initialData?.id || localEmailVerified || !emailMatchesSaved) {
      return;
    }
    if (!(email || '').trim()) return;

    let cancelled = false;
    const poll = async () => {
      try {
        // Prefer location staff endpoint; fall back to owner all-employees.
        let verified = false;
        try {
          const res = await api.get(`/api/users/${initialData.id}`);
          verified = Boolean(res.data?.emailVerified);
        } catch {
          const res = await api.get('/api/accounts/all-employees');
          const match = (res.data || []).find(
            (emp: { id?: string; emailVerified?: boolean }) => emp.id === initialData.id,
          );
          verified = Boolean(match?.emailVerified);
        }
        if (!cancelled && verified) {
          setLocalEmailVerified(true);
        }
      } catch {
        // ignore poll errors
      }
    };

    const intervalId = window.setInterval(poll, 8000);
    // First check shortly after open so a just-verified link shows quickly.
    const timeoutId = window.setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [
    isOpen,
    initialData?.id,
    localEmailVerified,
    emailMatchesSaved,
    email,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const normalizedUsername = username.trim().toLowerCase();
    const initialUsername = initialData?.username?.trim().toLowerCase();

    if (!normalizedUsername || normalizedUsername.length < 3 || normalizedUsername === initialUsername) {
      setUsernameAvailabilityError('');
      setIsCheckingUsername(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const response = await api.get('/api/accounts/employees/availability/username', {
          params: {
            username: normalizedUsername,
            excludeEmployeeId: initialData?.id,
          },
          signal: controller.signal,
        });

        if (response.data?.available === false) {
          setUsernameAvailabilityError(
            response.data.message ||
              t('staff.errors.usernameTaken', {
                defaultValue: 'This username is already used in this account.',
              }),
          );
        } else {
          setUsernameAvailabilityError('');
        }
      } catch (error: any) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          console.warn('[EmployeeFormModal] Username availability check failed:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingUsername(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [initialData?.id, initialData?.username, isOpen, t, username]);

  const errorBannerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - the name is optional, employees without one are shown by username.
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = t('staff.errors.usernameRequired');
    if (usernameAvailabilityError) newErrors.username = usernameAvailabilityError;
    if (!isOwnerMode && requiresEmail && !email.trim()) {
      newErrors.email = t('staff.errors.emailRequired');
    }

    if (!isOwnerMode && role === 'ADMIN' && !canAssignAdminRole) {
      newErrors.role = t('staff.errors.roleNotAllowed', {
        defaultValue: 'You cannot assign the admin role.',
      });
    }

    // Validate role selection - must be one of the built-in roles or a custom
    // role template. An existing employee already carries a decision.
    // Shared-role mode: Admin or a named template, nothing else.
    if (!isOwnerMode && (!establishments || sameRoleForAllLocations) && !isRoleChosenForTarget('ALL')) {
      newErrors.role = t('staff.errors.roleRequired');
    }

    if (
      !isOwnerMode &&
      selectedCustomRoleId &&
      !assignableCustomRoles.some((customRole) => customRole.id === selectedCustomRoleId)
    ) {
      newErrors.role = t('staff.errors.roleNotAllowed', {
        defaultValue: 'You cannot assign this role template.',
      });
    }

    if (!initialData && !password) {
      newErrors.password = t('staff.errors.passwordRequired');
    } else if (password) {
      // Privileged floor when ANY assignment is ADMIN/Back Office (same
      // predicate as requiresEmail). The backend enforces this per
      // assignment and returns a clear message on mismatch.
      const passwordIsPrivileged =
        role === 'ADMIN' ||
        backofficeAccess ||
        (!isOwnerMode &&
          !!establishments &&
          !sameRoleForAllLocations &&
          selectedEstablishmentIds.some((establishmentId) =>
            roleOptionRequiresEmail(getRoleOptionForTarget(establishmentId)),
          )) ||
        (!isOwnerMode &&
          !!selectedCustomRoleId &&
          roleOptionRequiresEmail(customRoleOptionId(selectedCustomRoleId)));
      const passwordMinLength = passwordIsPrivileged
        ? PRIVILEGED_EMPLOYEE_PASSWORD_MIN_LENGTH
        : EMPLOYEE_PASSWORD_MIN_LENGTH;
      if (password.length < passwordMinLength) {
        newErrors.password = t('staff.errors.passwordMin', {
          count: passwordMinLength,
          defaultValue: `Password must be at least ${passwordMinLength} characters`,
        });
      }
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('staff.errors.passwordsNotMatch');
    }

    // Validate establishment selection if in Owner Mode
    if (!isOwnerMode && establishments && selectedEstablishmentIds.length === 0) {
      newErrors.establishments = t('staff.errors.selectLocation');
    }

    // Now that getRoleOptionForTarget no longer invents a role, this guard
    // actually fires — it was unreachable before, which is how locations with
    // no chosen role were being saved as Admin.
    if (!isOwnerMode && establishments && !sameRoleForAllLocations) {
      const missingNames = selectedEstablishmentIds
        .filter((establishmentId) => !isRoleChosenForTarget(establishmentId))
        .map(
          (establishmentId) =>
            establishments.find((item) => item.id === establishmentId)?.name ||
            t('staff.form.locationLabel'),
        );

      if (missingNames.length > 0) {
        newErrors.role = t('staff.errors.roleRequiredForLocations', {
          locations: missingNames.join(', '),
          defaultValue: `Choose a role for: ${missingNames.join(', ')}`,
        });
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the first field that has an error
      setTimeout(() => {
        const firstErrorField = scrollRef.current?.querySelector('.border-mintcom-red, .ring-mintcom-red\\/20');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    setErrors({});

    // Split the optional name into first and last name. An empty name is
    // allowed - the employee is then identified by username everywhere.
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');

    if (isOwnerMode) {
      const ownerPayload: Partial<StaffMember> & { password?: string } = {
        firstName,
        lastName,
        username: username.trim(),
      };
      if (password) {
        ownerPayload.password = password;
      }
      await onSubmit(ownerPayload);
      return;
    }

    const sanitizedPosPermissions = sanitizeAssignablePosPermissions(
      normalizeAndFilterPermissions(permissions, ALLOWED_POS_PERMISSION_IDS),
    );
    const effectiveBackofficePermissions = buildEffectiveBackofficePermissions(
      normalizeAndFilterPermissions(backofficePermissions, ALLOWED_BACKOFFICE_PERMISSION_IDS),
      backofficeAccess,
    );
    const buildAssignmentPayload = (establishmentId: string) => {
      const optionId = getRoleOptionForTarget(
        sameRoleForAllLocations ? 'ALL' : establishmentId,
      );
      const customRole = getRoleTemplateByOptionId(optionId);
      const builtInRole = optionId?.startsWith('builtin:')
        ? optionId.slice(8).toUpperCase()
        : undefined;

      return {
        establishmentId,
        // `role.toUpperCase()` is only reachable in same-role mode, where the
        // top-level picker is the explicit choice. Per-location mode is gated
        // by validation, so an unchosen location can never be posted as Admin.
        role: customRole
          ? (customRole.baseRole || customRole.role || 'USER').toUpperCase()
          : builtInRole || role.toUpperCase(),
        customRoleId: customRole?.id || null,
        permissions: customRole ? customRole.permissions : sanitizedPosPermissions,
        allowedDiscounts: customRole
          ? customRole.allowedDiscounts || []
          : allDiscountsSelected
            ? []
            : allowedDiscounts,
        posAccess: customRole ? customRole.posAccess !== false : posAccess,
        backofficeAccess: customRole ? !!customRole.backofficeAccess : backofficeAccess,
        backofficePermissions: customRole
          ? customRole.backofficePermissions || []
          : effectiveBackofficePermissions,
      };
    };

    // Send a role decision only when one was actually made here. Picking the
    // built-in Admin role has to clear the previous template explicitly (null),
    // otherwise the assignment keeps resolving from the old role at login and
    // the change reads back undone. Leaving the picker alone sends neither
    // field: the form only ever displays a template's base role as Admin or
    // Employee, so re-asserting it would look like a role change to the backend
    // and would break a Cashier/Manager template on an unrelated edit.
    const roleDecision =
      rolePickerTouched || !initialData
        ? {
            role: role.toUpperCase(),
            customRoleId:
              selectedCustomRoleId &&
              assignableCustomRoles.some((customRole) => customRole.id === selectedCustomRoleId)
                ? selectedCustomRoleId
                : null,
          }
        : {};

    const payload: Partial<StaffMember> & { password?: string } = {
      firstName,
      lastName,
      username,
      email: email || undefined,
      phone: phone || undefined,
      ...roleDecision,
      permissions: role === 'ADMIN'
        ? POS_PERMISSIONS.map(p => p.id)
        : Array.from(new Set([
            ...sanitizedPosPermissions,
            ...(posAccess ? ['pos', 'void_items'] : []),
          ])),
      allowedDiscounts: allDiscountsSelected ? [] : allowedDiscounts,
      ...(establishments && { establishmentIds: selectedEstablishmentIds }),
      ...(establishments && {
        assignments: selectedEstablishmentIds.map(buildAssignmentPayload),
      }),
      // Platform access control
      posAccess,
      backofficeAccess,
      backofficePermissions: effectiveBackofficePermissions,
    };

    if (password) {
      payload.password = password;
    }

    await onSubmit(payload);
  };

  /**
   * The role list, rendered inline directly beneath whichever trigger opened
   * it. It used to be rendered once after the whole location list, so opening
   * the first location popped the panel open at the bottom of the section.
   */
  const renderRoleDropdown = (target: 'ALL' | string) => (
    <AnimatePresence>
      {activeDropdown === 'ROLE' && roleSelectionTarget === target && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-3 w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl z-[50] max-h-80 flex flex-col shadow-2xl overflow-hidden"
                    >
                      {/* Which target this list is editing. Without it the
                          list looks identical for every location, which is
                          what made a per-location picker so confusing. */}
                      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.03]">
                        {roleSelectionTarget === 'ALL' ? (
                          <>
                            <Globe size={11} className="text-gray-400 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 truncate">
                              {establishments && selectedEstablishmentIds.length > 1
                                ? t('staff.form.roleForAllLocations', { defaultValue: 'Role for all locations' })
                                : t('staff.form.roleLabel', { defaultValue: 'Role' })}
                            </span>
                          </>
                        ) : (
                          <>
                            <MapPin size={11} className="text-mintcom-green shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 truncate">
                              {establishments?.find((item) => item.id === roleSelectionTarget)?.name ||
                                t('staff.form.locationLabel')}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {/* Admin Option */}
                        {canAssignAdminRole && (
                          <button
                            type="button"
                            onClick={() => {
                              setRolePickerTouched(true);
                              if (roleSelectionTarget !== 'ALL') {
                                setAssignmentRoleIds((prev) => ({
                                  ...prev,
                                  [roleSelectionTarget]: builtInRoleOptionId('ADMIN'),
                                }));
                                setActiveDropdown(null);
                                return;
                              }
                              setRole('ADMIN');
                              setSelectedCustomRoleId('');
                              setBuiltInEmployeeRoleSelected(false);
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
                              if (sameRoleForAllLocations) {
                                setAssignmentRoleIds((prev) => {
                                  const next = { ...prev };
                                  selectedEstablishmentIds.forEach((establishmentId) => {
                                    next[establishmentId] = builtInRoleOptionId('ADMIN');
                                  });
                                  return next;
                                });
                              }
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${activeTargetOptionId === builtInRoleOptionId('ADMIN') ? 'bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                          >
                            <div>
                              <span className={`text-xs font-bold ${activeTargetOptionId === builtInRoleOptionId('ADMIN') ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {t('staff.form.adminRole')}
                              </span>
                              <p className="text-xs font-bold text-gray-500 mt-0.5">{t('staff.form.adminDesc')}</p>
                            </div>
                            {activeTargetOptionId === builtInRoleOptionId('ADMIN') && <Check size={14} className="text-blue-500" />}
                          </button>
                        )}

                        {/* The built-in "Employee (Custom Permissions)" option used to
                            live here. It promised a permission list this form does not
                            have, and on save it silently carried over whatever
                            permissions the assignment already held - so an admin
                            "demoted" to Employee kept every admin permission. Every
                            assignment now needs a named role instead; legacy rows with
                            no role are flagged on the trigger and block save. */}

                        {/* Global Roles Section - Accordion */}
                        {assignableCustomRoles.filter(r => r.isGlobal && isRoleVisibleForTarget(r, roleSelectionTarget)).length > 0 && (
                          <div className="mt-2">
                            <div className="border-t border-gray-100 dark:border-white/5 mb-2" />
                            <button
                              type="button"
                              onClick={(e) => toggleSection('global', e)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                <Globe size={11} className="text-blue-500 shrink-0" />
                                <span className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase truncate">{t('staff.form.globalRoles')}</span>
                              </span>
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
                                  {assignableCustomRoles.filter(r => r.isGlobal && isRoleVisibleForTarget(r, roleSelectionTarget)).map(customRole => (
                                    <button
                                      key={customRole.id}
                                      type="button"
                                      onClick={() => handleTemplateSelect(customRole)}
                                      className={`w-full flex items-center justify-between p-3 pl-5 rounded-lg text-left transition-colors ${activeTargetOptionId === customRoleOptionId(customRole.id) ? 'bg-mintcom-green/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                    >
                                      <div className="min-w-0">
                                        <span className={`text-xs font-bold ${activeTargetOptionId === customRoleOptionId(customRole.id) ? 'text-mintcom-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                          {customRole.name}
                                        </span>
                                        <p className="text-xs font-bold text-gray-500 mt-0.5">{t('staff.form.permissionsCount', { count: customRole.permissions.length + (customRole.backofficePermissions?.length || 0) })}</p>
                                      </div>
                                      {activeTargetOptionId === customRoleOptionId(customRole.id) && <Check size={14} className="text-mintcom-green" />}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Establishment-Specific Roles - Accordion */}
                        {(() => {
                          const estRoles = assignableCustomRoles.filter(r => !r.isGlobal && isRoleVisibleForTarget(r, roleSelectionTarget));
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
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <MapPin size={11} className="text-gray-400 shrink-0" />
                                  <span className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest uppercase truncate max-w-[200px]">{estName}</span>
                                </span>
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
                                        className={`w-full flex items-center justify-between p-3 pl-5 rounded-lg text-left transition-colors ${activeTargetOptionId === customRoleOptionId(customRole.id) ? 'bg-mintcom-green/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                      >
                                        <div className="min-w-0">
                                          <span className={`text-xs font-bold ${activeTargetOptionId === customRoleOptionId(customRole.id) ? 'text-mintcom-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {customRole.name}
                                          </span>
                                          <p className="text-xs font-bold text-gray-500 mt-0.5">{t('staff.form.permissionsCount', { count: customRole.permissions.length + (customRole.backofficePermissions?.length || 0) })}</p>
                                        </div>
                                        {activeTargetOptionId === customRoleOptionId(customRole.id) && <Check size={14} className="text-mintcom-green" />}
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
                          </div>
                        )}

                        {/* Create a role without leaving the employee form. Removing
                            the free-permissions option would otherwise mean bouncing
                            to the Roles page mid-edit just to name a new role. */}
                        <div className="mt-2 border-t border-gray-100 dark:border-white/5 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdown(null);
                              setIsCreatingRole(true);
                            }}
                            className="w-full flex items-center gap-2 p-3 rounded-lg text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <span className="w-6 h-6 rounded-lg bg-mintcom-green/10 text-mintcom-green flex items-center justify-center shrink-0">
                              <Plus size={13} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-xs font-bold text-mintcom-green">
                                {t('staff.form.createRole', { defaultValue: 'Create a new role…' })}
                              </span>
                              <span className="block text-xs font-bold text-gray-500 mt-0.5 truncate">
                                {newRoleScopeLabel}
                              </span>
                            </span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
      )}
    </AnimatePresence>
  );

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

          <div ref={scrollRef} className="overflow-y-auto p-4 sm:p-8 pt-4 custom-scrollbar flex-1 pb-safe">
            <form
              id="employee-form"
              onSubmit={handleSubmit}
              autoComplete="off"
              className="space-y-6"
            >
              {/* Error Banner */}
              {Object.keys(errors).length > 0 && (
                <div ref={errorBannerRef} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {t('common.validationError')}
                </div>
              )}

              {/* Name (optional) */}
              <div className="space-y-2">
                <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                  {t('staff.form.nameLabel')} {t('staff.form.nameOptional', { defaultValue: '(Optional)' })}
                </label>
                <input maxLength={255}
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder={formatInputPlaceholder(t('staff.form.namePlaceholder'), t('common.locale'))}
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green transition-colors`}
                />
                {errors.name && <p className="mt-1 text-xs font-bold text-mintcom-red">{errors.name}</p>}
              </div>

              {/* Establishment Selection (Only if establishments prop is provided) */}
              {establishments && (
                <div className="relative space-y-2">
                  <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                    {t('staff.form.accessLabel')} <span className="text-mintcom-red">*</span>
                  </label>
                  {isOwnerMode ? (
                    <div className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-left flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {t('staff.form.allLocations')}
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-wide text-gray-400">
                        {t('common.locked', { defaultValue: 'Locked' })}
                      </span>
                    </div>
                  ) : (
                    <button
                      ref={establishmentButtonRef}
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === 'ESTABLISHMENT' ? null : 'ESTABLISHMENT')}
                      className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.establishments ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-left flex items-center justify-between transition-colors`}
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
                  )}
                  {errors.establishments && <p className="mt-1 text-xs font-bold text-mintcom-red">{errors.establishments}</p>}

                  {/* Portal Dropdown */}
                  <AnimatePresence>
                    {!isOwnerMode && activeDropdown === 'ESTABLISHMENT' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl z-[50] max-h-[340px] flex flex-col shadow-2xl overflow-hidden"
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
                                    setSelectedEstablishmentIds(prev => {
                                      const isRemoving = prev.includes(est.id);
                                      setAssignmentRoleIds((current) => {
                                        const updated = { ...current };
                                        if (isRemoving) {
                                          delete updated[est.id];
                                        } else {
                                          // Newly ticked location: seed it with
                                          // the shared role only if one is set,
                                          // otherwise leave it unchosen.
                                          const shared = getRoleOptionForTarget('ALL');
                                          if (shared) updated[est.id] = shared;
                                        }
                                        return updated;
                                      });
                                      return isRemoving
                                        ? prev.filter(id => id !== est.id)
                                        : [...prev, est.id];
                                    });
                                  }}
                                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${isSelected ? 'bg-mintcom-green/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                  <span className={`text-xs font-bold ${isSelected ? 'text-mintcom-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {est.name}
                                  </span>
                                  {isSelected && <Check size={14} className="text-mintcom-green" />}
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
                            className="w-full py-2.5 bg-mintcom-green text-black font-black text-xs tracking-wide rounded-lg hover:bg-mintcom-green/90 transition-colors shadow-sm"
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
                  <span className="flex items-center gap-1">{t('staff.form.roleLabel')} <span className="text-mintcom-red">*</span></span>
                  {!isOwnerMode && isModifiedFromTemplate() && (
                    <span className="text-mintcom-red lowercase font-bold tracking-normal">{t('staff.form.modified')}</span>
                  )}
                </label>
                {/* Show hint if no establishments selected in owner mode */}
                {isOwnerMode ? (
                  <div className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-left flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {t('common.owner', { defaultValue: 'Owner' })}
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wide text-gray-400">
                      {t('common.locked', { defaultValue: 'Locked' })}
                    </span>
                  </div>
                ) : establishments && selectedEstablishmentIds.length === 0 ? (
                  <div className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-left">
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500">{t('staff.form.selectLocation')}</span>
                  </div>
                ) : (
                  <>
                    {/* Mode switch. A segmented control replaces the old
                        checkbox: the two modes show different controls, so the
                        choice needs to read as a mode, not an option. */}
                    {establishments && selectedEstablishmentIds.length > 1 && (
                      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-white/5 p-1">
                        {([true, false] as const).map((sameMode) => (
                          <button
                            key={String(sameMode)}
                            type="button"
                            onClick={() => {
                              setActiveDropdown(null);
                              setSameRoleForAllLocations(sameMode);
                              if (!sameMode) {
                                // Entering per-location mode seeds each location
                                // with the shared choice so nothing silently
                                // resets, but only when one was actually made.
                                const shared = getRoleOptionForTarget('ALL');
                                if (shared) {
                                  setAssignmentRoleIds((current) => {
                                    const next = { ...current };
                                    selectedEstablishmentIds.forEach((establishmentId) => {
                                      if (!next[establishmentId]) next[establishmentId] = shared;
                                    });
                                    return next;
                                  });
                                }
                              }
                            }}
                            className={`rounded-lg px-3 py-2 text-xs font-black tracking-tight transition-colors ${
                              sameRoleForAllLocations === sameMode
                                ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                          >
                            {sameMode
                              ? t('staff.form.roleModeShared', { defaultValue: 'One role everywhere' })
                              : t('staff.form.roleModePerLocation', { defaultValue: 'Role per location' })}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Shared-role trigger */}
                    {(sameRoleForAllLocations || !establishments || selectedEstablishmentIds.length <= 1) && (
                      <>
                        <button
                          ref={rolesButtonRef}
                          data-role-trigger="ALL"
                          type="button"
                          onClick={() => {
                            setRoleSelectionTarget('ALL');
                            setActiveDropdown(activeDropdown === 'ROLE' ? null : 'ROLE');
                          }}
                          className={`w-full rounded-xl px-4 py-3 text-left flex items-center justify-between gap-3 border transition-colors ${
                            isRoleChosenForTarget('ALL')
                              ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
                              : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30'
                          }`}
                        >
                          <span className="min-w-0 flex items-center gap-2">
                            <span className={`text-sm font-bold truncate ${isRoleChosenForTarget('ALL') ? 'text-gray-900 dark:text-white' : 'text-amber-700 dark:text-amber-400'}`}>
                              {getRoleOptionForTarget('ALL')
                                ? getRoleOptionLabel(getRoleOptionForTarget('ALL'))
                                : t('staff.form.chooseRole', { defaultValue: 'Choose a role' })}
                            </span>
                            <RoleScopeBadge scope={getRoleOptionScope(getRoleOptionForTarget('ALL'))} t={t} />
                          </span>
                          <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${activeDropdown === 'ROLE' ? 'rotate-180' : ''}`} />
                        </button>

                        {establishments && selectedEstablishmentIds.length > 1 && (
                          <p className="mt-2 px-1 text-[11px] font-bold text-gray-400 dark:text-gray-500">
                            {t('staff.form.appliesToLocations', {
                              count: selectedEstablishmentIds.length,
                              defaultValue: `Applies to all ${selectedEstablishmentIds.length} locations`,
                            })}
                          </p>
                        )}

                        {renderRoleDropdown('ALL')}
                      </>
                    )}

                    {/* Per-location list. Each location owns its own choice and
                        an unchosen one is called out instead of inheriting a
                        role the employee was never given. */}
                    {establishments && !sameRoleForAllLocations && selectedEstablishmentIds.length > 1 && (
                      <div className="space-y-2">
                        {selectedEstablishmentIds.map((establishmentId) => {
                          const establishment = establishments.find((item) => item.id === establishmentId);
                          const optionId = getRoleOptionForTarget(establishmentId);
                          const isChosen = isRoleChosenForTarget(establishmentId);
                          const isOpenForThis = activeDropdown === 'ROLE' && roleSelectionTarget === establishmentId;

                          return (
                            <div key={establishmentId}>
                            <button
                              data-role-trigger={establishmentId}
                              type="button"
                              onClick={() => {
                                setRoleSelectionTarget(establishmentId);
                                setActiveDropdown(isOpenForThis ? null : 'ROLE');
                              }}
                              className={`w-full rounded-xl px-4 py-3 text-left flex items-center justify-between gap-3 border transition-colors ${
                                isChosen
                                  ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
                                  : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30'
                              }`}
                            >
                              <span className="min-w-0">
                                <span className="flex items-center gap-1.5">
                                  <MapPin size={10} className="text-gray-400 shrink-0" />
                                  <span className="block text-xs font-black text-gray-500 dark:text-gray-400 truncate">
                                    {establishment?.name || t('staff.form.locationLabel')}
                                  </span>
                                </span>
                                <span className="mt-0.5 flex items-center gap-2">
                                  <span className={`text-sm font-bold truncate ${isChosen ? 'text-gray-900 dark:text-white' : 'text-amber-700 dark:text-amber-400'}`}>
                                    {optionId
                                      ? getRoleOptionLabel(optionId)
                                      : t('staff.form.chooseRole', { defaultValue: 'Choose a role' })}
                                  </span>
                                  <RoleScopeBadge scope={getRoleOptionScope(optionId)} t={t} />
                                </span>
                              </span>
                              <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isOpenForThis ? 'rotate-180' : ''}`} />
                            </button>
                            {renderRoleDropdown(establishmentId)}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Dashboard Mode: Show current establishment name under role selection */}
                    {!establishments && currentEstablishment?.name && (
                      <div className="flex items-center gap-1.5 mt-1.5 px-1 opacity-80">
                        <MapPin size={10} className="text-mintcom-green" />
                        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-tight">{currentEstablishment.name}</span>
                      </div>
                    )}

                  </>
                )}
                {errors.role && (
                  <p className="text-mintcom-red text-xs font-bold mt-2">{errors.role}</p>
                )}

                {/* UX Improvement: Location Disclaimer */}
                {!establishments && (
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-mintcom-green/10 text-mintcom-green flex items-center justify-center shrink-0">
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
                            className="text-mintcom-green hover:underline cursor-pointer"
                          />
                        ]}
                      />
                    </p>                  </div>
                )}
              </div>

              {/* Email - only shown for roles with website/Back Office access.
                  POS-only staff sign in by username, so the field is hidden
                  entirely rather than shown as optional (less confusing). When
                  visible it is always required. */}
              {!isOwnerMode && requiresEmail && (
                <div className="space-y-2">
                  <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                    {t('staff.form.emailLabel')} <span className="text-mintcom-red">*</span>
                  </label>
                  <input maxLength={255}
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setResendState('idle'); if (errors.email) setErrors({ ...errors, email: '' }); }}
                    placeholder={formatInputPlaceholder(t('staff.form.emailPlaceholder'), t('common.locale'))}
                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.email ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green transition-colors`}
                  />
                  {/* Verification status. Only meaningful for a saved address —
                      a freshly typed/changed email is verified after saving. */}
                  {initialData?.id && emailMatchesSaved && email.trim() ? (
                    localEmailVerified ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-mintcom-green">
                        <Check size={13} strokeWidth={3} />
                        {t('staff.form.emailVerified', { defaultValue: 'Email verified' })}
                      </p>
                    ) : (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {t('staff.form.emailPending', { defaultValue: 'Email pending' })}
                        </span>
                        {resendState === 'sent' ? (
                          <span className="text-xs font-bold text-mintcom-green">
                            {t('staff.form.emailResent', { defaultValue: 'Link sent ✓' })}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={resendState === 'sending'}
                            className="text-xs font-bold text-mintcom-green hover:underline disabled:opacity-50"
                          >
                            {resendState === 'sending'
                              ? t('common.sending', { defaultValue: 'Sending…' })
                              : resendState === 'error'
                                ? t('common.tryAgain', { defaultValue: 'Try again' })
                                : t('staff.form.resendVerification', { defaultValue: 'Resend verification' })}
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    <p className="mt-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                      {t('staff.form.emailVerifyHint', {
                        defaultValue: 'We’ll email a confirmation link to verify this address so password recovery works.',
                      })}
                    </p>
                  )}
                  {errors.email && <p className="mt-1 text-xs font-bold text-mintcom-red">{errors.email}</p>}
                </div>
              )}

              {/* Username */}
              <div className="space-y-2">
                <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                  {t('staff.form.usernameLabel')} <span className="text-mintcom-red">*</span>
                </label>
                <input maxLength={255}
                  type="text"
                  value={username}
                  // This is an account-creation field, never a sign-in field. `new-password`
                  // prevents browsers/password managers from inserting a saved login username.
                  autoComplete="new-password"
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameAvailabilityError('');
                    if (errors.username) setErrors({ ...errors, username: '' });
                  }}
                  placeholder={formatInputPlaceholder(t('staff.form.usernamePlaceholder'), t('common.locale'))}
                  className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.username || usernameAvailabilityError ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green transition-colors`}
                />
                {(errors.username || usernameAvailabilityError) && (
                  <p className="mt-1 text-xs font-bold text-mintcom-red">
                    {errors.username || usernameAvailabilityError}
                  </p>
                )}
                {isCheckingUsername && !errors.username && !usernameAvailabilityError && (
                  <p className="mt-1 text-xs font-bold text-gray-400">
                    {t('staff.form.checkingUsername', { defaultValue: 'Checking username...' })}
                  </p>
                )}
              </div>

              {/* Phone */}
              {!isOwnerMode && (
                <div className="space-y-2">
                  <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                    {t('staff.form.phoneLabel')} {t('staff.form.phoneOptional')}
                  </label>
                  <input maxLength={255}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={formatInputPlaceholder(t('staff.form.phonePlaceholder'), t('common.locale'))}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green transition-colors"
                  />
                </div>
              )}

              {/* Password wrapper start (to match existing indentation/structure) */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-2">
                <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                  {initialData ? t('staff.form.newPasswordOptional') : t('staff.form.passwordLabel')} {(!initialData) && <span className="text-mintcom-red">*</span>}
                </label>
                <div className="relative">
                  <input maxLength={255}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
                    placeholder={formatInputPlaceholder(initialData ? t('staff.form.leaveBlank') : t('staff.form.passwordPlaceholder'), t('common.locale'))}
                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.password ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 pr-12 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                  {t('staff.form.passwordRequirements', {
                    defaultValue: 'At least 6 characters (any characters).',
                  })}
                </p>
                <p className="mt-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                  {t('staff.form.passwordAdminHint', {
                    defaultValue:
                      'Staff cannot reset their own POS password. Leave blank to keep the current one. Passwords are never shown, for security. Only enter a value if you want a new password to share with them.',
                  })}
                </p>
                {errors.password && <p className="mt-1 text-xs font-bold text-mintcom-red">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-normal text-gray-900 dark:text-white flex items-center gap-1 tracking-tight">
                  {t('staff.form.confirmPasswordLabel')} {(!initialData || password) && <span className="text-mintcom-red">*</span>}
                </label>
                <div className="relative">
                  <input maxLength={255}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }); }}
                    placeholder={formatInputPlaceholder(t('staff.form.confirmPasswordPlaceholder', { defaultValue: 'Enter Password' }), t('common.locale'))}
                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.confirmPassword ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3 pr-12 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs font-bold text-mintcom-red">{errors.confirmPassword}</p>}
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-8 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 sm:gap-4 bg-white dark:bg-[#1E293B] sticky bottom-0 pb-safe">
            {initialData && onDelete && !isOwnerMode && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                title={t('common.deactivate')}
                className="w-14 h-14 flex items-center justify-center bg-mintcom-red/10 text-mintcom-red rounded-xl hover:bg-mintcom-red/20 transition-colors border border-mintcom-red/20"
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
              className="flex-1 h-12 sm:h-14 rounded-xl bg-mintcom-green text-black font-barlow font-black text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-mintcom-green/20 disabled:opacity-50 flex items-center justify-center"
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

      {/* Nested role form. Both are portals, so this simply stacks on top and
          returns to the employee form with the new role already selected. */}
      {isCreatingRole && (
        <CustomRoleFormModal
          isOpen={isCreatingRole}
          onClose={() => setIsCreatingRole(false)}
          onSubmit={handleCreateRoleSubmit}
          isSubmitting={isSavingNewRole}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}
