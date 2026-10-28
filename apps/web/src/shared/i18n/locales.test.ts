import en from './locales/en.json';
import ru from './locales/ru.json';

/** Плоский список ключей вложенного словаря: 'a.b.c' */
function flattenKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return typeof child === 'object' && child !== null ? flattenKeys(child, path) : [path];
  });
}

/**
 * Суффиксы CLDR-плюралей нормализуются в базовый ключ:
 * у en базового ключа достаточно, ru требует one/few/many рядом
 */
function normalize(keys: string[]): string[] {
  return [...new Set(keys.map((key) => key.replace(/_(zero|one|two|few|many|other)$/, '')))].sort();
}

it('ru dictionary matches the en structure', () => {
  expect(normalize(flattenKeys(ru))).toEqual(normalize(flattenKeys(en)));
});
