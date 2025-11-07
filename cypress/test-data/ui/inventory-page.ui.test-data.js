export const testData = {
  indicesOfProducts: utils.generateArrayOfRandomIndices(3, reqs.inventoryPage.numberOfProductsOnThePage - 1),
  chosenProducts: [],
  cartBadgeCounts: {
    empty: 0,
    oneProduct: 1,
    twoProducts: 2,
  },
  buggyProductData: {
    wrongTitle: 'Test.allTheThings() T-Shirt (Red)',
    wrongDescription: 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
  },
};
