import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';
import { BUGGY_PRODUCT } from '../../constants/ui/product-catalog.ui.constants';

export const inventoryPage__examples = {
  indicesOfProducts: utils.generateArrayOfRandomIndices(3, PRODUCT_COUNT.total - 1),
  chosenProducts: [],
  cartBadgeCounts: {
    empty: 0,
    oneProduct: 1,
    twoProducts: 2,
  },
  buggyProductData: BUGGY_PRODUCT,
};
