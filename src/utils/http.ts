import { DiscordAPIRequestError } from '@structures/errors';

import type { DiscordAPIError } from '@structures/types';

/**
 * HTTP request options
 */
interface RequestOptions {
  'method': 'GET' | 'POST' | 'PUT';
  'headers': Record<string, string>;
  'body'?: string;
}

/**
 * Internal HTTP client for making requests to Discord API
 */
export class HttpClient {
  /**
   * Issues a GET request with the library's default headers.
   *
   * @throws DiscordAPIRequestError When Discord responds with an error status
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
   * Issues a POST request with form-encoded content.
   *
   * @throws DiscordAPIRequestError When Discord responds with an error status
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
   * Issues a PUT request with a JSON payload.
   *
   * @throws DiscordAPIRequestError When Discord responds with an error status
   */
  static async put<T>(url: string, body: string, headers: Record<string, string> = {}): Promise<T> {
    return this.request<T>(url, {
      'method': 'PUT',
      'headers': {
        'User-Agent': 'discord-oauth2 (https://github.com/0neShot101/discord-oauth2)',
        'Content-Type': 'application/json',
        ...headers,
      },
      'body': body,
    });
  }

  /**
   * Core request helper shared by the public helpers.
   *
   * @throws DiscordAPIRequestError When Discord responds with an error status
   */
  private static async request<T>(url: string, options: RequestOptions): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
      let errorData: DiscordAPIError | undefined;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const parsed = await response.json().catch(() => undefined);
        if (parsed) errorData = parsed as DiscordAPIError;
      }

      const errorMessage = errorData?.message || response.statusText || 'Unknown error';
      throw new DiscordAPIRequestError(errorMessage, response.status, errorData);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return (await response.json()) as T;
    }

    return {} as T;
  }
}
