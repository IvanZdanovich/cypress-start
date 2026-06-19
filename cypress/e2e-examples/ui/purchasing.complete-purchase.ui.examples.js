import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';

export const completePurchase__examples = {
  indicesOfProducts: utils.generateArrayOfRandomIndices(utils.getRandomNumber(2, PRODUCT_COUNT.total), PRODUCT_COUNT.total - 1),
  chosenProducts: [],
  deliveryInfo: {
    firstName: utils.generateRandomString(utils.getRandomNumber(5, 15)),
    lastName: utils.generateRandomString(utils.getRandomNumber(5, 15)),
    zip: utils.generateRandomString(5, '0123456789'),
  },
  buggyProductData: {
    wrongTitle: 'Test.allTheThings() T-Shirt (Red)',
    correctTitle: 'Sauce Labs T-Shirt (Red)',
    wrongDescription: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
  },
};
