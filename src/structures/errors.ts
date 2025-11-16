import type { DiscordAPIError } from './types';

/**
 * Base error class for Discord OAuth2 errors
 */
export class OAuth2Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OAuth2Error';
    Object.setPrototypeOf(this, OAuth2Error.prototype);
  }
}

/**
 * Error thrown when Discord API returns an error response
 */
export class DiscordAPIRequestError extends OAuth2Error {
  public readonly statusCode: number;
  public readonly code: number | undefined;
  public readonly errors: Record<string, unknown> | undefined;

  constructor(message: string, statusCode: number, errorData?: DiscordAPIError) {
    super(message);
    this.name = 'DiscordAPIRequestError';
    this.statusCode = statusCode;
    this.code = errorData?.code;
    this.errors = errorData?.errors;
    Object.setPrototypeOf(this, DiscordAPIRequestError.prototype);
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends OAuth2Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error thrown when required parameters are missing
 */
export class ValidationError extends OAuth2Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
