import { describe, test, expect } from 'vitest';
import { isValidCnpj, normalizeCnpj } from '@/shared/utils/cnpj';

describe('normalizeCnpj', () => {
  test('strips mask and keeps only digits', () => {
    expect(normalizeCnpj('00.000.000/0001-91')).toBe('00000000000191');
  });
});

describe('isValidCnpj', () => {
  test('accepts a valid CNPJ (Banco do Brasil)', () => {
    expect(isValidCnpj('00.000.000/0001-91')).toBe(true);
  });

  test('accepts a valid unmasked CNPJ', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
  });

  test('rejects CNPJ with wrong check digits', () => {
    expect(isValidCnpj('00000000000192')).toBe(false);
  });

  test('rejects CNPJ with fewer than 14 digits', () => {
    expect(isValidCnpj('123')).toBe(false);
  });

  test('rejects repeated-digit CNPJ (passes naive checksum but is invalid)', () => {
    expect(isValidCnpj('11111111111111')).toBe(false);
  });
});
