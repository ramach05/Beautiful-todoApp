import 'react';

declare module 'react' {
  interface CSSProperties {
    /** Пик яркости мерцающего окна города (0..1) */
    '--peak'?: string;
  }
}
