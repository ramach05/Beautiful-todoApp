import 'react';

declare module 'react' {
  interface CSSProperties {
    /** Brightness peak of a twinkling city window (0..1) */
    '--peak'?: string;
  }
}
