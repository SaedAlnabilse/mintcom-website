import { describe, expect, it } from 'vitest';
import {
  MAX_PERCENT_CENTS,
  blurAtmAmountEdit,
  changeAtmAmountEdit,
  formatAtmCents,
  initAtmAmountEdit,
  normalizeDecimalSeparators,
  type AtmAmountEdit,
} from '../atmPercent';

const edit = (text: string, cents: number, decimalMode = false): AtmAmountEdit => ({
  text,
  cents,
  decimalMode,
});

describe('atmPercent hybrid ATM + decimal entry', () => {
  it('shifts digits ATM-style when no dot is typed', () => {
    let state = initAtmAmountEdit(0);
    state = changeAtmAmountEdit(state, '5');
    expect(state).toEqual(edit('0.05', 5));
    state = changeAtmAmountEdit(state, '0.050');
    expect(state).toEqual(edit('0.50', 50));
    state = changeAtmAmountEdit(state, '0.500');
    expect(state).toEqual(edit('5.00', 500));
    state = changeAtmAmountEdit(state, '5.000');
    expect(state).toEqual(edit('50.00', 5000));
  });

  it('enters a full percent ATM-style from a cleared field', () => {
    let state: AtmAmountEdit = { text: '', cents: 0, decimalMode: false };
    for (const raw of ['1', '16', '160', '1600']) {
      state = changeAtmAmountEdit(state, raw);
    }
    expect(state).toEqual(edit('16.00', 1600));
  });

  it('accepts an exact decimal when the value is typed with a dot', () => {
    const state = changeAtmAmountEdit(initAtmAmountEdit(0), '0.5');
    expect(state).toEqual(edit('0.5', 50, true));
  });

  it('accepts decimals like 0.1 and 2.75 exactly', () => {
    expect(changeAtmAmountEdit(initAtmAmountEdit(0), '0.1')).toEqual(edit('0.1', 10, true));
    expect(changeAtmAmountEdit(initAtmAmountEdit(0), '2.75')).toEqual(edit('2.75', 275, true));
    expect(changeAtmAmountEdit(initAtmAmountEdit(16), '.5')).toEqual(edit('0.5', 50, true));
  });

  it('supports typing "0.5" digit-by-digit after the ATM display', () => {
    // Display shows "0.00"; user types "0", ".", "5" without selecting.
    let state = initAtmAmountEdit(0);
    state = changeAtmAmountEdit(state, '0.000'); // typed "0" -> ATM append, still zero
    expect(state).toEqual(edit('0.00', 0));
    state = changeAtmAmountEdit(state, '0.00.'); // typed "." -> decimal mode
    expect(state).toEqual(edit('0.', 0, true));
    state = changeAtmAmountEdit(state, '0.5'); // typed "5" fresh
    expect(state).toEqual(edit('0.5', 50, true));
  });

  it('keeps shifting when a digit is appended to the formatted display', () => {
    const state = changeAtmAmountEdit(edit('0.05', 5), '0.055');
    expect(state).toEqual(edit('0.55', 55));
  });

  it('back-shifts ATM-style when a digit is deleted', () => {
    const state = changeAtmAmountEdit(edit('0.55', 55), '0.5');
    // "0.5" is the display minus its last digit -> ATM back-shift to 0.05
    expect(state).toEqual(edit('0.05', 5));
  });

  it('continues exact decimals while in decimal mode', () => {
    let state = edit('0.5', 50, true);
    state = changeAtmAmountEdit(state, '0.55');
    expect(state).toEqual(edit('0.55', 55, true));
    // A third decimal is swallowed instead of corrupting the value.
    state = changeAtmAmountEdit(state, '0.555');
    expect(state).toEqual(edit('0.55', 55, true));
  });

  it('returns to ATM mode once the dot is deleted', () => {
    const state = changeAtmAmountEdit(edit('0.5', 50, true), '0');
    expect(state).toEqual(edit('0.00', 0));
  });

  it('rejects values above the max instead of corrupting', () => {
    const prev = edit('16.00', 1600);
    expect(changeAtmAmountEdit(prev, '160.005')).toEqual(prev);
    expect(changeAtmAmountEdit(prev, '100.01')).toEqual(prev);
    expect(changeAtmAmountEdit(initAtmAmountEdit(0), '100.00')).toEqual(
      edit('100.00', MAX_PERCENT_CENTS, true),
    );
  });

  it('clears and blurs predictably', () => {
    expect(changeAtmAmountEdit(edit('0.55', 55), '')).toEqual(edit('', 0));
    expect(blurAtmAmountEdit(edit('0.5', 50, true))).toEqual(edit('0.50', 50));
    expect(blurAtmAmountEdit(edit('', 0))).toEqual(edit('', 0));
  });

  it('formats cents with two decimals', () => {
    expect(formatAtmCents(50)).toBe('0.50');
    expect(formatAtmCents(1600)).toBe('16.00');
    expect(formatAtmCents(0)).toBe('0.00');
  });

  it('clamps the initial value into range', () => {
    expect(initAtmAmountEdit(0.5)).toEqual(edit('0.50', 50));
    expect(initAtmAmountEdit(150)).toEqual(edit('100.00', MAX_PERCENT_CENTS));
    expect(initAtmAmountEdit(Number.NaN)).toEqual(edit('0.00', 0));
  });

  it('treats a decimal comma like a dot (comma-locale keyboards)', () => {
    expect(changeAtmAmountEdit(initAtmAmountEdit(0), '0,1')).toEqual(edit('0.1', 10, true));
    expect(changeAtmAmountEdit(initAtmAmountEdit(0), '2,75')).toEqual(edit('2.75', 275, true));
    expect(changeAtmAmountEdit(initAtmAmountEdit(16), ',5')).toEqual(edit('0.5', 50, true));
  });

  it('supports digit-by-digit comma entry after the ATM display', () => {
    let state = initAtmAmountEdit(0);
    state = changeAtmAmountEdit(state, '0.000');
    expect(state).toEqual(edit('0.00', 0));
    state = changeAtmAmountEdit(state, '0.00,');
    expect(state).toEqual(edit('0.', 0, true));
    state = changeAtmAmountEdit(state, '0,1');
    expect(state).toEqual(edit('0.1', 10, true));
  });

  it('accepts the Arabic decimal separator and Arabic-Indic digits', () => {
    expect(changeAtmAmountEdit(initAtmAmountEdit(0), '0٫1')).toEqual(edit('0.1', 10, true));
    expect(changeAtmAmountEdit(initAtmAmountEdit(0), '٠٫٥')).toEqual(edit('0.5', 50, true));
  });

  it('still reads thousands commas as grouping, not decimals', () => {
    expect(normalizeDecimalSeparators('1,000')).toBe('1000');
    expect(normalizeDecimalSeparators('1,000.5')).toBe('1000.5');
    expect(normalizeDecimalSeparators('0,1')).toBe('0.1');
  });
});
