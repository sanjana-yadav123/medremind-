import { describe, it, expect } from 'vitest';
import hi from '../../src/i18n/hi.json';
import en from '../../src/i18n/en.json';
import bn from '../../src/i18n/bn.json';
import mr from '../../src/i18n/mr.json';
import ta from '../../src/i18n/ta.json';
import te from '../../src/i18n/te.json';
import gu from '../../src/i18n/gu.json';

const languages = { hi, en, bn, mr, ta, te, gu };

function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys.push(...getAllKeys(obj[k], full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

describe('Multilingual i18n 100% Parity', () => {
  const baseKeys = getAllKeys(hi);

  it('Hindi has all required sections', () => {
    expect(hi).toHaveProperty('app');
    expect(hi).toHaveProperty('nav');
    expect(hi).toHaveProperty('dashboard');
    expect(hi).toHaveProperty('medicines');
    expect(hi).toHaveProperty('lifespan');
    expect(hi).toHaveProperty('alarm');
    expect(hi).toHaveProperty('common');
    expect(hi).toHaveProperty('voice');
    expect(hi).toHaveProperty('emergency');
    expect(hi).toHaveProperty('settings');
  });

  Object.entries(languages).forEach(([code, dict]) => {
    it(`Language "${code}" has 100% key parity with Hindi base`, () => {
      const currentKeys = new Set(getAllKeys(dict));
      const missing = baseKeys.filter((k) => !currentKeys.has(k));
      expect(missing).toEqual([]);
    });

    it(`Language "${code}" has no empty translation strings`, () => {
      const keys = getAllKeys(dict);
      for (const k of keys) {
        const parts = k.split('.');
        let val: any = dict;
        for (const p of parts) {
          val = val[p];
        }
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      }
    });
  });
});
