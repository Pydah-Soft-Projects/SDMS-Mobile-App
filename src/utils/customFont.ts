import { Text, TextInput, StyleSheet, TextStyle } from 'react-native';

/**
 * Resolves the appropriate bundled Inter font family based on fontWeight.
 * Preserves explicit monospace/courier/cursive fonts.
 * Leaves font sizes and scaling 100% untouched.
 */
export function resolveInterFont(style: any): string | null {
  if (!style) return 'Inter-Regular';
  const flat: TextStyle = StyleSheet.flatten(style) || {};

  // Preserve explicit custom fonts (e.g. monospace, Courier, DancingScript)
  if (flat.fontFamily && flat.fontFamily !== 'System' && flat.fontFamily !== 'normal' && flat.fontFamily !== 'Inter') {
    return null;
  }

  const weight = String(flat.fontWeight || '400').toLowerCase();
  if (weight === '700' || weight === 'bold' || weight === '800' || weight === '900') {
    return 'Inter-Bold';
  }
  if (weight === '600') {
    return 'Inter-SemiBold';
  }
  if (weight === '500') {
    return 'Inter-Medium';
  }
  return 'Inter-Regular';
}

/**
 * Cleanly initializes default bundled font settings on React Native Text & TextInput
 * using standard top-level public APIs without deep imports.
 */
export function initGlobalFont() {
  try {
    if ((Text as any).defaultProps == null) {
      (Text as any).defaultProps = {};
    }
    (Text as any).defaultProps.style = { fontFamily: 'Inter-Regular' };
  } catch (_) {}

  try {
    if ((TextInput as any).defaultProps == null) {
      (TextInput as any).defaultProps = {};
    }
    (TextInput as any).defaultProps.style = { fontFamily: 'Inter-Regular' };
  } catch (_) {}

  try {
    const textRender = (Text as any).render;
    if (typeof textRender === 'function' && !(textRender as any).__isInterPatched) {
      (Text as any).render = function (props: any, ref: any) {
        const fontFam = resolveInterFont(props?.style);
        const style = fontFam ? [{ fontFamily: fontFam }, props?.style] : props?.style;
        return textRender.call(this, { ...props, style }, ref);
      };
      ((Text as any).render as any).__isInterPatched = true;
    }
  } catch (_) {}

  try {
    const textInputRender = (TextInput as any).render;
    if (typeof textInputRender === 'function' && !(textInputRender as any).__isInterPatched) {
      (TextInput as any).render = function (props: any, ref: any) {
        const fontFam = resolveInterFont(props?.style);
        const style = fontFam ? [{ fontFamily: fontFam }, props?.style] : props?.style;
        return textInputRender.call(this, { ...props, style }, ref);
      };
      ((TextInput as any).render as any).__isInterPatched = true;
    }
  } catch (_) {}
}
