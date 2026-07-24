/**
 * @module InventoryPage — UI Constraints
 * @description Single source of truth for boundary values and domain constants
 *   for the Inventory page (SauceDemo).
 *
 * Import in specs, examples, and commands:
 *   import { PRODUCT_COUNT, SORT_OPTIONS, DEFAULT_SORT } from '../../constants/ui/inventory-page.ui.constraints';
 */

/** Total number of product cards rendered on the Inventory page. */
export const PRODUCT_COUNT = Object.freeze({
  total: 6,
});

/**
 * HTML <select> option values for the sort dropdown.
 * Keys match l10n.inventoryPage.sort.options keys.
 */
export const SORT_OPTIONS = Object.freeze({
  nameAscending: 'az',
  nameDescending: 'za',
  priceAscending: 'lohi',
  priceDescending: 'hilo',
});

/** Default sort option applied when the page first loads. */
export const DEFAULT_SORT = SORT_OPTIONS.nameAscending;

/**
 * Regular expression that matches a valid product price as displayed in the UI.
 * Format: a dollar sign followed by one or more digits, a dot, and exactly two decimal digits.
 * Example matches: "$9.99", "$29.00", "$100.50".
 */
export const PRICE_FORMAT = Object.freeze({
  pattern: /^\$\d+\.\d{2}$/,
});
