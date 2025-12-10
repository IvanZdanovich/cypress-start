const indicesOfProducts = utils.generateArrayOfRandomIndices(utils.getRandomNumber(1, reqs.inventoryPage.numberOfProductsOnThePage), reqs.inventoryPage.numberOfProductsOnThePage - 1);

export const testData = {
  indicesOfProducts: indicesOfProducts,
  randomIndex: utils.getRandomNumber(0, indicesOfProducts.length - 1),
  chosenProducts: [],
  removedProductTitle: String,
  buggyProductData: {
    wrongTitle: 'Test.allTheThings() T-Shirt (Red)',
    correctTitle: 'Sauce Labs T-Shirt (Red)',
    wrongDescription: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
  },
};
