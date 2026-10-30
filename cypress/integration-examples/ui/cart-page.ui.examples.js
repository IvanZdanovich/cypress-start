import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';
import { BUGGY_PRODUCT } from '../../constants/ui/product-catalog.ui.constraints';

const _indicesOfProducts = utils.generateArrayOfRandomIndices(utils.getRandomNumber(1, PRODUCT_COUNT), PRODUCT_COUNT - 1);

export const cartPage__examples = {
  indicesOfProducts: _indicesOfProducts,
  removedProductIndex: utils.getRandomNumber(0, _indicesOfProducts.length),
  buggyProductData: BUGGY_PRODUCT,
};
