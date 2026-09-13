import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Common validation schemas for the Mintcom Landing application.
 * Centralizing these allows for consistent validation logic across pages
 * and enables robust unit testing.
 */

/**
 * Password policy — single source of truth for every password field on the
 * website. Mirrors the API's constants in
 * `mintcom-api/src/common/security/password.policy.ts`.
 *
 * Two tiers (TC-044 two-tier decision):
 * - STRONG_PASSWORD (owners, locations, brands, admin users):
 *   min 8 chars, upper + lower + digit + symbol.
 * - EMPLOYEE_PASSWORD (POS login-path employees):
 *   upper + lower + digit, no symbol; length floor matches the API employee
 *   policy (4). Used by surfaces that create/edit POS staff.
 *
 * TC-044 drifted because this chain was copy-pasted into four places — do not
 * hand-roll it again, import the tier you need.
 */
export const STRONG_PASSWORD = {
  min: 8,
  checks: [
    { key: 'passwordUppercase', regex: /[A-Z]/ },
    { key: 'passwordLowercase', regex: /[a-z]/ },
    { key: 'passwordNumber', regex: /[0-9]/ },
    { key: 'passwordSymbol', regex: /[^A-Za-z0-9]/ },
  ],
} as const;

export const EMPLOYEE_PASSWORD = {
  min: 4,
  checks: [
    { key: 'passwordUppercase', regex: /[A-Z]/ },
    { key: 'passwordLowercase', regex: /[a-z]/ },
    { key: 'passwordNumber', regex: /[0-9]/ },
  ],
} as const;

export const DEFAULT_PASSWORD_POLICY = STRONG_PASSWORD;

const buildPasswordSchema = (
  t: TFunction,
  keyPrefix: 'auth.validation' | 'validation',
  policy: typeof STRONG_PASSWORD | typeof EMPLOYEE_PASSWORD,
) => {
  let schema = z.string().min(policy.min, t(`${keyPrefix}.passwordMin`));
  policy.checks.forEach(check => {
    schema = schema.regex(check.regex, t(`${keyPrefix}.${check.key}`));
  });
  return schema;
};

export const getPasswordSchema = (
  t: TFunction,
  keyPrefix: 'auth.validation' | 'validation' = 'auth.validation',
) => buildPasswordSchema(t, keyPrefix, STRONG_PASSWORD);

export const getEmployeePasswordSchema = (
  t: TFunction,
  keyPrefix: 'auth.validation' | 'validation' = 'auth.validation',
) => buildPasswordSchema(t, keyPrefix, EMPLOYEE_PASSWORD);

export const getSignUpSchema = (t: TFunction) => {
  return z.object({
    firstName: z.string().trim().min(2, t('auth.validation.firstNameMin')),
    lastName: z.string().trim().min(2, t('auth.validation.lastNameMin')),
    email: z.string().trim().email(t('auth.validation.emailInvalid')),
    password: getPasswordSchema(t),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: t('auth.validation.termsRequired'),
    }),
  });
};

export const getLoginSchema = (t: TFunction) => {
  return z.object({
    email: z.string().email(t('auth.validation.emailInvalid')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  });
};

export const getContactSchema = (t: TFunction) => {
  return z.object({
    name: z.string().min(2, t('landing.contact.validation.nameMin')),
    email: z.string().email(t('landing.contact.validation.emailInvalid')),
    subject: z.string().min(2, t('landing.contact.validation.subjectMin')),
    message: z.string().min(10, t('landing.contact.validation.messageMin')),
  });
};

export type SignUpFormData = z.infer<ReturnType<typeof getSignUpSchema>>;
export type LoginFormData = z.infer<ReturnType<typeof getLoginSchema>>;
export type ContactFormData = z.infer<ReturnType<typeof getContactSchema>>;
