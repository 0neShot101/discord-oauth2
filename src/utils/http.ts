/*
 discord-oauth2 - HTTP Client
 Internal HTTP client for Discord API requests
*/

import { DiscordAPIRequestError } from '@structures/errors';

import type { DiscordAPIError } from '@structures/types';

/**
 * HTTP request options
 */
interface RequestOptions {
  'method': 'GET' | 'POST';
  'headers': Record<string, string>;
  'body'?: string;
}

/**
 * Internal HTTP client for making requests to Discord API
 */
export class HttpClient {
  /**
   * Make a GET request
   */
  static async get<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
    return this.request<T>(url, {
      'method': 'GET',
      'headers': {
        'User-Agent': 'discord-oauth2 (https://github.com/0neShot101/discord-oauth2)',
        ...headers,
      },
    });
  }

  /**
   * Make a POST request
   */
  static async post<T>(url: string, body: string, headers: Record<string, string> = {}): Promise<T> {
    return this.request<T>(url, {
      'method': 'POST',
      'headers': {
        'User-Agent': 'discord-oauth2 (https://github.com/0neShot101/discord-oauth2)',
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers,
      },
      'body': body,
    });
  }

  /**
   * Make an HTTP request
   */
  private static async request<T>(url: string, options: RequestOptions): Promise<T> {
    const response = await fetch(url, options);

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData: DiscordAPIError | undefined;
      const contentType = response.headers.get('content-type');

      // Try to parse JSON error response
      if (contentType?.includes('application/json')) {
        try {
          errorData = (await response.json()) as DiscordAPIError;
        } catch {
          // Ignore JSON parse errors
        }
      }

      const errorMessage = errorData?.message || response.statusText || 'Unknown error';
      throw new DiscordAPIRequestError(errorMessage, response.status, errorData);
    }

    // Parse JSON response
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return (await response.json()) as T;
    }

    // Return empty object if no content
    return {} as T;
  }
}
