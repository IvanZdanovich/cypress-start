import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';
import { BUGGY_PRODUCT } from '../../constants/ui/product-catalog.ui.constraints';

const [_firstAdded, _secondAdded, _notAdded] = utils.generateArrayOfRandomIndices(3, PRODUCT_COUNT - 1);

export const inventoryPage__examples = {
  productIndices: {
    firstAdded: _firstAdded,
    secondAdded: _secondAdded,
    notAdded: _notAdded,
  },
  headerProductIndex: utils.getRandomNumber(0, PRODUCT_COUNT),
  cartBadgeCounts: {
    empty: 0,
    oneProduct: 1,
    twoProducts: 2,
  },
  buggyProductData: BUGGY_PRODUCT,
};
