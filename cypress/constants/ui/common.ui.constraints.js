/**
 * @module Common — UI Constraints
 * @description Shared UI constraints reused across multiple pages and features.
 *
 * Import in utils or specs:
 *   import { TEXT } from '../../constants/ui/common.ui.constraints';
 */

/** Character sets allowed in UI text input fields. */
export const TEXT = Object.freeze({
  /** Printable ASCII characters accepted by standard text inputs (letters, digits, space). */
  allowedSymbols: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
});
