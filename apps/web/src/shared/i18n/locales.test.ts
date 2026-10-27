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

it('ru-словарь повторяет структуру en с учетом плюралей', () => {
  expect(normalize(flattenKeys(ru))).toEqual(normalize(flattenKeys(en)));
});

it('ru-плюрали покрывают категории CLDR для русского', () => {
  const keys = new Set(flattenKeys(ru));
  for (const key of flattenKeys(en)) {
    if (!keys.has(`${key}_one`)) continue;
    expect(keys.has(`${key}_few`)).toBe(true);
    expect(keys.has(`${key}_many`)).toBe(true);
  }
});
