import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Common validation schemas for the PayMint Landing application.
 * Centralizing these allows for consistent validation logic across pages 
 * and enables robust unit testing.
 */

export const getSignUpSchema = (t: TFunction) => {
  return z.object({
    firstName: z.string().min(2, t('auth.validation.firstNameMin')),
    lastName: z.string().min(2, t('auth.validation.lastNameMin')),
    email: z.string().email(t('auth.validation.emailInvalid')),
    password: z
      .string()
      .min(8, t('auth.validation.passwordMin'))
      .regex(/[A-Z]/, t('auth.validation.passwordUppercase'))
      .regex(/[a-z]/, t('auth.validation.passwordLowercase'))
      .regex(/[0-9]/, t('auth.validation.passwordNumber')),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: t('auth.validation.termsRequired'),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordsDoNotMatch'),
    path: ['confirmPassword'],
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
