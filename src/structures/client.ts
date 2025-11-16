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
  AddGuildMemberOptions,
  AuthorizationInformation,
  AuthorizationUrlOptions,
  BotAuthorizationUrlOptions,
  Connection,
  Guild,
  OAuth2ClientOptions,
  OAuth2Scope,
  PartialApplication,
  ScopedAccessTokenResponse,
  ScopedRefreshableAccessTokenResponse,
  TokenExchangeOptions,
  TokenTypeHint,
  User,
} from '@structures/types';

/**
 * High-level wrapper around Discord's OAuth2 endpoints.
 *
 * Handles URL generation, token exchanges, revocations, and helper requests with
 * strong typing so your app can adopt new scopes and flows without guesswork.
 *
 * @example
 * ```typescript
 * const client = new OAuth2Client({
 *   clientId: 'your-client-id',
 *   clientSecret: 'your-client-secret',
 *   redirectUri: 'https://your-app.com/callback',
 * });
 *
 * const authUrl = client.generateAuthUrl({
 *   scopes: ['identify', 'guilds'],
 *   state: 'csrf-token',
 * });
 *
 * const tokenData = await client.exchangeCode('authorization-code');
 * ```
 */
export class OAuth2Client {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly apiEndpoint: string;
  private botToken: string | undefined;

  /**
   * @param options - Credentials and routing information for your OAuth2 application
   * @throws ValidationError If any required property is missing
   */
  constructor(options: OAuth2ClientOptions) {
    if (!options.clientId || !options.clientSecret || !options.redirectUri)
      throw new ValidationError('clientId, clientSecret, and redirectUri are required');

    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri;
    this.apiEndpoint = options.apiEndpoint || DEFAULT_API_ENDPOINT;
    this.botToken = options.botToken;
  }

  /**
   * Supplies or replaces the bot token used for privileged guild operations.
   *
   * @param botToken - Bot token from your Discord application
   * @throws ValidationError If the token is empty
   */
  setBotToken(botToken: string): void {
    if (!botToken) throw new ValidationError('Bot token is required');
    this.botToken = botToken;
  }

  /**
   * Builds the OAuth2 URL that Discord expects for the authorization-code flow.
   *
   * @param options - Scopes and optional prompt/state metadata
   * @returns A fully-qualified authorize URL
   * @throws ValidationError If no scopes are provided
   *
   * @example
   * ```typescript
   * const url = client.generateAuthUrl({
   *   scopes: ['identify', 'email', 'guilds'],
   *   state: 'csrf-token',
   *   prompt: 'consent',
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
   * Builds a bot-install URL, automatically prepending the `bot` scope.
   *
   * @param options - Permissions, guild targeting, and extra scopes
   * @returns A Discord authorize URL ready for linking
   *
   * @example
   * ```typescript
   * const url = client.generateBotAuthUrl({
   *   permissions: '8',
   *   guildId: '123456789012345678',
   * });
   * ```
   */
  generateBotAuthUrl(options: BotAuthorizationUrlOptions = {}): string {
    const scopes: OAuth2Scope[] = options.scopes ? ['bot', ...options.scopes] : ['bot'];

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
   * Exchanges a short-lived authorization code for an access token payload.
   *
   * @param code - The authorization code from the callback
   * @param options - Optional scope hint to narrow response typing
   * @returns Access token response
   * @throws ValidationError If no code is supplied
   *
   * @example
   * ```typescript
   * const tokenData = await client.exchangeCode('authorization-code');
   * console.log(tokenData.access_token);
   * console.log(tokenData.refresh_token);
   * ```
   */
  async exchangeCode<S extends readonly OAuth2Scope[] | undefined = undefined>(
    code: string,
    options?: TokenExchangeOptions<S>,
  ): Promise<ScopedRefreshableAccessTokenResponse<S>> {
    if (!code) throw new ValidationError('Authorization code is required');

    const body = toFormUrlEncoded({
      'grant_type': 'authorization_code',
      'code': code,
      'redirect_uri': this.redirectUri,
    });

    const headers = {
      'Authorization': encodeBasicAuth(this.clientId, this.clientSecret),
    };

    void options?.scopes;
    return HttpClient.post<ScopedRefreshableAccessTokenResponse<S>>(DISCORD_OAUTH2_URLS.TOKEN, body, headers);
  }

  /**
   * Swaps a refresh token for a fresh access token (and optionally a new refresh token).
   *
   * @param refreshToken - The refresh token issued from a previous grant
   * @param options - Optional scope hint to narrow response typing
   * @returns Updated access token payload
   * @throws ValidationError If no refresh token is provided
   *
   * @example
   * ```typescript
   * const newToken = await client.refreshToken('refresh-token');
   * console.log(newToken.access_token);
   * ```
   */
  async refreshToken<S extends readonly OAuth2Scope[] | undefined = undefined>(
    refreshToken: string,
    options?: TokenExchangeOptions<S>,
  ): Promise<ScopedRefreshableAccessTokenResponse<S>> {
    if (!refreshToken) throw new ValidationError('Refresh token is required');

    const body = toFormUrlEncoded({
      'grant_type': 'refresh_token',
      'refresh_token': refreshToken,
    });

    const headers = {
      'Authorization': encodeBasicAuth(this.clientId, this.clientSecret),
    };

    void options?.scopes;

    return HttpClient.post<ScopedRefreshableAccessTokenResponse<S>>(DISCORD_OAUTH2_URLS.TOKEN, body, headers);
  }

  /**
   * Requests an application-only token via the client credentials grant.
   *
   * @param scopes - Optional scopes to request
   * @returns Access token response
   *
   * @example
   * ```typescript
   * const token = await client.getClientCredentials(['identify', 'connections']);
   * ```
   */
  async getClientCredentials<S extends readonly OAuth2Scope[] | undefined = undefined>(
    scopes?: S,
  ): Promise<ScopedAccessTokenResponse<S>> {
    const body = toFormUrlEncoded({
      'grant_type': 'client_credentials',
      'scope': scopes ? scopes.join(' ') : undefined,
    });

    const headers = {
      'Authorization': encodeBasicAuth(this.clientId, this.clientSecret),
    };

    return HttpClient.post<ScopedAccessTokenResponse<S>>(DISCORD_OAUTH2_URLS.TOKEN, body, headers);
  }

  /**
   * Revokes a previously issued access token or refresh token.
   *
   * @param token - The token to revoke
   * @param tokenTypeHint - Optional hint about token type
   * @throws ValidationError If no token is provided
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
   * Adds or updates a user within a guild using the bot token and a user access token.
   *
   * @param guildId - Guild to add the member to
   * @param userId - User ID to upsert
   * @param userAccessToken - OAuth2 access token with the `guilds.join` scope
   * @param options - Optional nickname/role/voice overrides
   * @throws ValidationError If required data or bot token is missing
   */
  async addUserToGuild(
    guildId: string,
    userId: string,
    userAccessToken: string,
    options: AddGuildMemberOptions = {},
  ): Promise<void> {
    if (!this.botToken) throw new ValidationError('Bot token is required to add members to a guild');
    if (!guildId) throw new ValidationError('Guild ID is required');
    if (!userId) throw new ValidationError('User ID is required');
    if (!userAccessToken) throw new ValidationError('User access token is required');

    const payload = JSON.stringify({
      'access_token': userAccessToken,
      'nick': options.nick,
      'roles': options.roles,
      'mute': options.mute,
      'deaf': options.deaf,
    });

    const headers = {
      'Authorization': `Bot ${this.botToken}`,
    };

    await HttpClient.put<void>(`${this.apiEndpoint}/guilds/${guildId}/members/${userId}`, payload, headers);
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
   * Retrieves scopes, user, and application metadata for a bearer token.
   *
   * @param accessToken - The access token to inspect
   * @returns Authorization information
   * @throws ValidationError If no access token is provided
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
   * Fetches the `/users/@me` resource using a bearer token.
   *
   * @param accessToken - The access token with the `identify` scope
   * @returns User information
   * @throws ValidationError If no access token is provided
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
   * Lists guilds the current user is in via `/users/@me/guilds`.
   *
   * @param accessToken - The access token with the `guilds` scope
   * @returns Array of partial guild objects
   * @throws ValidationError If no access token is provided
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
   * Lists external service connections via `/users/@me/connections`.
   *
   * @param accessToken - The access token with the `connections` scope
   * @returns Array of connection objects
   * @throws ValidationError If no access token is provided
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
   * Splits a Discord scope string (e.g., `"identify email"`) into an array.
   *
   * @param scopeString - Space-separated scope string
   * @returns Array of scopes
   *
   * @example
   * ```typescript
   * const scopes = OAuth2Client.parseScopes('identify email guilds');
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
