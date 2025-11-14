/*
 discord-oauth2 - Utilities
 Helper functions and constants
*/

import type { OAuth2Scope } from '@structures/types';

/**
 * Discord OAuth2 URLs
 */
export const DISCORD_OAUTH2_URLS = {
  'AUTHORIZE': 'https://discord.com/oauth2/authorize',
  'TOKEN': 'https://discord.com/api/oauth2/token',
  'TOKEN_REVOKE': 'https://discord.com/api/oauth2/token/revoke',
} as const;

/**
 * Default Discord API endpoint
 */
export const DEFAULT_API_ENDPOINT = 'https://discord.com/api/v10';

/**
 * Build a URL with query parameters
 */
export const buildUrl = (baseUrl: string, params: Record<string, string | number | boolean | undefined>): string => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });
  return url.toString();
};

/**
 * Convert scopes array to space-separated string
 */
export const scopesToString = (scopes: OAuth2Scope[]): string => scopes.join(' ');

/**
 * Convert permissions to string if number
 */
export const normalizePermissions = (permissions: number | string | undefined): string | undefined =>
  permissions === undefined ? undefined : String(permissions);

/**
 * Encode credentials for Basic authentication
 */
export const encodeBasicAuth = (clientId: string, clientSecret: string): string => {
  const credentials = `${clientId}:${clientSecret}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

/**
 * Convert object to application/x-www-form-urlencoded format
 */
export const toFormUrlEncoded = (data: Record<string, string | undefined>): string => {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, value);
  });
  return params.toString();
};

/**
 * Validate required configuration options
 */
export const validateConfig = (config: Record<string, unknown>, requiredFields: string[]): void => {
  const missing = requiredFields.filter(field => !config[field]);
  if (missing.length > 0) throw new Error(`Missing required configuration: ${missing.join(', ')}`);
};

/**
 * Parse scope string to array
 */
export const parseScopeString = (scopeString: string): string[] => scopeString.split(' ').filter(Boolean);
