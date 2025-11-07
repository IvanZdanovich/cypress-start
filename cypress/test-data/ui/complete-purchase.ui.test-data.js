export const testData = {
  indicesOfProducts: utils.generateArrayOfRandomIndices(utils.getRandomNumber(2, reqs.inventoryPage.numberOfProductsOnThePage), reqs.inventoryPage.numberOfProductsOnThePage - 1),
  chosenProducts: [],
  deliveryInfo: {
    firstName: utils.generateRandomString(utils.getRandomNumber(5, 15)),
    lastName: utils.generateRandomString(utils.getRandomNumber(5, 15)),
    zip: utils.generateRandomString(5, '0123456789'),
  },
  knownBugs: {
    incorrectProductTitle: 'Test.allTheThings() T-Shirt (Red)',
    correctProductTitle: 'Sauce Labs T-Shirt (Red)',
    incorrectProductDescription: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
  },
};
