import type { ReactNode } from 'react';

/** Спецсимволы регулярки в запросе не должны ломать разбиение текста */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface HighlightTextProps {
  text: string;
  query: string;
}

/**
 * Текст с выделением вхождений поискового запроса: совпадения оборачиваются в <strong>.
 * Поиск без учета регистра и с обрезкой пробелов — как в filterTodos.
 */
export function HighlightText({ text, query }: HighlightTextProps): ReactNode {
  const term = query.trim();
  if (term === '') {
    return text;
  }
  // split с захватывающей группой: нечетные индексы — совпавшие куски
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, 'iu'));
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-bold">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}
