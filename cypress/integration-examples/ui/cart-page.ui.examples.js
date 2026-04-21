import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';

const indicesOfProducts = utils.generateArrayOfRandomIndices(utils.getRandomNumber(1, PRODUCT_COUNT.limit + 1), PRODUCT_COUNT.limit - 1);

export const cartPage__examples = {
  indicesOfProducts: indicesOfProducts,
  randomIndex: utils.getRandomNumber(0, indicesOfProducts.length),
  chosenProducts: [],
  removedProductTitle: String,
  buggyProductData: {
    wrongTitle: 'Test.allTheThings() T-Shirt (Red)',
    correctTitle: 'Sauce Labs T-Shirt (Red)',
    wrongDescription: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
  },
};
