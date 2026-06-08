import { describe, test, expect } from 'vitest';
import { isValidCpf, normalizeCpf } from '@/shared/utils/cpf';

describe('normalizeCpf', () => {
  test('strips mask and keeps only digits', () => {
    expect(normalizeCpf('111.444.777-35')).toBe('11144477735');
  });
});

describe('isValidCpf', () => {
  test('accepts a valid CPF (masked)', () => {
    expect(isValidCpf('111.444.777-35')).toBe(true);
  });

  test('accepts a valid unmasked CPF', () => {
    expect(isValidCpf('11144477735')).toBe(true);
  });

  test('rejects CPF with wrong check digits', () => {
    expect(isValidCpf('11144477700')).toBe(false);
  });

  test('rejects CPF with fewer than 11 digits', () => {
    expect(isValidCpf('123')).toBe(false);
  });

  test('rejects repeated-digit CPF (passes naive checksum but is invalid)', () => {
    expect(isValidCpf('11111111111')).toBe(false);
  });
});
