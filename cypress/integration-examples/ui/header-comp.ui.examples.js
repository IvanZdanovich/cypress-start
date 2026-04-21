import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';

const getRandomProductIndices = () => {
  const numberOfProducts = utils.getRandomNumber(1, PRODUCT_COUNT.limit);
  return utils.generateArrayOfRandomIndices(numberOfProducts, PRODUCT_COUNT.limit - 1);
};

export const headerComp__examples = {
  randomProductIndices: getRandomProductIndices(),
  sidebarAnimationThreshold: 30,
};
