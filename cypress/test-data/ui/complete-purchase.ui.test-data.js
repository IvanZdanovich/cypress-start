export const test_data = {
  indicesOfProducts: utils.generateArrayOfRandomIndices(utils.getRandomNumber(1, reqs.inventoryPage.numberOfProductsOnThePage), reqs.inventoryPage.numberOfProductsOnThePage - 1),
  chosenProducts: [],
  user: {
    firstName: 'John',
    lastName: 'Doe',
    zip: '12345',
  },
};
