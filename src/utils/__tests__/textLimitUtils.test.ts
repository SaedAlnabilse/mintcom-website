import { describe, expect, it } from 'vitest';
import { TEXT_INPUT_LIMITS } from '../../config/textLimits';
import {
  applyElementTextLimit,
  getLimitKeyForField,
  limitText,
  sanitizeTextPayload,
} from '../textLimitUtils';

describe('text limit utilities', () => {
  it('uses field-specific limits instead of a single fallback', () => {
    expect(getLimitKeyForField('productName')).toBe('PRODUCT_NAME');
    expect(getLimitKeyForField('category name')).toBe('CATEGORY_NAME');
    expect(getLimitKeyForField('refundReason')).toBe('REFUND_REASON');
    expect(getLimitKeyForField('email')).toBe('EMAIL');
  });

  it('truncates pasted or typed values to the resolved limit', () => {
    const value = 'x'.repeat(TEXT_INPUT_LIMITS.PRODUCT_NAME + 10);
    expect(limitText(value, 'PRODUCT_NAME')).toHaveLength(TEXT_INPUT_LIMITS.PRODUCT_NAME);
  });

  it('sanitizes payloads before API submission', () => {
    const payload = sanitizeTextPayload({
      name: 'A'.repeat(90),
      description: 'B'.repeat(180),
      nested: { taxIdNumber: '1'.repeat(50) },
    });

    expect(payload.name).toHaveLength(TEXT_INPUT_LIMITS.PERSON_NAME);
    expect(payload.description).toHaveLength(TEXT_INPUT_LIMITS.ITEM_DESCRIPTION);
    expect(payload.nested.taxIdNumber).toHaveLength(TEXT_INPUT_LIMITS.TAX_ID);
  });

  it('assigns maxlength and truncates old long values on text inputs', () => {
    const input = document.createElement('input');
    input.name = 'productName';
    input.value = 'Long product name '.repeat(10);

    applyElementTextLimit(input);

    expect(input.maxLength).toBe(TEXT_INPUT_LIMITS.PRODUCT_NAME);
    expect(input.value).toHaveLength(TEXT_INPUT_LIMITS.PRODUCT_NAME);
  });
});
