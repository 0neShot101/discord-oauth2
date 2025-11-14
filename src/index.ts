/*
 discord-oauth2
 A developer-friendly, optimized Discord OAuth2 API package
 Created: 11/13/2025
*/

export { OAuth2Client } from '@structures/client';
export { ConfigurationError, DiscordAPIRequestError, OAuth2Error, ValidationError } from '@structures/errors';
export { DEFAULT_API_ENDPOINT, DISCORD_OAUTH2_URLS } from '@utils/helpers';
export {
  calculatePermissions,
  getPermissionFlags,
  hasPermission,
  PermissionFlags,
  PermissionPresets,
} from '@utils/permissions';

export type {
  AccessTokenResponse,
  AuthorizationInformation,
  AuthorizationUrlOptions,
  BotAuthorizationUrlOptions,
  Connection,
  DiscordAPIError,
  Emoji,
  GrantType,
  Guild,
  IntegrationType,
  OAuth2ClientOptions,
  OAuth2Scope,
  PartialApplication,
  PromptType,
  ResponseType,
  Role,
  TokenTypeHint,
  User,
  WebhookResponse,
} from '@structures/types';
export type { PermissionFlag } from '@utils/permissions';
