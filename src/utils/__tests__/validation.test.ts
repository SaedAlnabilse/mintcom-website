import { describe, it, expect } from 'vitest';
import { getSignUpSchema, getLoginSchema } from '../validation';

// Mocking the translation strings
const t = (key: string) => key;

describe('Validation Schemas', () => {
  describe('SignUp Schema', () => {
    const signUpSchema = getSignUpSchema(t as any);

    it('should validate a correct signup object', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        agreeToTerms: true,
      };
      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if passwords do not match', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword123',
        agreeToTerms: true,
      };
      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.find(i => i.path.includes('confirmPassword'))?.message).toBe('auth.validation.passwordsDoNotMatch');
      }
    });
  });

  describe('Login Schema', () => {
    const loginSchema = getLoginSchema(t as any);

    it('should validate a correct login object', () => {
      const validData = {
        email: 'john.doe@example.com',
        password: 'Password123',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if email is invalid', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('auth.validation.emailInvalid');
      }
    });
  });
});
