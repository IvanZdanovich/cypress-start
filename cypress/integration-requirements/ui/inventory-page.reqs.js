/**
 * @module InventoryPage
 * @description Requirements for the Inventory Page UI component.
 *   Single source of truth for every verifiable rule on the Inventory Page.
 *   Import in test data and spec files — no build step, always in sync.
 *
 * @owner QA Team
 * @reviewed 2026-04-16
 * @prefix IP
 *
 * @example
 *   import ip from '../../support/requirements/inventory-page.reqs';
 *
 *   ip.productCount.limit                    // 6
 *   ip.productCount.id                       // 'REQ-IP-001'
 *   ip.defaultSort.defaultValue              // 'az'
 *   ip.sortOptions.options.nameDescending    // 'za'
 */

import { PRIORITY } from '../api/shared-api.reqs.js';

// ─── Module-level constants ───────────────────────────────────────────────────

const COMPONENT = 'InventoryPage';

const PRODUCT_COUNT = 6;

const SORT_OPTIONS = {
  nameAscending: 'az',
  nameDescending: 'za',
  priceAscending: 'lohi',
  priceDescending: 'hilo',
};

const DEFAULT_SORT = SORT_OPTIONS.nameAscending;

// ─── Product display ──────────────────────────────────────────────────────────

const productCount = {
  id: 'REQ-IP-001',
  rule: `Inventory page displays exactly ${PRODUCT_COUNT} product cards.`,
  priority: PRIORITY.P1,
  component: COMPONENT,
  limit: PRODUCT_COUNT,
};

// ─── Sorting ──────────────────────────────────────────────────────────────────

const defaultSort = {
  id: 'REQ-IP-010',
  rule: `Default sort option is "${DEFAULT_SORT}" (Name A-Z) on page load.`,
  priority: PRIORITY.P1,
  component: COMPONENT,
  defaultValue: DEFAULT_SORT,
};

const sortOptions = {
  id: 'REQ-IP-011',
  rule: 'Sorting dropdown provides four options: Name (A-Z), Name (Z-A), Price (low-high), Price (high-low).',
  priority: PRIORITY.P1,
  component: COMPONENT,
  options: SORT_OPTIONS,
};

// ─── Export ───────────────────────────────────────────────────────────────────

export default {
  productCount,
  defaultSort,
  sortOptions,
};

