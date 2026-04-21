/**
 * @module SharedUI — Requirements
 * @description Shared UI constraints reused across multiple pages and utilities.
 *
 * Import in utils or specs:
 *   import { TEXT } from '../../integration-requirements/ui/shared-ui.reqs';
 */

/** Character sets allowed in UI text input fields. */
export const TEXT = {
  /** Printable ASCII characters accepted by standard text inputs (letters, digits, space). */
  allowedSymbols: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
};
