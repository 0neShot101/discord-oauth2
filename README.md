# discord-oauth2

`discord-oauth2` is a TypeScript-first companion for Discord's OAuth2 endpoints. It wraps every flow (auth code, bot installs, client credentials, webhooks) with predictable typings so you can focus on your product instead of juggling HTTP calls.

[![npm version](https://img.shields.io/npm/v/@oneshot101/discord-oauth2.svg)](https://www.npmjs.com/package/@oneshot101/discord-oauth2)

## Features

- **Strict typing from end to end.** Every request and response tracks Discord's docs, including conditional webhook fields and refresh-token guarantees.
- **Tiny, dependency-free core.** Nothing extra ships in your bundle.
- **All flows covered.** Authorization code, implicit, client credentials, bot installs, and webhook grants live under one interface.
- **Built-in niceties.** Helpers for permissions, scope parsing, and URL building keep glue code out of your app.
- **Bot-token aware.** Pass a bot token once and call `addUserToGuild` whenever someone completes the `guilds.join` flow.
- **ESM & CJS ready.** Works in Bun, Node, or any modern runtime.

## Installation

```bash
# npm
npm install @oneshot101/discord-oauth2

# pnpm
pnpm add @oneshot101/discord-oauth2

# yarn
yarn add @oneshot101/discord-oauth2

# bun
bun add @oneshot101/discord-oauth2
```

## Quick Start

```ts
import { OAuth2Client } from '@oneshot101/discord-oauth2';

const client = new OAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://your-app.com/callback',
  botToken: process.env.BOT_TOKEN,
});

const url = client.generateAuthUrl({
  scopes: ['identify', 'email'],
  state: 'csrf-token',
});

const tokens = await client.exchangeCode('authorization-code');
const user = await client.getUser(tokens.access_token);
console.log(user.username);
```

That snippet boots the client, produces a login URL, exchanges the returned code, and finally fetches the logged-in user's profile. Every step benefits from autocomplete and compile-time checks.

Don't need guild management? Skip the `botToken` field. You can always call `client.setBotToken()` later when you start inviting people automatically.

### Scope-aware token responses

Discord only includes `webhook` and `guild` fields in certain flows. Pass the scopes you requested and the library narrows the response shape for you—no `as const` needed:

```ts
const tokens = await client.exchangeCode('authorization-code', {
  scopes: ['identify', 'webhook.incoming'],
});

console.log(tokens.webhook.url);

const refreshed = await client.refreshToken(tokens.refresh_token!, {
  scopes: ['identify', 'webhook.incoming'],
});
```

## Bot Authorization

```ts
import { PermissionFlags, calculatePermissions } from '@oneshot101/discord-oauth2';

const perms = calculatePermissions([PermissionFlags.VIEW_CHANNEL, PermissionFlags.SEND_MESSAGES]);

const url = client.generateBotAuthUrl({ permissions: perms });
console.log(url);
```

`generateBotAuthUrl` automatically includes the `bot` scope and can tack on extra scopes when you need them. Hand it a guild ID to pre-select a server or pass a `state` string for CSRF protection.

## Token Management

```ts
const refreshed = await client.refreshToken(tokens.refresh_token);
await client.revokeToken(tokens.access_token);
```

`refreshToken` swaps stale tokens for fresh ones (and keeps `refresh_token` typed), while `revokeToken` invalidates leaked credentials in a single call.

## Add members to guilds

If you pass a bot token (either in the constructor or later via `client.setBotToken()`), you can upsert users into a guild using the access token they granted your app (`guilds.join` scope required):

```ts
const memberTokens = await client.exchangeCode('authorization-code', {
  scopes: ['identify', 'guilds.join'],
});
const user = await client.getUser(memberTokens.access_token);

await client.addUserToGuild('123456789012345678', user.id, memberTokens.access_token, {
  nick: 'New friend',
  roles: ['987654321098765432'],
});
```

Behind the scenes the client issues the `PUT /guilds/{guild}/members/{user}` call with your bot token so you can gate communities or premium servers without juggling extra HTTP code.

## Key Methods

- generateAuthUrl()
- generateBotAuthUrl()
- exchangeCode()
- refreshToken()
- revokeToken()
- getUser()
- getUserGuilds()
- getUserConnections()
- getClientCredentials()
- setBotToken()
- addUserToGuild()

### Handy extras

- `OAuth2Client.parseScopes()` turns a raw scope string into an array for storage.
- Permission helpers (`calculatePermissions`, `hasPermission`, `getPermissionFlags`) keep bit math approachable.
- `DISCORD_OAUTH2_URLS` and `DEFAULT_API_ENDPOINT` are exported if you need to build custom calls.

## Permission Utilities

- calculatePermissions()
- hasPermission()
- getPermissionFlags()
- PermissionPresets

## Links

- GitHub: [https://github.com/0neShot101/discord-oauth2](https://github.com/0neShot101/discord-oauth2)
- License: MIT
