# discord-oauth2

A modern, type-safe OAuth2 client for Discord. Built with TypeScript. Works in Node.js and Bun.

[![npm version](https://img.shields.io/npm/v/@oneshot101/discord-oauth2.svg)](https://www.npmjs.com/package/@oneshot101/discord-oauth2)

## Features

- Fully typed with strict TypeScript
- Zero dependencies
- Supports all Discord OAuth2 flows
- Built-in permission utilities
- ESM & CommonJS compatible

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
});

const url = client.generateAuthUrl({
  scopes: ['identify', 'email'],
  state: 'csrf-token',
});

const tokens = await client.exchangeCode('authorization-code');
const user = await client.getUser(tokens.access_token);
console.log(user.username);
```

## Bot Authorization

```ts
import { PermissionFlags, calculatePermissions } from '@oneshot101/discord-oauth2';

const perms = calculatePermissions([PermissionFlags.VIEW_CHANNEL, PermissionFlags.SEND_MESSAGES]);

const url = client.generateBotAuthUrl({ permissions: perms });
console.log(url);
```

## Token Management

```ts
const refreshed = await client.refreshToken(tokens.refresh_token);
await client.revokeToken(tokens.access_token);
```

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

## Permission Utilities

- calculatePermissions()
- hasPermission()
- getPermissionFlags()
- PermissionPresets

## Links

- GitHub: [https://github.com/0neShot101/discord-oauth2](https://github.com/0neShot101/discord-oauth2)
- License: MIT
