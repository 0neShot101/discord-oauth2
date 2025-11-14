/*
 discord-oauth2 - OAuth2 Client
 Main Discord OAuth2 client implementation
*/

import { ValidationError } from '@structures/errors';
import {
  buildUrl,
  DEFAULT_API_ENDPOINT,
  DISCORD_OAUTH2_URLS,
  encodeBasicAuth,
  normalizePermissions,
  parseScopeString,
  scopesToString,
  toFormUrlEncoded,
} from '@utils/helpers';
import { HttpClient } from '@utils/http';

import type {
  AccessTokenResponse,
  AuthorizationInformation,
  AuthorizationUrlOptions,
  BotAuthorizationUrlOptions,
  Connection,
  Guild,
  OAuth2ClientOptions,
  PartialApplication,
  TokenTypeHint,
  User,
} from '@structures/types';

/**
 * Discord OAuth2 Client
 *
 * A TypeScript-friendly, optimized client for Discord's OAuth2 API.
 * Supports all OAuth2 flows: authorization code, implicit, client credentials, bot, and webhook flows.
 *
 * @example
 * ```typescript
 * const client = new OAuth2Client({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   redirectUri: 'https://your-app.com/callback'
 * });
 *
 * // Generate authorization URL
 * const authUrl = client.generateAuthUrl({
 *   scopes: ['identify', 'guilds'],
 *   state: 'random-state-string'
 * });
 *
 * // Exchange authorization code for access token
 * const tokenData = await client.exchangeCode('authorization-code');
 * ```
 */
export class OAuth2Client {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly apiEndpoint: string;

  constructor(options: OAuth2ClientOptions) {
    if (!options.clientId || !options.clientSecret || !options.redirectUri)
      throw new ValidationError('clientId, clientSecret, and redirectUri are required');

    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri;
    this.apiEndpoint = options.apiEndpoint || DEFAULT_API_ENDPOINT;
  }

  /**
   * Generate an authorization URL for the authorization code grant flow
   *
   * @param options - Authorization URL options
   * @returns The authorization URL to redirect users to
   *
   * @example
   * ```typescript
   * const url = client.generateAuthUrl({
   *   scopes: ['identify', 'email', 'guilds'],
   *   state: 'csrf-token',
   *   prompt: 'consent'
   * });
   * ```
   */
  generateAuthUrl(options: AuthorizationUrlOptions): string {
    if (!options.scopes || options.scopes.length === 0) throw new ValidationError('At least one scope is required');

    const params: Record<string, string | number | boolean | undefined> = {
      'client_id': this.clientId,
      'redirect_uri': this.redirectUri,
      'response_type': options.responseType || 'code',
      'scope': scopesToString(options.scopes),
      'state': options.state,
      'prompt': options.prompt,
      'integration_type': options.integrationType,
      'guild_id': options.guildId,
      'disable_guild_select': options.disableGuildSelect,
      'permissions': normalizePermissions(options.permissions),
    };

    return buildUrl(DISCORD_OAUTH2_URLS.AUTHORIZE, params);
  }

  /**
   * Generate a bot authorization URL
   *
   * @param options - Bot authorization options
   * @returns The bot authorization URL
   *
   * @example
   * ```typescript
   * const url = client.generateBotAuthUrl({
   *   permissions: '8', // Administrator
   *   guildId: '123456789012345678'
   * });
   * ```
   */
  generateBotAuthUrl(options: BotAuthorizationUrlOptions = {}): string {
    const scopes = options.scopes ? (['bot', ...options.scopes] as const) : (['bot'] as const);

    const params: Record<string, string | number | boolean | undefined> = {
      'client_id': this.clientId,
      'scope': scopes.join(' '),
      'permissions': normalizePermissions(options.permissions),
      'guild_id': options.guildId,
      'disable_guild_select': options.disableGuildSelect,
      'state': options.state,
    };

    if (options.scopes && options.scopes.length > 0) {
      params['redirect_uri'] = this.redirectUri;
      params['response_type'] = 'code';
    }

    return buildUrl(DISCORD_OAUTH2_URLS.AUTHORIZE, params);
  }

  /**
   * Exchange an authorization code for an access token
   *
   * @param code - The authorization code from the callback
   * @returns Access token response
   *
   * @example
   * ```typescript
   * const tokenData = await client.exchangeCode('authorization-code');
   * console.log(tokenData.access_token);
   * console.log(tokenData.refresh_token);
   * ```
   */
  async exchangeCode(code: string): Promise<AccessTokenResponse> {
    if (!code) throw new ValidationError('Authorization code is required');

    const body = toFormUrlEncoded({
      'grant_type': 'authorization_code',
      'code': code,
      'redirect_uri': this.redirectUri,
    });

    const headers = {
      'Authorization': encodeBasicAuth(this.clientId, this.clientSecret),
    };

    return HttpClient.post<AccessTokenResponse>(DISCORD_OAUTH2_URLS.TOKEN, body, headers);
  }

  /**
   * Refresh an access token using a refresh token
   *
   * @param refreshToken - The refresh token
   * @returns New access token response
   *
   * @example
   * ```typescript
   * const newToken = await client.refreshToken('refresh-token');
   * console.log(newToken.access_token);
   * ```
   */
  async refreshToken(refreshToken: string): Promise<AccessTokenResponse> {
    if (!refreshToken) throw new ValidationError('Refresh token is required');

    const body = toFormUrlEncoded({
      'grant_type': 'refresh_token',
      'refresh_token': refreshToken,
    });

    const headers = {
      'Authorization': encodeBasicAuth(this.clientId, this.clientSecret),
    };

    return HttpClient.post<AccessTokenResponse>(DISCORD_OAUTH2_URLS.TOKEN, body, headers);
  }

  /**
   * Get client credentials access token (bot owner only)
   *
   * @param scopes - Optional scopes to request
   * @returns Access token response
   *
   * @example
   * ```typescript
   * const token = await client.getClientCredentials(['identify', 'connections']);
   * ```
   */
  async getClientCredentials(scopes?: string[]): Promise<AccessTokenResponse> {
    const body = toFormUrlEncoded({
      'grant_type': 'client_credentials',
      'scope': scopes ? scopes.join(' ') : undefined,
    });

    const headers = {
      'Authorization': encodeBasicAuth(this.clientId, this.clientSecret),
    };

    return HttpClient.post<AccessTokenResponse>(DISCORD_OAUTH2_URLS.TOKEN, body, headers);
  }

  /**
   * Revoke an access token or refresh token
   *
   * @param token - The token to revoke
   * @param tokenTypeHint - Optional hint about token type
   *
   * @example
   * ```typescript
   * await client.revokeToken('access-token', 'access_token');
   * ```
   */
  async revokeToken(token: string, tokenTypeHint?: TokenTypeHint): Promise<void> {
    if (!token) throw new ValidationError('Token is required');

    const body = toFormUrlEncoded({
      'token': token,
      'token_type_hint': tokenTypeHint,
    });

    const headers = {
      'Authorization': encodeBasicAuth(this.clientId, this.clientSecret),
    };

    await HttpClient.post<void>(DISCORD_OAUTH2_URLS.TOKEN_REVOKE, body, headers);
  }

  /**
   * Get current bot application information
   *
   * @returns Bot application information
   *
   * @example
   * ```typescript
   * const appInfo = await client.getCurrentBotApplication();
   * console.log(appInfo.name);
   * ```
   */
  async getCurrentBotApplication(): Promise<PartialApplication> {
    const headers = {
      'Authorization': encodeBasicAuth(this.clientId, this.clientSecret),
    };

    return HttpClient.get<PartialApplication>(`${this.apiEndpoint}/oauth2/applications/@me`, headers);
  }

  /**
   * Get current authorization information for a bearer token
   *
   * @param accessToken - The access token to check
   * @returns Authorization information
   *
   * @example
   * ```typescript
   * const authInfo = await client.getCurrentAuthorizationInfo('access-token');
   * console.log(authInfo.scopes);
   * console.log(authInfo.user);
   * ```
   */
  async getCurrentAuthorizationInfo(accessToken: string): Promise<AuthorizationInformation> {
    if (!accessToken) throw new ValidationError('Access token is required');

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };

    return HttpClient.get<AuthorizationInformation>(`${this.apiEndpoint}/oauth2/@me`, headers);
  }

  /**
   * Helper method to get user information using an access token
   *
   * @param accessToken - The access token with identify scope
   * @returns User information
   *
   * @example
   * ```typescript
   * const user = await client.getUser('access-token');
   * console.log(user.username);
   * ```
   */
  async getUser(accessToken: string): Promise<User> {
    if (!accessToken) throw new ValidationError('Access token is required');

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };

    return HttpClient.get<User>(`${this.apiEndpoint}/users/@me`, headers);
  }

  /**
   * Helper method to get user guilds using an access token
   *
   * @param accessToken - The access token with guilds scope
   * @returns Array of partial guild objects
   *
   * @example
   * ```typescript
   * const guilds = await client.getUserGuilds('access-token');
   * console.log(guilds.length);
   * ```
   */
  async getUserGuilds(accessToken: string): Promise<Partial<Guild>[]> {
    if (!accessToken) throw new ValidationError('Access token is required');

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };

    return HttpClient.get<Partial<Guild>[]>(`${this.apiEndpoint}/users/@me/guilds`, headers);
  }

  /**
   * Helper method to get user connections using an access token
   *
   * @param accessToken - The access token with connections scope
   * @returns Array of connection objects
   *
   * @example
   * ```typescript
   * const connections = await client.getUserConnections('access-token');
   * ```
   */
  async getUserConnections(accessToken: string): Promise<Connection[]> {
    if (!accessToken) throw new ValidationError('Access token is required');

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };

    return HttpClient.get<Connection[]>(`${this.apiEndpoint}/users/@me/connections`, headers);
  }

  /**
   * Parse scopes from a scope string
   *
   * @param scopeString - Space-separated scope string
   * @returns Array of scopes
   *
   * @example
   * ```typescript
   * const scopes = OAuth2Client.parseScopes('identify email guilds');
   * // Returns: ['identify', 'email', 'guilds']
   * ```
   */
  static parseScopes(scopeString: string): string[] {
    return parseScopeString(scopeString);
  }

  /**
   * Get the client ID
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Get the redirect URI
   */
  getRedirectUri(): string {
    return this.redirectUri;
  }

  /**
   * Get the API endpoint
   */
  getApiEndpoint(): string {
    return this.apiEndpoint;
  }
}
