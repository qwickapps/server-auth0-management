# @qwickapps/server-auth0-management

QwickApps Server plugin for managing Auth0 Actions programmatically.

## Overview

This plugin provides:
- Programmatic deployment of Auth0 Actions for entitlements and ban management
- REST API endpoints for managing actions and trigger bindings
- Downloadable action bundles for manual Auth0 deployment
- Health check integration with QwickApps control panel

## Installation

```bash
pnpm add @qwickapps/server-auth0-management
```

## Configuration

Add the plugin to your QwickApps server configuration:

```typescript
import { auth0ManagementPlugin } from '@qwickapps/server-auth0-management';

// In your server plugin configuration
{
  plugin: auth0ManagementPlugin,
  config: {
    // Auth0 M2M Application credentials
    domain: 'your-tenant.auth0.com',
    clientId: 'your-m2m-client-id',
    clientSecret: 'your-m2m-client-secret',

    // QwickApps API configuration (for action callbacks)
    qwickappsApiUrl: 'https://api.yourapp.com',
    qwickappsApiKey: 'your-api-key',

    // Optional settings
    defaultTimeoutMs: 5000,
    claimsNamespace: 'https://qwickapps.com',
  },
}
```

### Auth0 M2M Application Setup

1. Create a Machine-to-Machine application in Auth0
2. Authorize the application for the Auth0 Management API
3. Grant the following permissions:
   - `read:actions`
   - `create:actions`
   - `update:actions`
   - `delete:actions`
   - `read:triggers`
   - `update:triggers`

## API Endpoints

### Actions Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth0/actions` | List deployed QwickApps actions |
| `POST` | `/api/auth0/actions/deploy` | Deploy post-login action |
| `DELETE` | `/api/auth0/actions/:actionId` | Undeploy an action |

### Trigger Bindings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth0/triggers/post-login` | List post-login bindings |
| `POST` | `/api/auth0/triggers/post-login/bind` | Bind action to post-login |
| `DELETE` | `/api/auth0/triggers/post-login/:actionId` | Unbind action |
| `PUT` | `/api/auth0/triggers/post-login/reorder` | Reorder bindings |

### Action Bundles

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth0/bundle/post-login` | Get bundle info (JSON) |
| `GET` | `/api/auth0/bundle/post-login/download` | Download JS bundle |

### Configuration

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth0/config` | Get config (secrets masked) |
| `POST` | `/api/auth0/config/test` | Test Auth0 connection |

## Usage Examples

### Deploy Post-Login Action

```bash
curl -X POST http://localhost:3000/api/auth0/actions/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "skipBanCheck": false,
    "skipEntitlementsSync": false
  }'
```

Response:
```json
{
  "success": true,
  "actionId": "act_abc123",
  "deployed": true
}
```

### Bind Action to Trigger

```bash
curl -X POST http://localhost:3000/api/auth0/triggers/post-login/bind \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": "act_abc123",
    "displayName": "QwickApps Post-Login",
    "position": 0
  }'
```

### Download Bundle for Manual Setup

```bash
curl -o qwickapps-post-login.js \
  http://localhost:3000/api/auth0/bundle/post-login/download
```

### Test Connection

```bash
curl -X POST http://localhost:3000/api/auth0/config/test
```

Response:
```json
{
  "success": true
}
```

## Programmatic Usage

```typescript
import {
  Auth0ManagementClient,
  ActionsManager,
  TriggersManager
} from '@qwickapps/server-auth0-management';

// Create management client
const client = new Auth0ManagementClient({
  domain: 'your-tenant.auth0.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});

// Create managers
const actionsManager = new ActionsManager(client, config);
const triggersManager = new TriggersManager(client);

// Deploy action
const result = await actionsManager.deployPostLoginAction({
  skipBanCheck: false,
  skipEntitlementsSync: false,
});

// Bind to trigger
if (result.success && result.actionId) {
  await triggersManager.bindToPostLogin(
    result.actionId,
    'QwickApps Post-Login'
  );
}
```

## Development

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build for production
pnpm run build

# Type check
pnpm run type-check
```

## Health Check

The plugin registers a health check named `auth0-management` that verifies:
- Auth0 M2M authentication is working
- Actions API is accessible

## Control Panel Integration

The plugin adds a menu item "Auth0 Actions" (icon: Shield) at path `/auth0/actions` for the control panel UI.

## License

This package is licensed under the [PolyForm Shield License 1.0.0](https://polyformproject.org/licenses/shield/1.0.0/).

- Free to use for non-competitive purposes
- Cannot be used to compete with QwickApps

See [LICENSE](./LICENSE) for full terms.

Copyright (c) 2025 QwickApps. All rights reserved.
