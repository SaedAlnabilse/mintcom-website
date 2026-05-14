import { z } from 'zod';

/**
 * Validates environment variables at runtime.
 * This ensures that the app fails early if required configuration is missing.
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url().default('https://grateful-liberation-production-d036.up.railway.app'),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_GA_MEASUREMENT_ID: z.string().optional(),
  VITE_META_PIXEL_ID: z.string().optional(),
  VITE_SUPPORT_ADMIN_EMAILS: z.string().optional(),
  VITE_ANDROID_DOWNLOAD_URL: z.string().optional(),
  VITE_IOS_DOWNLOAD_URL: z.string().optional(),
  VITE_APP_NAME: z.string().default('PayMint'),
  VITE_SITE_URL: z.string().url().default('https://paymintpos.net'),
  PROD: z.boolean(),
  DEV: z.boolean(),
});

// Parse the environment variables
// Use import.meta.env for Vite environment variables
const envData = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  VITE_GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
  VITE_META_PIXEL_ID: import.meta.env.VITE_META_PIXEL_ID,
  VITE_SUPPORT_ADMIN_EMAILS: import.meta.env.VITE_SUPPORT_ADMIN_EMAILS,
  VITE_ANDROID_DOWNLOAD_URL: import.meta.env.VITE_ANDROID_DOWNLOAD_URL,
  VITE_IOS_DOWNLOAD_URL: import.meta.env.VITE_IOS_DOWNLOAD_URL,
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

export const env = result.success ? result.data : envSchema.parse({});
