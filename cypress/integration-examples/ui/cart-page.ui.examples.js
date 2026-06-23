import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';

const _indicesOfProducts = utils.generateArrayOfRandomIndices(utils.getRandomNumber(1, PRODUCT_COUNT.total), PRODUCT_COUNT.total - 1);

export const cartPage__examples = {
  indicesOfProducts: _indicesOfProducts,
  randomIndex: utils.getRandomNumber(0, _indicesOfProducts.length - 1),
  chosenProducts: [],
  removedProductTitle: String,
  buggyProductData: {
    wrongTitle: 'Test.allTheThings() T-Shirt (Red)',
    correctTitle: 'Sauce Labs T-Shirt (Red)',
    wrongDescription: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
  },
};