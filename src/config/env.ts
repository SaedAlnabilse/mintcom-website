import { z } from 'zod';

/**
 * Validates environment variables at runtime.
 * This ensures that the app fails early if required configuration is missing.
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url().default('https://api.mintcompos.com'),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_APPLE_SERVICE_ID: z.string().optional(),
  VITE_APPLE_REDIRECT_URI: z.string().optional(),
  VITE_XERO_REDIRECT_URI: z.string().optional(),
  // Public GA4 Measurement ID. Defaulted here (not just .env) because .env is
  // git-ignored, so the Cloudflare build would otherwise bake in an empty value
  // and the analytics loader would self-disable. The ID is already public.
  VITE_GA_MEASUREMENT_ID: z.string().optional().default('G-QHV2SVCG99'),
  VITE_META_PIXEL_ID: z.string().optional(),
  VITE_SUPPORT_ADMIN_EMAILS: z.string().optional(),
  VITE_ANDROID_DOWNLOAD_URL: z.string().optional(),
  VITE_IOS_DOWNLOAD_URL: z.string().optional(),
  VITE_OWNER_ANDROID_DOWNLOAD_URL: z.string().optional(),
  VITE_OWNER_IOS_DOWNLOAD_URL: z.string().optional(),
  VITE_ONBOARDING_VIDEO_URL: z.string().optional(),
  VITE_MAINTENANCE_MODE: z.string().optional(),
  VITE_QA_ACCESS_KEY: z.string().optional(),
  VITE_HERO_VIDEO_URL: z.string().optional(),
  VITE_APP_NAME: z.string().default('Mintcom'),
  VITE_SITE_URL: z.string().url().default('https://mintcompos.com'),
  PROD: z.boolean(),
  DEV: z.boolean(),
});

// Parse the environment variables
// Use import.meta.env for Vite environment variables
const envData = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  VITE_APPLE_SERVICE_ID: import.meta.env.VITE_APPLE_SERVICE_ID,
  VITE_APPLE_REDIRECT_URI: import.meta.env.VITE_APPLE_REDIRECT_URI,
  VITE_XERO_REDIRECT_URI: import.meta.env.VITE_XERO_REDIRECT_URI,
  VITE_GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
  VITE_META_PIXEL_ID: import.meta.env.VITE_META_PIXEL_ID,
  VITE_SUPPORT_ADMIN_EMAILS: import.meta.env.VITE_SUPPORT_ADMIN_EMAILS,
  VITE_ANDROID_DOWNLOAD_URL: import.meta.env.VITE_ANDROID_DOWNLOAD_URL,
  VITE_IOS_DOWNLOAD_URL: import.meta.env.VITE_IOS_DOWNLOAD_URL,
  VITE_OWNER_ANDROID_DOWNLOAD_URL: import.meta.env.VITE_OWNER_ANDROID_DOWNLOAD_URL,
  VITE_OWNER_IOS_DOWNLOAD_URL: import.meta.env.VITE_OWNER_IOS_DOWNLOAD_URL,
  VITE_ONBOARDING_VIDEO_URL: import.meta.env.VITE_ONBOARDING_VIDEO_URL,
  VITE_MAINTENANCE_MODE: import.meta.env.VITE_MAINTENANCE_MODE,
  VITE_QA_ACCESS_KEY: import.meta.env.VITE_QA_ACCESS_KEY,
  VITE_HERO_VIDEO_URL: import.meta.env.VITE_HERO_VIDEO_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
};

const result = envSchema.safeParse(envData);

if (!result.success) {
  console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
  // In production, we might still want to proceed with defaults if possible, 
  // but in development, we want to know immediately.
  if (import.meta.env.DEV) {
    throw new Error('Invalid environment variables. Check your .env file.');
  }
}

const parsedEnv = result.success ? result.data : envSchema.parse({});

const parseBooleanFlag = (value: string | undefined, defaultValue = false) => {
  if (!value) return defaultValue;

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

export const env = {
  ...parsedEnv,
  VITE_MAINTENANCE_MODE: parseBooleanFlag(parsedEnv.VITE_MAINTENANCE_MODE),
};
