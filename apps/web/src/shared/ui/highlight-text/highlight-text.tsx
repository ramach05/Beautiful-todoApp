import type { ReactNode } from 'react';

/** Regex special characters in the query must not break text splitting */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface HighlightTextProps {
  text: string;
  query: string;
}

/**
 * Text with search query occurrences highlighted: matches are wrapped in <strong>.
 * Case-insensitive search with trimmed whitespace — same as filterTodos.
 */
export function HighlightText({ text, query }: HighlightTextProps): ReactNode {
  const term = query.trim();
  if (term === '') {
    return text;
  }
  // split with a capturing group: odd indexes are the matched chunks
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
