import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';
import { BUGGY_PRODUCT } from '../../constants/ui/product-catalog.ui.constants';

const _indicesOfProducts = utils.generateArrayOfRandomIndices(utils.getRandomNumber(1, PRODUCT_COUNT.total), PRODUCT_COUNT.total - 1);

export const cartPage__examples = {
  indicesOfProducts: _indicesOfProducts,
  randomIndex: utils.getRandomNumber(0, _indicesOfProducts.length - 1),
  chosenProducts: [],
  removedProductTitle: undefined,
  buggyProductData: BUGGY_PRODUCT,
};
