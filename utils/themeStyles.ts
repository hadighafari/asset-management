/**
 * themeStyles.ts — drop-in replacement for module-level StyleSheet.create.
 * مطابق پروژه GitHub ostad2fan/pompay
 */
import { getThemeVersion } from '../constants/colors';

type AnyRecord = Record<string, any>;

export function createThemedStyles<S extends AnyRecord>(make: () => S): S {
  let version = -1;
  let cached: AnyRecord | null = null;
  return new Proxy({} as S, {
    get(_target, prop) {
      const v = getThemeVersion();
      if (cached === null || v !== version) {
        version = v;
        cached = make();
      }
      return (cached as AnyRecord)[prop as any];
    },
    has(_target, prop) {
      const v = getThemeVersion();
      if (cached === null || v !== version) {
        version = v;
        cached = make();
      }
      return prop in (cached as object);
    },
  });
}
