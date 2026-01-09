# @qwickapps/server-auth0-management

## [1.0.0] - 2024-12-24

### Added

- Initial release of Auth0 Management plugin for qwickapps-server
- Auth0 Management API client
  - M2M authentication with token caching
  - Actions API integration (create, update, delete, deploy)
  - Triggers API integration (bind, unbind, reorder)
  - Automatic token refresh on expiration
- ActionsManager
  - Programmatic deployment of post-login actions
  - Bundle @qwickapps/auth0-actions code at runtime
  - Configure action secrets dynamically
  - Deploy/undeploy operations
- TriggersManager
  - Bind actions to post-login trigger
  - Unbind actions from triggers
  - List current bindings
  - Reorder action execution sequence
- Server plugin integration
  - REST API endpoints for action management
  - Health check registration
  - Control panel menu integration (Shield icon)
  - Configuration validation on startup
- REST API endpoints
  - `GET /api/auth0/actions` - List deployed actions
  - `POST /api/auth0/actions/deploy` - Deploy post-login action
  - `DELETE /api/auth0/actions/:actionId` - Undeploy action
  - `GET /api/auth0/triggers/post-login` - List bindings
  - `POST /api/auth0/triggers/post-login/bind` - Bind action
  - `DELETE /api/auth0/triggers/post-login/:actionId` - Unbind action
  - `PUT /api/auth0/triggers/post-login/reorder` - Reorder bindings
  - `GET /api/auth0/bundle/post-login` - Get bundle info
  - `GET /api/auth0/bundle/post-login/download` - Download JS bundle
  - `GET /api/auth0/config` - Get configuration (secrets masked)
  - `POST /api/auth0/config/test` - Test Auth0 connection
- Control panel UI components
  - Auth0 Actions management page
  - Deploy/undeploy interface
  - Trigger binding management
  - Bundle download functionality
  - Connection testing
- Comprehensive unit tests with vitest
- Full TypeScript support

### Configuration

Required Auth0 M2M application permissions:
- `read:actions`
- `create:actions`
- `update:actions`
- `delete:actions`
- `read:triggers`
- `update:triggers`

### Technical Notes

- Requires Node.js >= 18.0.0
- Peer dependency: @qwickapps/server ^1.0.0
- Depends on @qwickapps/auth0-management-client (workspace)
- Licensed under PolyForm Shield License 1.0.0
