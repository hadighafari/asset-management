/**
 * appUpdate.ts — in-app version check via Railway server
 * آدرس Railway به صورت مخفی استفاده می‌شود - در برنامه نمایش داده نمی‌شود
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

export const APP_VERSION = '1.0.10';
export const APP_VERSION_CODE = 11;

// آدرس سرور Railway (مخفی - در UI نمایش داده نمی‌شود)
const RAILWAY_SERVER = 'https://asset-management65.up.railway.app';

const UPDATE_URL_KEY = '@app_update_check_url';
const DISMISSED_KEY = '@app_update_dismissed_version';

export interface AppUpdateInfo {
  available: boolean;
  latestVersion: string;
  versionCode?: number;
  apkUrl: string;
  notes?: string;
  checkedAt: number;
  source?: string;
}

export let lastUpdateError: string | null = null;

type UpdateListener = (info: AppUpdateInfo | null) => void;
const listeners = new Set<UpdateListener>();

export function onUpdateInfoChanged(listener: UpdateListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function emitUpdateInfo(info: AppUpdateInfo | null): void {
  listeners.forEach((l) => {
    try { l(info); } catch {}
  });
}

export function getInstalledVersion(): string {
  try {
    return Constants.expoConfig?.version ?? APP_VERSION;
  } catch {
    return APP_VERSION;
  }
}

export function compareVersions(a: string, b: string): number {
  const pa = String(a ?? '').trim().replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b ?? '').trim().replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

async function fetchVersionJson(): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const url = `${RAILWAY_SERVER}/latest-version?t=${Date.now()}`;
    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchUpdateInfo(): Promise<AppUpdateInfo | null> {
  lastUpdateError = null;
  try {
    const data = await fetchVersionJson();
    const latestVersion = String(data.latestVersion ?? data.version ?? '').trim();
    const apkUrl = String(data.apkUrl ?? data.url ?? '').trim();
    if (!latestVersion || !apkUrl) throw new Error('bad version.json');
    const installed = getInstalledVersion();
    const info: AppUpdateInfo = {
      available: compareVersions(latestVersion, installed) > 0,
      latestVersion,
      versionCode: typeof data.versionCode === 'number' ? data.versionCode : undefined,
      apkUrl,
      notes: typeof data.notes === 'string' ? data.notes : undefined,
      checkedAt: Date.now(),
      source: 'سرور برنامه',
    };
    emitUpdateInfo(info);
    return info;
  } catch (e) {
    console.log('[AppUpdate] check failed:', e instanceof Error ? e.message : e);
    lastUpdateError = 'بررسی نسخه جدید ناموفق بود — اینترنت گوشی را چک کنید';
    emitUpdateInfo(null);
    return null;
  }
}

export async function isUpdateDismissed(version: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DISMISSED_KEY)) === version;
  } catch { return false; }
}

export async function dismissUpdate(version: string): Promise<void> {
  try { await AsyncStorage.setItem(DISMISSED_KEY, version); } catch {}
}

export async function openApkDownload(apkUrl: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      window.open(apkUrl, '_blank');
      return;
    }
    await Linking.openURL(apkUrl);
  } catch (e) {
    throw e;
  }
}

export function getLastUpdateError(): string | null {
  return lastUpdateError;
}
