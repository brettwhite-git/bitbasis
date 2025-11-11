/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

interface EnvironmentConfig {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string; // Server-side only
  
  // Stripe Configuration
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY?: string; // Server-side only
  STRIPE_WEBHOOK_SECRET?: string; // Server-side only
  STRIPE_PRO_MONTHLY_PRICE_ID?: string;
  STRIPE_LIFETIME_PRICE_ID?: string;
  
  // Cloudflare Turnstile
  NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: string;
  CLOUDFLARE_TURNSTILE_SECRET_KEY?: string; // Server-side only
  
  // Resend Email Configuration
  RESEND_API_KEY?: string; // Server-side only
  RESEND_FROM_EMAIL?: string; // Server-side only, optional
  
  // Application Configuration
  NODE_ENV: string;
  NEXT_PUBLIC_APP_URL?: string;
}

// Required environment variables for client-side
const CLIENT_REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY',
  'NODE_ENV'
] as const;

// Required environment variables for server-side
const SERVER_REQUIRED_VARS = [
  ...CLIENT_REQUIRED_VARS,
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLOUDFLARE_TURNSTILE_SECRET_KEY',
  'RESEND_API_KEY'
] as const;

// Optional but recommended variables
const RECOMMENDED_VARS = [
  'STRIPE_PRO_MONTHLY_PRICE_ID',
  'STRIPE_LIFETIME_PRICE_ID',
  'NEXT_PUBLIC_APP_URL'
] as const;

/**
 * Validates that a URL is properly formatted
 */
function validateUrl(url: string, name: string): void {
  try {
    new URL(url);
  } catch {
    throw new Error(`${name} must be a valid URL, got: ${url}`);
  }
}

/**
 * Validates Supabase configuration
 */
function validateSupabaseConfig(config: Partial<EnvironmentConfig>): void {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = config;
  
  if (!NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  
  validateUrl(NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
  
  if (!NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  
  // Validate anon key format (supports both legacy JWT format and new publishable format)
  const isValidLegacyFormat = NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ');
  const isValidPublishableFormat = NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('sb_publishable_');
  
  if (!isValidLegacyFormat && !isValidPublishableFormat) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (should start with "eyJ" for legacy format or "sb_publishable_" for new format)');
  }
  
  // Validate service role key format if provided (server-side only)
  if (SUPABASE_SERVICE_ROLE_KEY) {
    const isValidLegacyServiceFormat = SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ');
    const isValidSecretFormat = SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_sec_');
    
    if (!isValidLegacyServiceFormat && !isValidSecretFormat) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY appears to be invalid (should start with "eyJ" for legacy format or "sb_sec_" for new format)');
    }
  }
}

/**
 * Validates Stripe configuration
 */
function validateStripeConfig(config: Partial<EnvironmentConfig>, isServerSide: boolean): void {
  const { 
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, 
    STRIPE_SECRET_KEY, 
    STRIPE_WEBHOOK_SECRET 
  } = config;
  
  if (!NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required');
  }
  
  // Validate publishable key format
  if (!NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with "pk_"');
  }
  
  if (isServerSide) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required for server-side operations');
    }
    
    if (!STRIPE_SECRET_KEY.startsWith('sk_')) {
      throw new Error('STRIPE_SECRET_KEY must start with "sk_"');
    }
    
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required for webhook verification');
    }
    
    if (!STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
      throw new Error('STRIPE_WEBHOOK_SECRET must start with "whsec_"');
    }
  }
}

/**
 * Validates Cloudflare Turnstile configuration
 */
function validateTurnstileConfig(config: Partial<EnvironmentConfig>, isServerSide: boolean): void {
  const { 
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY, 
    CLOUDFLARE_TURNSTILE_SECRET_KEY 
  } = config;
  
  if (!NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY) {
    throw new Error('NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY is required');
  }
  
  if (isServerSide && !CLOUDFLARE_TURNSTILE_SECRET_KEY) {
    throw new Error('CLOUDFLARE_TURNSTILE_SECRET_KEY is required for server-side verification');
  }
}

/**
 * Validates environment for client-side usage
 */
export function validateClientEnvironment(): EnvironmentConfig {
  const config: Partial<EnvironmentConfig> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  };
  
  // Check for missing required variables
  const missing = CLIENT_REQUIRED_VARS.filter(key => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required client environment variables: ${missing.join(', ')}`);
  }
  
  // Validate specific configurations
  validateSupabaseConfig(config);
  validateStripeConfig(config, false);
  validateTurnstileConfig(config, false);
  
  return config as EnvironmentConfig;
}

/**
 * Validates environment for server-side usage
 */
export function validateServerEnvironment(): EnvironmentConfig {
  const config: Partial<EnvironmentConfig> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    STRIPE_LIFETIME_PRICE_ID: process.env.STRIPE_LIFETIME_PRICE_ID,
    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
    CLOUDFLARE_TURNSTILE_SECRET_KEY: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  };
  
  // Check for missing required variables
  const missing = SERVER_REQUIRED_VARS.filter(key => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required server environment variables: ${missing.join(', ')}`);
  }
  
  // Check for missing recommended variables
  const missingRecommended = RECOMMENDED_VARS.filter(key => !config[key]);
  if (missingRecommended.length > 0) {
    console.warn(`Missing recommended environment variables: ${missingRecommended.join(', ')}`);
  }
  
  // Validate specific configurations
  validateSupabaseConfig(config);
  validateStripeConfig(config, true);
  validateTurnstileConfig(config, true);
  
  return config as EnvironmentConfig;
}

/**
 * General environment validation (auto-detects client vs server)
 */
export function validateEnvironment(): EnvironmentConfig {
  const isServerSide = typeof window === 'undefined';
  
  try {
    if (isServerSide) {
      return validateServerEnvironment();
    } else {
      return validateClientEnvironment();
    }
  } catch (error) {
    console.error('Environment validation failed:', error);
    
    // In production, this should be a hard failure
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    
    // In development, log the error but continue
    console.warn('Continuing with invalid environment in development mode');
    return {} as EnvironmentConfig;
  }
}

/**
 * Validates environment and returns typed config
 */
export function getValidatedEnvironment(): EnvironmentConfig {
  return validateEnvironment();
}

/**
 * Check if we're in a production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're in a development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get the app URL with fallback
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 
         (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
} 