const indicesOfProducts = utils.generateArrayOfRandomIndices(utils.getRandomNumber(1, reqs.inventoryPage.numberOfProductsOnThePage), reqs.inventoryPage.numberOfProductsOnThePage - 1);

export const test_data = {
  indicesOfProducts: indicesOfProducts,
  randomIndex: utils.getRandomNumber(0, indicesOfProducts.length - 1),
  chosenProducts: [],
};
