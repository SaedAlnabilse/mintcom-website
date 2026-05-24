import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_APP_SETTINGS_UPDATE_KEYS,
  MAX_SERVICE_CHARGE_VALUE,
  buildAppSettingsUpdatePayload,
  getChangedAppSettingsKeys,
  normalizeBackendTaxRateForForm,
} from '../settingsPayload';

describe('settings update payload', () => {
  it('removes backend read-only and relation fields before saving', () => {
    const payload = buildAppSettingsUpdatePayload({
      id: 'settings_1',
      establishmentId: 'est_1',
      createdAt: '2026-05-24T00:00:00.000Z',
      updatedAt: '2026-05-24T00:00:00.000Z',
      discounts: [{ id: 'discount_1' }],
      paymentMethods: [{ id: 'payment_1' }],
      operatingSchedule: {
        monday: { isOpen: true, open: '09:00', close: '22:00' },
      },
      email: 'store@example.com',
      loginId: 'mintcom-cafe',
      receiptHeader: 'Welcome',
      restaurantName: 'Mintcom Cafe',
      restaurantDescription: 'Fast service',
      restaurantAddress: 'Amman',
      taxRate: 16,
      serviceChargeEnabled: true,
      serviceChargeName: 'Service',
      serviceChargeType: 'PERCENTAGE',
      serviceChargeValue: 5,
      serviceChargeTaxable: true,
      serviceChargeAutoApply: true,
      serviceChargeAllowCashierOverride: false,
      holdOrderTableCount: 18,
    });

    for (const key of FORBIDDEN_APP_SETTINGS_UPDATE_KEYS) {
      expect(payload).not.toHaveProperty(key);
    }
  });

  it('builds the sales setup fields in the backend format', () => {
    const payload = buildAppSettingsUpdatePayload({
      taxRate: 8.5,
      currency: 'jod',
      serviceChargeEnabled: true,
      serviceChargeName: 'Dining charge',
      serviceChargeType: 'FIXED',
      serviceChargeValue: '2.75',
      serviceChargeTaxable: false,
      serviceChargeAutoApply: false,
      serviceChargeAllowCashierOverride: true,
      holdOrderTableCount: 12.9,
    });

    expect(payload).toMatchObject({
      taxRate: 0.085,
      currency: 'JOD',
      serviceChargeEnabled: true,
      serviceChargeName: 'Dining charge',
      serviceChargeType: 'FIXED',
      serviceChargeValue: 2.75,
      serviceChargeTaxable: false,
      serviceChargeAutoApply: false,
      serviceChargeAllowCashierOverride: true,
      holdOrderTableCount: 12,
    });
  });

  it('falls back to zero for invalid numeric sales fields', () => {
    const payload = buildAppSettingsUpdatePayload({
      taxRate: 'not-a-number',
      serviceChargeValue: 'abc',
      holdOrderTableCount: 'abc',
    });

    expect(payload.taxRate).toBe(0);
    expect(payload.serviceChargeValue).toBe(0);
    expect(payload.holdOrderTableCount).toBe(20);
  });

  it('caps service charge value at the backend limit', () => {
    const payload = buildAppSettingsUpdatePayload({
      serviceChargeValue: MAX_SERVICE_CHARGE_VALUE + 1,
    });

    expect(payload.serviceChargeValue).toBe(MAX_SERVICE_CHARGE_VALUE);
  });

  it('preserves receipt/profile booleans and explicit logo removal', () => {
    const payload = buildAppSettingsUpdatePayload({
      restaurantName: 'A'.repeat(150),
      restaurantDescription: 'Short tagline',
      restaurantAddress: 'Main Street',
      logo: null,
      receiptLogo: 'https://cdn.example.com/logo.png',
      showRestaurantName: false,
      showLogoOnReceipt: true,
      showDescription: false,
      showAddress: true,
      showTaxId: false,
      showFarewellMessage: true,
      taxIdNumber: 'VAT-123-ABC',
      farewellMessage: 'Thank you',
    });

    expect(payload.restaurantName).toHaveLength(50);
    expect(payload.logo).toBeNull();
    expect(payload.receiptLogo).toBe('https://cdn.example.com/logo.png');
    expect(payload.showRestaurantName).toBe(false);
    expect(payload.showDescription).toBe(false);
    expect(payload.showTaxId).toBe(false);
    expect(payload.taxIdNumber).toBe('123');
  });

  it('can build a sales-only dirty payload without unrelated profile fields', () => {
    const payload = buildAppSettingsUpdatePayload(
      {
        restaurantName: 'Unchanged location name',
        restaurantAddress: 'Unchanged address',
        taxRate: 7,
        serviceChargeEnabled: true,
        holdOrderTableCount: 55,
      },
      ['taxRate', 'serviceChargeEnabled', 'holdOrderTableCount'],
    );

    expect(payload).toEqual({
      taxRate: 0.07,
      serviceChargeEnabled: true,
      holdOrderTableCount: 55,
    });
  });

  it('detects service charge fields as saveable form changes', () => {
    const changedKeys = getChangedAppSettingsKeys(
      {
        serviceChargeEnabled: true,
        serviceChargeName: 'Dining charge',
        serviceChargeType: 'FIXED',
        serviceChargeValue: 2,
        serviceChargeTaxable: true,
        serviceChargeAutoApply: false,
        serviceChargeAllowCashierOverride: true,
      },
      {
        serviceChargeEnabled: false,
        serviceChargeName: 'Service Charge',
        serviceChargeType: 'PERCENTAGE',
        serviceChargeValue: 0,
        serviceChargeTaxable: false,
        serviceChargeAutoApply: true,
        serviceChargeAllowCashierOverride: false,
      },
    );

    expect([...changedKeys].sort()).toEqual([
      'serviceChargeAllowCashierOverride',
      'serviceChargeAutoApply',
      'serviceChargeEnabled',
      'serviceChargeName',
      'serviceChargeTaxable',
      'serviceChargeType',
      'serviceChargeValue',
    ]);
  });

  it('normalizes backend decimal tax rates for percentage display', () => {
    expect(normalizeBackendTaxRateForForm('0.16')).toBe(16);
    expect(normalizeBackendTaxRateForForm(0.085)).toBe(8.5);
    expect(normalizeBackendTaxRateForForm(16)).toBe(16);
    expect(normalizeBackendTaxRateForForm('not-a-number')).toBe(0);
  });
});
