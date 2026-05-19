import en from '@/i18n/en.json';
import et from '@/i18n/et.json';
import fr from '@/i18n/fr.json';
import { i18n, initI18n } from '@/i18n';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe('i18n', () => {
  beforeAll(async () => {
    await initI18n();
  });

  it('all en keys exist in fr', () => {
    const enKeys = flattenKeys(en);
    const frKeys = new Set(flattenKeys(fr));
    const missing = enKeys.filter((k) => !frKeys.has(k));
    expect(missing).toEqual([]);
  });

  it('all en keys exist in et', () => {
    const enKeys = flattenKeys(en);
    const etKeys = new Set(flattenKeys(et));
    const missing = enKeys.filter((k) => !etKeys.has(k));
    expect(missing).toEqual([]);
  });

  it('t(common.loading) returns non-empty string in all languages', async () => {
    for (const lang of ['en', 'fr', 'et'] as const) {
      await i18n.changeLanguage(lang);
      const value = i18n.t('common.loading');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
