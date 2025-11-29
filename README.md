# discord-oauth2

<p align="center">
  <a href="https://www.npmjs.com/package/@oneshot101/discord-oauth2"><img src="https://img.shields.io/npm/v/@oneshot101/discord-oauth2?style=for-the-badge&logo=npm&logoColor=white" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@oneshot101/discord-oauth2"><img src="https://img.shields.io/npm/dm/@oneshot101/discord-oauth2?style=for-the-badge&logo=npm&logoColor=white" alt="npm downloads"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Runs on Bun"></a>
  <a href="https://typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://eslint.org"><img src="https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint"></a>
  <a href="https://prettier.io"><img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black" alt="Prettier"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a>
</p>

`discord-oauth2` is a TypeScript-first toolkit that smooths over every Discord OAuth2 flow (auth code, client credentials, webhooks, bot installs) so you can focus on your product instead of juggling HTTP spec details.

## Highlights

- **Typed front to back.** Requests, responses, and even optional webhook payloads mirror Discord's docs, so autocomplete tells you what's safe to access.
- **One client, all flows.** Authorization code, implicit, client credentials, bot installs, and webhook grants live behind a single interface.
- **Zero fluff runtime.** No dependencies and tiny output.
- **Smart helpers.** Scope parsing, permission math, and URL builders trim the glue code that usually clutters OAuth integrations.
- **Bot-token aware.** Pass a bot token once and call `addUserToGuild` the moment someone completes the `guilds.join` flow.

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

## Quick start

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

That snippet spins up the client, builds an auth URL, exchanges the returned code, and fetches the user's profile. Need to keep guild operations separate? Skip `botToken` for now and call `client.setBotToken()` later.

### Scope-aware token responses

Discord only returns `webhook` and `guild` payloads for specific scopes. Pass the scopes you requested and the response type narrows automatically:

```ts
const tokens = await client.exchangeCode('authorization-code', {
  scopes: ['identify', 'webhook.incoming'],
});

console.log(tokens.webhook.url);

const refreshed = await client.refreshToken(tokens.refresh_token!, {
  scopes: ['identify', 'webhook.incoming'],
});
```

## Covering the Discord flows

- `generateAuthUrl` and `exchangeCode` cover human login flows with CSRF-safe state params.
- `getClientCredentials` creates app-only tokens for server-to-server calls.
- `generateBotAuthUrl` produces the installer link for bots and can pre-select guilds or scopes.
- `getUser`, `getUserGuilds`, and `getUserConnections` fetch user data once you have a token.

## Bot authorization & permissions

```ts
import { PermissionFlags, calculatePermissions } from '@oneshot101/discord-oauth2';

const perms = calculatePermissions([PermissionFlags.VIEW_CHANNEL, PermissionFlags.SEND_MESSAGES]);

const url = client.generateBotAuthUrl({ permissions: perms });
console.log(url);
```

`generateBotAuthUrl` automatically includes the `bot` scope, adds anything else you pass, and keeps permission bit math easy to reason about.

## Token management

```ts
const refreshed = await client.refreshToken(tokens.refresh_token);
await client.revokeToken(tokens.access_token);
```

Use `refreshToken` when Discord hands you a fresh pair, and `revokeToken` when you want to invalidate leaked credentials in one call.

## Add members to guilds

Provide a bot token (up front or later via `client.setBotToken()`) and you can upsert members with the access token they granted your app (`guilds.join` scope required):

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

Behind the scenes the client issues the `PUT /guilds/{guild}/members/{user}` call with your bot token so you can gate communities or premium servers without extra HTTP plumbing.

## Permission helpers

- `calculatePermissions()`
- `hasPermission()`
- `getPermissionFlags()`
- `PermissionPresets`

They ship alongside `OAuth2Client.parseScopes()`, `DISCORD_OAUTH2_URLS`, and `DEFAULT_API_ENDPOINT` so you can keep custom flows strongly typed.

## Links

- GitHub: [https://github.com/0neShot101/discord-oauth2](https://github.com/0neShot101/discord-oauth2)
- License: MIT
