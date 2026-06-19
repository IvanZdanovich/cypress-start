import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';

export const cartPage__examples = {
  get indicesOfProducts() {
    return utils.generateArrayOfRandomIndices(utils.getRandomNumber(1, PRODUCT_COUNT.total + 1), PRODUCT_COUNT.total - 1);
  },
  get randomIndex() {
    return utils.getRandomNumber(0, this.indicesOfProducts.length);
  },
  chosenProducts: [],
  removedProductTitle: String,
  buggyProductData: {
    wrongTitle: 'Test.allTheThings() T-Shirt (Red)',
    correctTitle: 'Sauce Labs T-Shirt (Red)',
    wrongDescription: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
  },
};