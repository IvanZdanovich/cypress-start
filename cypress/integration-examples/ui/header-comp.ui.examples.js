const getRandomProductIndices = () => {
  const numberOfProducts = utils.getRandomNumber(1, reqs.inventoryPage.numberOfProductsOnThePage);
  return utils.generateArrayOfRandomIndices(numberOfProducts, reqs.inventoryPage.numberOfProductsOnThePage - 1);
};

export const examples = {
  randomProductIndices: getRandomProductIndices(),
  sidebarAnimationThreshold: 30,
};
