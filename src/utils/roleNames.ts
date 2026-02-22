import type { TFunction } from 'i18next';

const SYSTEM_ROLE_NAME_KEYS: Record<string, string> = {
  'back office analyst': 'roles.systemNames.backOfficeAnalyst',
  'backoffice analyst': 'roles.systemNames.backOfficeAnalyst',
  cashier: 'roles.systemNames.cashier',
  'inventory manager': 'roles.systemNames.inventoryManager',
  'operations manager': 'roles.systemNames.operationsManager',
  'shift supervisor': 'roles.systemNames.shiftSupervisor',
};

const normalizeRoleName = (roleName: string) =>
  roleName
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

export const getLocalizedRoleName = (roleName: string, t: TFunction): string => {
  if (!roleName) return '';

  const key = SYSTEM_ROLE_NAME_KEYS[normalizeRoleName(roleName)];
  if (!key) return roleName;

  const translated = t(key);
  return translated === key ? roleName : translated;
};

