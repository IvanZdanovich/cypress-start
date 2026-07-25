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

/** Number of decimal places used when rounding/displaying currency prices. */
export const PRICE_DECIMAL_PLACES = 2;

/** Animation thresholds used in Cypress click options. */
export const ANIMATION = Object.freeze({
  /** Pixel distance below which Cypress treats an element as not animating (sidebar open button). */
  sidebarThreshold: 30,
});
