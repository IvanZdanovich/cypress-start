/**
 * @module ProductCatalog — UI Constants
 * @description Known product data defects in the SauceDemo product catalog.
 *   Single source of truth for buggy product values referenced across
 *   inventory, cart, and e2e specs.
 *
 * Import in examples:
 *   import { BUGGY_PRODUCT } from '../../constants/ui/product-catalog.ui.constants';
 */

/** Known data defects for the T-Shirt (Red) product. Refs: BUG-INVENTORY-001, BUG-INVENTORY-002. */
export const BUGGY_PRODUCT = Object.freeze({
  wrongTitle: 'Test.allTheThings() T-Shirt (Red)',
  correctTitle: 'Sauce Labs T-Shirt (Red)',
  wrongDescription: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
});

