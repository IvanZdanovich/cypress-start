import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';

export const headerComp__examples = {
  get randomProductIndices() {
    const numberOfProducts = utils.getRandomNumber(1, PRODUCT_COUNT.total);
    return utils.generateArrayOfRandomIndices(numberOfProducts, PRODUCT_COUNT.total - 1);
  },
  sidebarAnimationThreshold: 30,
};