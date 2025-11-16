/**
 * OAuth2 Grant Types supported by Discord
 */
export type GrantType = 'authorization_code' | 'refresh_token' | 'client_credentials';

/**
 * OAuth2 Response Types
 */
export type ResponseType = 'code' | 'token';

/**
 * OAuth2 Token Type Hints for revocation
 */
export type TokenTypeHint = 'access_token' | 'refresh_token';

/**
 * Prompt behavior for authorization flow
 */
export type PromptType = 'consent' | 'none';

/**
 * Integration/Installation context type.
 * 0 = guild install, 1 = user install.
 */
export type IntegrationType = 0 | 1;

/**
 * Discord OAuth2 Scopes
 */
export type OAuth2Scope =
  | 'activities.read'
  | 'activities.write'
  | 'applications.builds.read'
  | 'applications.builds.upload'
  | 'applications.commands'
  | 'applications.commands.update'
  | 'applications.commands.permissions.update'
  | 'applications.entitlements'
  | 'applications.store.update'
  | 'bot'
  | 'connections'
  | 'dm_channels.read'
  | 'email'
  | 'gdm.join'
  | 'guilds'
  | 'guilds.join'
  | 'guilds.members.read'
  | 'identify'
  | 'messages.read'
  | 'relationships.read'
  | 'role_connections.write'
  | 'rpc'
  | 'rpc.activities.write'
  | 'rpc.notifications.read'
  | 'rpc.voice.read'
  | 'rpc.voice.write'
  | 'voice'
  | 'webhook.incoming';

/**
 * OAuth2 Client configuration options
 */
export interface OAuth2ClientOptions {
  /** Your application's client ID */
  'clientId': string;
  /** Your application's client secret */
  'clientSecret': string;
  /** Your registered redirect URI */
  'redirectUri': string;
  /** Base API endpoint (default: https://discord.com/api/v10) */
  'apiEndpoint'?: string;
  /** Optional bot token for guild membership operations */
  'botToken'?: string;
}

/**
 * Authorization URL generation options
 */
export interface AuthorizationUrlOptions {
  /** OAuth2 scopes to request */
  'scopes': OAuth2Scope[];
  /** State parameter for CSRF protection */
  'state'?: string;
  /** Response type (code or token) */
  'responseType'?: ResponseType;
  /** Prompt behavior */
  'prompt'?: PromptType;
  /** Integration/installation context type */
  'integrationType'?: IntegrationType;
  /** Guild ID to pre-fill */
  'guildId'?: string;
  /** Disable guild selection */
  'disableGuildSelect'?: boolean;
  /** Bot permissions (as integer or string) */
  'permissions'?: number | string;
}

/**
 * Bot authorization URL options
 */
export interface BotAuthorizationUrlOptions {
  /** Bot permissions (as integer or string) */
  'permissions'?: number | string;
  /** Guild ID to pre-fill */
  'guildId'?: string;
  /** Disable guild selection */
  'disableGuildSelect'?: boolean;
  /** Additional scopes beyond 'bot' */
  'scopes'?: OAuth2Scope[];
  /** State parameter for CSRF protection */
  'state'?: string;
}

/**
 * Base access token response from Discord
 */
export interface AccessTokenResponseBase {
  /** The access token */
  'access_token': string;
  /** Token type (always Bearer) */
  'token_type': string;
  /** Expires in seconds */
  'expires_in': number;
  /** Granted scopes */
  'scope': string;
}

/**
 * Access token response for flows that yield a refresh token
 */
export interface AccessTokenResponseWithRefresh extends AccessTokenResponseBase {
  /** Refresh token issued alongside the access token */
  'refresh_token': string;
}

/**
 * Access token response when webhook scope is requested
 */
export interface AccessTokenResponseWithWebhook extends AccessTokenResponseBase {
  /** Webhook information (only for webhook.incoming scope) */
  'webhook': WebhookResponse;
}

/**
 * Access token response when bot scope is combined with other scopes
 */
export interface AccessTokenResponseWithGuild extends AccessTokenResponseBase {
  /** Guild information (only for bot authorization with additional scopes) */
  'guild': Partial<Guild>;
}

/**
 * Utility type to determine if a scopes array contains a particular scope
 */
export type IncludesScope<
  Scopes extends readonly OAuth2Scope[] | undefined,
  Target extends OAuth2Scope,
> = Scopes extends readonly OAuth2Scope[] ? (Target extends Scopes[number] ? true : false) : false;

/**
 * Resolve access token response shape based on requested scopes
 */
type ScopeAugmentedResponse<Base extends AccessTokenResponseBase, Scopes extends readonly OAuth2Scope[] | undefined> =
  IncludesScope<Scopes, 'webhook.incoming'> extends true
    ? IncludesScope<Scopes, 'bot'> extends true
      ? Base & { 'webhook': WebhookResponse } & { 'guild': Partial<Guild> }
      : Base & { 'webhook': WebhookResponse }
    : IncludesScope<Scopes, 'bot'> extends true
      ? Base & { 'guild': Partial<Guild> }
      : Base;

export type AccessTokenResponseForScopes<Scopes extends readonly OAuth2Scope[] | undefined> = ScopeAugmentedResponse<
  AccessTokenResponseBase,
  Scopes
>;

export type RefreshableAccessTokenResponseForScopes<Scopes extends readonly OAuth2Scope[] | undefined> =
  ScopeAugmentedResponse<AccessTokenResponseWithRefresh, Scopes>;

/**
 * Default access token response type when scopes are unknown
 */
export type AccessTokenResponse = AccessTokenResponseBase & {
  'refresh_token'?: string;
  'webhook'?: WebhookResponse;
  'guild'?: Partial<Guild>;
};

/**
 * Options to help narrow token response typing when exchanging or refreshing tokens
 */
export interface TokenExchangeOptions<Scopes extends readonly OAuth2Scope[] | undefined = undefined> {
  scopes: Scopes;
}

/**
 * Options when forcing a member into a guild via bot token
 */
export interface AddGuildMemberOptions {
  /** Nickname to set for the joined member */
  'nick'?: string;
  /** Role IDs to grant immediately */
  'roles'?: string[];
  /** Whether to mute the member in voice channels */
  'mute'?: boolean;
  /** Whether to deafen the member in voice channels */
  'deaf'?: boolean;
}

/**
 * Helper type that resolves to the correct token response based on provided scopes
 */
export type ScopedAccessTokenResponse<Scopes extends readonly OAuth2Scope[] | undefined> =
  Scopes extends readonly OAuth2Scope[] ? AccessTokenResponseForScopes<Scopes> : AccessTokenResponse;

export type ScopedRefreshableAccessTokenResponse<Scopes extends readonly OAuth2Scope[] | undefined> =
  Scopes extends readonly OAuth2Scope[]
    ? RefreshableAccessTokenResponseForScopes<Scopes>
    : AccessTokenResponse & { 'refresh_token': string };

/**
 * Webhook response embedded in access token
 */
export interface WebhookResponse {
  /** Application ID */
  'application_id': string;
  /** Webhook name */
  'name': string;
  /** Webhook execution URL */
  'url': string;
  /** Channel ID */
  'channel_id': string;
  /** Webhook token */
  'token': string;
  /** Webhook type */
  'type': number;
  /** Webhook avatar hash */
  'avatar': string | null;
  /** Guild ID */
  'guild_id': string;
  /** Webhook ID */
  'id': string;
}

/**
 * Discord User object
 */
export interface User {
  /** User's ID */
  'id': string;
  /** User's username */
  'username': string;
  /** User's discriminator (legacy, now "0" for most users) */
  'discriminator': string;
  /** User's display name */
  'global_name': string | null;
  /** User's avatar hash */
  'avatar': string | null;
  /** Whether the user is a bot */
  'bot'?: boolean;
  /** Whether the user is a system user */
  'system'?: boolean;
  /** Whether the user has MFA enabled */
  'mfa_enabled'?: boolean;
  /** User's banner hash */
  'banner'?: string | null;
  /** User's banner color */
  'accent_color'?: number | null;
  /** User's chosen language */
  'locale'?: string;
  /** Whether email is verified */
  'verified'?: boolean;
  /** User's email */
  'email'?: string | null;
  /** User's flags */
  'flags'?: number;
  /** User's premium type */
  'premium_type'?: number;
  /** User's public flags */
  'public_flags'?: number;
}

/**
 * Partial Guild object
 */
export interface Guild {
  /** Guild ID */
  'id': string;
  /** Guild name */
  'name': string;
  /** Guild icon hash */
  'icon': string | null;
  /** Guild description */
  'description': string | null;
  /** Guild splash hash */
  'splash': string | null;
  /** Guild discovery splash hash */
  'discovery_splash': string | null;
  /** Guild banner hash */
  'banner': string | null;
  /** Owner ID */
  'owner_id': string;
  /** Region */
  'region': string;
  /** AFK channel ID */
  'afk_channel_id': string | null;
  /** AFK timeout */
  'afk_timeout': number;
  /** Verification level */
  'verification_level': number;
  /** Default message notifications */
  'default_message_notifications': number;
  /** Explicit content filter */
  'explicit_content_filter': number;
  /** Roles */
  'roles': Role[];
  /** Emojis */
  'emojis': Emoji[];
  /** Features */
  'features': string[];
  /** MFA level */
  'mfa_level': number;
  /** Application ID */
  'application_id': string | null;
  /** System channel ID */
  'system_channel_id': string | null;
  /** System channel flags */
  'system_channel_flags': number;
  /** Rules channel ID */
  'rules_channel_id': string | null;
  /** Max presences */
  'max_presences'?: number | null;
  /** Max members */
  'max_members'?: number;
  /** Vanity URL code */
  'vanity_url_code': string | null;
  /** Premium tier */
  'premium_tier': number;
  /** Premium subscription count */
  'premium_subscription_count'?: number;
  /** Preferred locale */
  'preferred_locale': string;
  /** Public updates channel ID */
  'public_updates_channel_id': string | null;
  /** Max video channel users */
  'max_video_channel_users'?: number;
  /** Widget enabled */
  'widget_enabled'?: boolean;
  /** Widget channel ID */
  'widget_channel_id'?: string | null;
  /** Safety alerts channel ID */
  'safety_alerts_channel_id': string | null;
}

/**
 * Emoji object
 */
export interface Emoji {
  /** Emoji ID */
  'id': string | null;
  /** Emoji name */
  'name': string | null;
  /** Roles allowed to use this emoji */
  'roles'?: string[];
  /** User that created this emoji */
  'user'?: User;
  /** Whether this emoji must be wrapped in colons */
  'require_colons'?: boolean;
  /** Whether this emoji is managed */
  'managed'?: boolean;
  /** Whether this emoji is animated */
  'animated'?: boolean;
  /** Whether this emoji can be used (may be false due to loss of Server Boosts) */
  'available'?: boolean;
}

/**
 * Role object
 */
export interface Role {
  /** Role ID */
  'id': string;
  /** Role name */
  'name': string;
  /** Role color */
  'color': number;
  /** Whether role is hoisted */
  'hoist': boolean;
  /** Role position */
  'position': number;
  /** Role permissions */
  'permissions': string;
  /** Whether role is managed */
  'managed': boolean;
  /** Whether role is mentionable */
  'mentionable': boolean;
}

/**
 * Partial Application object
 */
export interface PartialApplication {
  /** Application ID */
  'id': string;
  /** Application name */
  'name': string;
  /** Application icon hash */
  'icon': string | null;
  /** Application description */
  'description': string;
  /** Whether application has a webhook */
  'hook'?: boolean;
  /** Whether bot is public */
  'bot_public'?: boolean;
  /** Whether bot requires code grant */
  'bot_require_code_grant'?: boolean;
  /** Verification key */
  'verify_key': string;
}

/**
 * Connection object
 */
export interface Connection {
  /** Connection ID */
  'id': string;
  /** Connection name */
  'name': string;
  /** Service type (twitch, youtube, etc.) */
  'type': string;
  /** Whether the connection is revoked */
  'revoked'?: boolean;
  /** Array of partial server integrations */
  'integrations'?: unknown[];
  /** Whether the connection is verified */
  'verified': boolean;
  /** Whether friend sync is enabled */
  'friend_sync': boolean;
  /** Whether activities to this connection will be shown in presence */
  'show_activity': boolean;
  /** Whether this connection has a corresponding third party OAuth2 token */
  'two_way_link': boolean;
  /** Visibility of this connection (0 = none, 1 = everyone) */
  'visibility': 0 | 1;
}

/**
 * Current authorization information
 */
export interface AuthorizationInformation {
  /** The authorized application */
  'application': PartialApplication;
  /** Authorized scopes */
  'scopes': string[];
  /** Token expiration timestamp */
  'expires': string;
  /** Authorized user (if identify scope granted) */
  'user'?: User;
}

/**
 * Error response from Discord API
 */
export interface DiscordAPIError {
  /** Error code */
  'code'?: number;
  /** Error message */
  'message': string;
  /** Additional error details */
  'errors'?: Record<string, unknown>;
}
