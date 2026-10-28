import city1920Avif from './images/city-1920.avif';
import city2560Avif from './images/city-2560.avif';
import city1920Webp from './images/city-1920.webp';
import city2560Webp from './images/city-2560.webp';

/** Catalog of real images: the single access point for UI bitmap assets */

/** <source> variant for picture: MIME type and srcset with widths in CSS pixels */
export interface PictureSource {
  type: string;
  srcSet: string;
}

/** City background photo: variants from the best format to the fallback, the browser picks the right one */
export const cityBgSources: readonly PictureSource[] = [
  { type: 'image/avif', srcSet: `${city1920Avif} 1920w, ${city2560Avif} 2560w` },
  { type: 'image/webp', srcSet: `${city1920Webp} 1920w, ${city2560Webp} 2560w` },
];

/** Fallback background for img: all target browsers understand webp, the avif branch takes priority */
export const cityBg = city1920Webp;

/** Background LQIP: 32px webp in base64, visible while the full variant loads; produced by scripts/optimize-images.mjs */
export const cityBgLqip =
  'data:image/webp;base64,UklGRrAAAABXRUJQVlA4IKQAAAAwBQCdASogABMAPs1SokynpKMiN/qoAPAZiWMAtDQh3416CnLrybtS0QOYoZveafdgAAD+2J0LcSuZ4xRw5a5aglFqA2KzTqt1GaKUKEc3KLJYxzLnYyhF5Fj1Rh/dAEyuD0VKANwKf6MbHmFdCm8FBUmb7BGxxov0+CTGwjR8GbDrBhfVTpQ/96WEbuK1K6PeEFJx8SFQQtAxCEKjBEmNOYAAAA==';

export { default as addTodoIcon } from './images/svg/task_add_24dp.svg';
export { default as checkIcon } from './images/svg/check_white_24dp.svg';
export { default as clearAllIcon } from './images/svg/clear_all_white_24dp.svg';
export { default as closeIcon } from './images/svg/close_white_24dp.svg';
export { default as deleteIcon } from './images/svg/delete_forever_white_24dp.svg';
export { default as doneIcon } from './images/svg/task_alt_white_24dp.svg';
export { default as dragIcon } from './images/svg/drag_indicator_white_24dp.svg';
export { default as importantActiveIcon } from './images/svg/warning-active_amber_orange_24dp.svg';
export { default as importantIcon } from './images/svg/warning_amber_white_24dp.svg';
export { default as visibilityIcon } from './images/svg/visibility_white_24dp.svg';
export { default as visibilityOffIcon } from './images/svg/visibility_off_white_24dp.svg';
export { default as facebookIcon } from './images/svg/facebook.svg';
export { default as githubIcon } from './images/svg/github.svg';
export { default as linkedinIcon } from './images/svg/linkedin.svg';
export { default as telegramIcon } from './images/svg/telegram.svg';
