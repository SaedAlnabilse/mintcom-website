const PLACEHOLDER_DOWNLOAD_PATTERNS = [
  /your-cdn-url/i,
  /example\./i,
  /YOUR_/i,
  /placeholder/i,
  /mintcom-android\.apk\.apps\.googleusercontent\.com/i,
];

const isSafeDownloadUrl = (value?: string): value is string => {
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

export const ANDROID_DOWNLOAD_URL = isSafeDownloadUrl(import.meta.env.VITE_ANDROID_DOWNLOAD_URL)
  ? import.meta.env.VITE_ANDROID_DOWNLOAD_URL.trim()
  : '';

export const IOS_DOWNLOAD_URL = isSafeDownloadUrl(import.meta.env.VITE_IOS_DOWNLOAD_URL)
  ? import.meta.env.VITE_IOS_DOWNLOAD_URL.trim()
  : '';

export const isDirectInstallerDownload = (url: string) => /\.(apk|ipa)(?:$|\?)/i.test(url);
