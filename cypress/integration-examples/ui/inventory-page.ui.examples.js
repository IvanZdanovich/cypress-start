import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';

export const inventoryPage__examples = {
  indicesOfProducts: utils.generateArrayOfRandomIndices(3, PRODUCT_COUNT.total - 1),
  chosenProducts: [],
  cartBadgeCounts: {
    empty: 0,
    oneProduct: 1,
    twoProducts: 2,
  },
  buggyProductData: {
    wrongTitle: 'Test.allTheThings() T-Shirt (Red)',
    wrongDescription: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
  },
};
