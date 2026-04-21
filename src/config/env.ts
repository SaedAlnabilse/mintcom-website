import { z } from 'zod';

/**
 * Validates environment variables at runtime.
 * This ensures that the app fails early if required configuration is missing.
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url().default('https://grateful-liberation-production-d036.up.railway.app'),
  VITE_GOOGLE_CLIENT_ID: z.string().optional(),
  VITE_APP_NAME: z.string().default('PayMint'),
  PROD: z.boolean(),
  DEV: z.boolean(),
});

// Parse the environment variables
// Use import.meta.env for Vite environment variables
const envData = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
};

const result = envSchema.safeParse(envData);

if (!result.success) {
  console.error('âŒ Invalid environment variables:', result.error.flatten().fieldErrors);
  // In production, we might still want to proceed with defaults if possible, 
  // but in development, we want to know immediately.
  if (import.meta.env.DEV) {
    throw new Error('Invalid environment variables. Check your .env file.');
  }
}

export const env = result.success ? result.data : envSchema.parse({});
