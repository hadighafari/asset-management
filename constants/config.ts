// ============================================================
//  App Configuration - تنظیمات کلی اپ
// ============================================================

import Constants from 'expo-constants';

export const APP_CONFIG = {
  appName: 'مدیریت دارایی',
  appNameEn: 'Asset Management',
  appVersion: Constants.expoConfig?.version || '1.0.0',
  appCreator: 'trade_master65',
  appCreatorFull: 'trade_master65 (GitHub)',
  appWebsite: 'https://github.com/trade-master65/asset-management',
  appPublisher: 'trade_master65',
  publisherPlatform: 'مایکت (Myket)',
  railwayProxyUrl:
    Constants.expoConfig?.extra?.railwayProxyUrl ||
    'https://YOUR-RAILWAY-APP.up.railway.app',
  isDev: __DEV__,
} as const;
