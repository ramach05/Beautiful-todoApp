import en from './locales/en.json';
import ru from './locales/ru.json';

/** Flat list of keys of a nested dictionary: 'a.b.c' */
function flattenKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return typeof child === 'object' && child !== null ? flattenKeys(child, path) : [path];
  });
}

/**
 * CLDR plural suffixes are normalized to the base key:
 * for en the base key is enough, ru requires one/few/many alongside
 */
function normalize(keys: string[]): string[] {
  return [...new Set(keys.map((key) => key.replace(/_(zero|one|two|few|many|other)$/, '')))].sort();
}

it('ru dictionary matches the en structure', () => {
  expect(normalize(flattenKeys(ru))).toEqual(normalize(flattenKeys(en)));
});
