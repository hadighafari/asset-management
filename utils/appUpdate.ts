/**
 * appUpdate.ts — in-app version check + direct APK download.
 * مطابق پروژه GitHub ostad2fan/pompay (ساده‌شده برای trade_master65)
 *
 * چک می‌کند نسخه جدیدی از اپ موجود باشد یا نه.
 * منبع: فایل apk/version.json در ریپوی GitHub
 *
 * ساختار version.json:
 * {
 *   "latestVersion": "1.0.1",
 *   "versionCode": 2,
 *   "apkUrl": "https://cdn.jsdelivr.net/gh/USER/REPO@main/apk/AssetManagement-v1.0.1.apk",
 *   "notes": "توضیحات آپدیت"
 * }
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

// ⚠️ این مقادیر را با اطلاعات ریپوی GitHub خودتان تنظیم کنید
export const APP_VERSION = '1.0.0';
export const APP_VERSION_CODE = 1;

const REPO_OWNER = 'trade-master65';
const REPO_NAME = 'asset-management';
const REPO_BRANCH = 'main';
const APK_NAME = 'AssetManagement-latest.apk';
const VERSIONED_APK_NAME = `AssetManagement-v${APP_VERSION}.apk`;

export const DEFAULT_UPDATE_URL =
  `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/apk/version.json`;

const VERSION_MIRRORS = [
  `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${REPO_BRANCH}/apk/version.json`,
  `https://fastly.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${REPO_BRANCH}/apk/version.json`,
];

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
  return () => {
    listeners.delete(listener);
  };
}

function emitUpdateInfo(info: AppUpdateInfo | null): void {
  listeners.forEach((l) => {
    try {
      l(info);
    } catch {}
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

export async function getUpdateCheckUrl(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(UPDATE_URL_KEY);
    if (stored && /^https?:\/\//i.test(stored.trim())) return stored.trim();
  } catch {}
  return DEFAULT_UPDATE_URL;
}

export async function setUpdateCheckUrl(url: string): Promise<void> {
  const clean = url.trim();
  if (!/^https?:\/\//i.test(clean)) throw new Error('آدرس باید با http یا https شروع شود');
  await AsyncStorage.setItem(UPDATE_URL_KEY, clean);
}

async function versionCheckCandidates(): Promise<string[]> {
  const urls: string[] = [];
  try {
    const stored = await AsyncStorage.getItem(UPDATE_URL_KEY);
    if (stored && /^https?:\/\//i.test(stored.trim())) urls.push(stored.trim());
  } catch {}
  urls.push(...VERSION_MIRRORS);
  if (!urls.includes(DEFAULT_UPDATE_URL)) urls.push(DEFAULT_UPDATE_URL);
  return urls;
}

interface RawVersionJson {
  latestVersion?: string;
  version?: string;
  versionCode?: number;
  apkUrl?: string;
  url?: string;
  notes?: string;
}

async function fetchVersionJson(url: string): Promise<RawVersionJson> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const bust = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${bust}t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as RawVersionJson;
  } finally {
    clearTimeout(timer);
  }
}

function mirrorLabel(url: string): string {
  if (url.includes('jsdelivr')) return 'CDN jsDelivr';
  if (url.includes('raw.githubusercontent')) return 'گیت‌هاب';
  return 'آدرس سفارشی';
}

export async function fetchUpdateInfo(urlOverride?: string): Promise<AppUpdateInfo | null> {
  const candidates = urlOverride ? [urlOverride] : await versionCheckCandidates();
  lastUpdateError = null;
  for (const url of candidates) {
    if (!/^https?:\/\//i.test(url)) continue;
    try {
      const data = await fetchVersionJson(url);
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
        source: mirrorLabel(url),
      };
      emitUpdateInfo(info);
      return info;
    } catch (e) {
      console.log(`[AppUpdate] check failed via ${url}:`, e instanceof Error ? e.message : e);
    }
  }
  lastUpdateError =
    'بررسی نسخه جدید ناموفق بود — اینترنت گوشی را چک کنید';
  emitUpdateInfo(null);
  return null;
}

export async function isUpdateDismissed(version: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DISMISSED_KEY)) === version;
  } catch {
    return false;
  }
}

export async function dismissUpdate(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_KEY, version);
  } catch {}
}

function apkDownloadCandidates(apkUrl: string): string[] {
  const bust = (u: string) => `${u}${u.includes('?') ? '&' : '?'}v=${APP_VERSION_CODE}-${Date.now()}`;
  const urls = [bust(apkUrl)];
  const rawVersioned = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/apk/${VERSIONED_APK_NAME}`;
  const cdnVersioned = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${REPO_BRANCH}/apk/${VERSIONED_APK_NAME}`;
  const fastlyVersioned = `https://fastly.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${REPO_BRANCH}/apk/${VERSIONED_APK_NAME}`;
  if (!/raw\.githubusercontent\.com/.test(apkUrl)) {
    urls.push(bust(cdnVersioned), bust(rawVersioned), bust(fastlyVersioned));
  } else {
    urls.push(bust(cdnVersioned), bust(fastlyVersioned));
  }
  const raw = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/apk/${APK_NAME}`;
  const cdn = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${REPO_BRANCH}/apk/${APK_NAME}`;
  const fastly = `https://fastly.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${REPO_BRANCH}/apk/${APK_NAME}`;
  for (const alt of [cdn, raw, fastly]) {
    if (!urls.some((u) => u.startsWith(alt))) urls.push(bust(alt));
  }
  return urls;
}

export function apkFileNameFor(info: { latestVersion?: string } | null | undefined): string {
  const v = info?.latestVersion ?? APP_VERSION;
  return `AssetManagement-v${v}.apk`;
}

export async function openApkDownload(apkUrl: string): Promise<void> {
  const candidates = [...apkDownloadCandidates(apkUrl)];
  let lastError: unknown = null;
  for (const url of candidates) {
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
        return;
      }
      await Linking.openURL(url);
      return;
    } catch (e) {
      lastError = e;
      console.log(`[AppUpdate] openURL failed for ${url}`);
    }
  }
  if (lastError) throw lastError;
}

export function getLastUpdateError(): string | null {
  return lastUpdateError;
}
