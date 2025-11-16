/**
 * Discord Permission Flags
 * Based on Discord's permission system
 * @see https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags
 */
export const PermissionFlags = {
  'CREATE_INSTANT_INVITE': 1n << 0n,
  'KICK_MEMBERS': 1n << 1n,
  'BAN_MEMBERS': 1n << 2n,
  'ADMINISTRATOR': 1n << 3n,
  'MANAGE_CHANNELS': 1n << 4n,
  'MANAGE_GUILD': 1n << 5n,
  'ADD_REACTIONS': 1n << 6n,
  'VIEW_AUDIT_LOG': 1n << 7n,
  'PRIORITY_SPEAKER': 1n << 8n,
  'STREAM': 1n << 9n,
  'VIEW_CHANNEL': 1n << 10n,
  'SEND_MESSAGES': 1n << 11n,
  'SEND_TTS_MESSAGES': 1n << 12n,
  'MANAGE_MESSAGES': 1n << 13n,
  'EMBED_LINKS': 1n << 14n,
  'ATTACH_FILES': 1n << 15n,
  'READ_MESSAGE_HISTORY': 1n << 16n,
  'MENTION_EVERYONE': 1n << 17n,
  'USE_EXTERNAL_EMOJIS': 1n << 18n,
  'VIEW_GUILD_INSIGHTS': 1n << 19n,
  'CONNECT': 1n << 20n,
  'SPEAK': 1n << 21n,
  'MUTE_MEMBERS': 1n << 22n,
  'DEAFEN_MEMBERS': 1n << 23n,
  'MOVE_MEMBERS': 1n << 24n,
  'USE_VAD': 1n << 25n,
  'CHANGE_NICKNAME': 1n << 26n,
  'MANAGE_NICKNAMES': 1n << 27n,
  'MANAGE_ROLES': 1n << 28n,
  'MANAGE_WEBHOOKS': 1n << 29n,
  'MANAGE_GUILD_EXPRESSIONS': 1n << 30n,
  'USE_APPLICATION_COMMANDS': 1n << 31n,
  'REQUEST_TO_SPEAK': 1n << 32n,
  'MANAGE_EVENTS': 1n << 33n,
  'MANAGE_THREADS': 1n << 34n,
  'CREATE_PUBLIC_THREADS': 1n << 35n,
  'CREATE_PRIVATE_THREADS': 1n << 36n,
  'USE_EXTERNAL_STICKERS': 1n << 37n,
  'SEND_MESSAGES_IN_THREADS': 1n << 38n,
  'USE_EMBEDDED_ACTIVITIES': 1n << 39n,
  'MODERATE_MEMBERS': 1n << 40n,
  'VIEW_CREATOR_MONETIZATION_ANALYTICS': 1n << 41n,
  'USE_SOUNDBOARD': 1n << 42n,
  'CREATE_GUILD_EXPRESSIONS': 1n << 43n,
  'CREATE_EVENTS': 1n << 44n,
  'USE_EXTERNAL_SOUNDS': 1n << 45n,
  'SEND_VOICE_MESSAGES': 1n << 46n,
  'SEND_POLLS': 1n << 49n,
  'USE_EXTERNAL_APPS': 1n << 50n,
} as const satisfies Record<string, bigint>;

export type PermissionFlag = (typeof PermissionFlags)[keyof typeof PermissionFlags];

export const PermissionPresets = {
  'NONE': 0n,
  'ADMINISTRATOR': PermissionFlags.ADMINISTRATOR,
  'BASIC_TEXT': PermissionFlags.VIEW_CHANNEL | PermissionFlags.SEND_MESSAGES | PermissionFlags.READ_MESSAGE_HISTORY,
  'BASIC_VOICE': PermissionFlags.VIEW_CHANNEL | PermissionFlags.CONNECT | PermissionFlags.SPEAK,
  'MODERATOR':
    PermissionFlags.KICK_MEMBERS |
    PermissionFlags.BAN_MEMBERS |
    PermissionFlags.MANAGE_MESSAGES |
    PermissionFlags.MODERATE_MEMBERS,
  'TEXT_AND_EMBEDS':
    PermissionFlags.VIEW_CHANNEL |
    PermissionFlags.SEND_MESSAGES |
    PermissionFlags.EMBED_LINKS |
    PermissionFlags.ATTACH_FILES |
    PermissionFlags.READ_MESSAGE_HISTORY,
} as const satisfies Record<string, bigint>;

/**
 * Calculate permissions from an array of permission flags
 *
 * @param permissions - Array of permission flags or bigints
 * @returns Combined permission value as string
 *
 * @example
 * ```typescript
 * import { calculatePermissions, PermissionFlags } from 'discord-oauth2';
 *
 * const perms = calculatePermissions([
 *   PermissionFlags.SEND_MESSAGES,
 *   PermissionFlags.EMBED_LINKS,
 *   PermissionFlags.ATTACH_FILES,
 * ]);
 * console.log(perms);
 * ```
 */
export const calculatePermissions = (permissions: (PermissionFlag | bigint)[]): string => {
  const combined = permissions.reduce((acc, perm) => acc | perm, 0n);
  return combined.toString();
};

/**
 * Check if a permission value has a specific permission flag
 *
 * @param permissions - Permission value (string or bigint)
 * @param flag - Permission flag to check
 * @returns True if the permission is present
 *
 * @example
 * ```typescript
 * const perms = calculatePermissions([PermissionFlags.SEND_MESSAGES, PermissionFlags.EMBED_LINKS]);
 * const canSend = hasPermission(perms, PermissionFlags.SEND_MESSAGES);
 * const isAdmin = hasPermission(perms, PermissionFlags.ADMINISTRATOR);
 * console.log({ canSend, isAdmin });
 * ```
 */
export const hasPermission = (permissions: string | bigint, flag: PermissionFlag | bigint): boolean => {
  const perms = typeof permissions === 'string' ? BigInt(permissions) : permissions;
  return (perms & flag) === flag;
};

/**
 * Get all permission flags from a permission value
 *
 * @param permissions - Permission value (string or bigint)
 * @returns Array of permission flag names
 *
 * @example
 * ```typescript
 * const flags = getPermissionFlags('2048');
 * console.log(flags);
 * ```
 */
export const getPermissionFlags = (permissions: string | bigint): string[] => {
  const perms = typeof permissions === 'string' ? BigInt(permissions) : permissions;
  const flags: string[] = [];

  for (const [name, value] of Object.entries(PermissionFlags)) {
    if (typeof value === 'bigint' && (perms & value) === value) flags.push(name);
  }

  return flags;
};
