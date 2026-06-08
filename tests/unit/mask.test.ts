import { describe, test, expect } from 'vitest';
import { maskCpf } from '@/shared/utils/mask';

describe('maskCpf', () => {
  test('keeps only the middle 6 digits, masking first 3 and last 2', () => {
    expect(maskCpf('111.444.777-35')).toBe('***.444.777-**');
  });

  test('works with unmasked input', () => {
    expect(maskCpf('11144477735')).toBe('***.444.777-**');
  });

  test('never exposes the first 3 or last 2 digits', () => {
    const masked = maskCpf('11144477735');
    expect(masked.startsWith('111')).toBe(false);
    expect(masked.endsWith('35')).toBe(false);
  });

  test('returns a safe placeholder for input without 11 digits', () => {
    expect(maskCpf('123')).toBe('***');
    expect(maskCpf('')).toBe('***');
  });
});
