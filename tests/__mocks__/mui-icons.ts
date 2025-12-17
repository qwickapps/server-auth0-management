/**
 * Mock MUI Icons
 *
 * Prevents EMFILE errors by providing lightweight mock icons.
 */

import { createElement } from 'react';

// Create a simple mock icon component
const createMockIcon = (name: string) => {
  const MockIcon = () => createElement('svg', { 'data-testid': `${name}Icon` });
  MockIcon.displayName = name;
  return MockIcon;
};

// Export all icons used in the UI components
export const CheckCircle = createMockIcon('CheckCircle');
export const CloudUpload = createMockIcon('CloudUpload');
export const CloudOff = createMockIcon('CloudOff');
export const Download = createMockIcon('Download');
export const ArrowUpward = createMockIcon('ArrowUpward');
export const ArrowDownward = createMockIcon('ArrowDownward');
export const LinkOff = createMockIcon('LinkOff');
export const Error = createMockIcon('Error');
export const Refresh = createMockIcon('Refresh');
export const Security = createMockIcon('Security');

// Default export (for `import XIcon from '@mui/icons-material/X'`)
export default createMockIcon('Default');
