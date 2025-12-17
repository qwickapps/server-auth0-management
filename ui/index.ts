/**
 * Auth0 Management UI Components
 *
 * Export UI components for the Auth0 Management plugin.
 *
 * Usage:
 * ```tsx
 * import {
 *   Auth0ActionsPage,
 *   Auth0StatusWidget,
 *   getAuth0WidgetComponents,
 * } from '@qwickapps/server-auth0-management/ui';
 *
 * // In ControlPanelApp:
 * <ControlPanelApp
 *   widgetComponents={[
 *     ...getBuiltInWidgetComponents(),
 *     ...getAuth0WidgetComponents(),
 *   ]}
 * >
 *   <Route path="/auth0/actions" element={<Auth0ActionsPage />} />
 * </ControlPanelApp>
 * ```
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

// API client
export { auth0Api, Auth0ApiError } from './api/auth0Api';

// Types
export type {
  Auth0Config,
  TestConnectionResult,
  Auth0Action,
  ActionsResponse,
  DeployOptions,
  DeployResult,
  UndeployResult,
  TriggerBinding,
  TriggerBindingsResponse,
  BindResult,
  UnbindResult,
  ReorderResult,
  Auth0Status,
} from './types';

// Page components
export { Auth0ActionsPage } from './pages/Auth0ActionsPage';

// Widget components
// Note: Using import + re-export pattern instead of direct re-export to work around
// TypeScript/bundler issues where re-exported components may lose their reference
// when used in getAuth0WidgetComponents() below.
import { Auth0StatusWidget as Auth0StatusWidgetComponent } from './widgets/Auth0StatusWidget';
export { Auth0StatusWidgetComponent as Auth0StatusWidget };

// Sub-components (for advanced customization)
export { ConnectionStatus, type ConnectionStatusProps } from './components/ConnectionStatus';
export { ActionsList, type ActionsListProps } from './components/ActionsList';
export { TriggerBindings, type TriggerBindingsProps } from './components/TriggerBindings';

/**
 * Widget component definition for registry
 */
export interface WidgetComponent {
  name: string;
  component: React.ComponentType;
}

/**
 * Get Auth0 widget components for registration with WidgetComponentRegistry
 *
 * Usage:
 * ```tsx
 * import { getAuth0WidgetComponents } from '@qwickapps/server-auth0-management/ui';
 *
 * <WidgetComponentRegistryProvider
 *   initialComponents={[
 *     ...getBuiltInWidgetComponents(),
 *     ...getAuth0WidgetComponents(),
 *   ]}
 * >
 * ```
 */
export function getAuth0WidgetComponents(): WidgetComponent[] {
  return [
    {
      name: 'Auth0StatusWidget',
      component: Auth0StatusWidgetComponent,
    },
  ];
}
