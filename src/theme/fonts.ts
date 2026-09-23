import { Platform } from 'react-native';

/**
 * Font families available WITHOUT bundling files. Android ships these aliases on every device;
 * iOS gets the closest built-in family. To add a bundled font later (e.g. an OFL font such as
 * Cinzel), drop the .ttf into android/app/src/main/assets/fonts/ and add it here.
 */
export const FONTS = {
  sans: Platform.select({ ios: 'System', default: 'sans-serif' }),
  sansMedium: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  sansLight: Platform.select({ ios: 'System', default: 'sans-serif-light' }),
  sansThin: Platform.select({ ios: 'System', default: 'sans-serif-thin' }),
  condensed: Platform.select({ ios: 'AvenirNextCondensed-Bold', default: 'sans-serif-condensed' }),
  serif: Platform.select({ ios: 'Georgia', default: 'serif' }),
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  handwritten: Platform.select({ ios: 'Noteworthy', default: 'casual' }),
} as const;
