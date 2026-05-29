import { env } from './env';

const PLACEHOLDER_DOWNLOAD_PATTERNS = [
  /your-cdn-url/i,
  /example\./i,
  /YOUR_/i,
  /placeholder/i,
  /mintcom-android\.apk\.apps\.googleusercontent\.com/i,
  /id0{6,}/i,
];

export const isSafeDownloadUrl = (value?: string): value is string => {
  if (!value) return false;

  const trimmed = value.trim();
  if (!trimmed || trimmed === '#') return false;
  if (PLACEHOLDER_DOWNLOAD_PATTERNS.some((pattern) => pattern.test(trimmed))) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return trimmed.startsWith('/downloads/');
  }
};

const readSafeDownloadUrl = (value?: string, fallback = '') =>
  isSafeDownloadUrl(value) ? value.trim() : fallback;

export const ANDROID_DOWNLOAD_URL = readSafeDownloadUrl(env.VITE_ANDROID_DOWNLOAD_URL);

export const IOS_DOWNLOAD_URL = readSafeDownloadUrl(env.VITE_IOS_DOWNLOAD_URL);

export const OWNER_ANDROID_DOWNLOAD_URL = readSafeDownloadUrl(
  env.VITE_OWNER_ANDROID_DOWNLOAD_URL,
  'https://play.google.com/store/apps/details?id=com.Mintcom.owner'
);

export const OWNER_IOS_DOWNLOAD_URL = readSafeDownloadUrl(env.VITE_OWNER_IOS_DOWNLOAD_URL);

export const ONBOARDING_VIDEO_URL = readSafeDownloadUrl(env.VITE_ONBOARDING_VIDEO_URL);

export const isDirectInstallerDownload = (url: string) => /\.(apk|ipa)(?:$|\?)/i.test(url);
