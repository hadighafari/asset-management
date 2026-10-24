/**
 * themeStyles.ts — simplified version
 * بدون Proxy (که در Hermes ممکن است مشکل ایجاد کند)
 */
import { getThemeVersion } from '../constants/colors';

type AnyRecord = Record<string, any>;

export function createThemedStyles<S extends AnyRecord>(make: () => S): S {
  let version = -1;
  let cached: AnyRecord | null = null;

  // برگرداندن یک object ساده به جای Proxy
  // هر بار که getThemeVersion تغییر کند، cache بازسازی می‌شود
  const result: any = {};
  
  // استفاده از Proxy اما با fallback ساده
  try {
    return new Proxy(result, {
      get(_target, prop) {
        const v = getThemeVersion();
        if (cached === null || v !== version) {
          version = v;
          cached = make();
        }
        return (cached as AnyRecord)[prop as any];
      },
    });
  } catch (e) {
    // fallback: اگر Proxy کار نکرد، یک بار make را اجرا کن
    return make();
  }
}
