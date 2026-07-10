import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';
import { ANIMATION } from '../../constants/ui/common.ui.constraints';

export const headerComp__examples = {
  randomProductIndices: utils.generateArrayOfRandomIndices(utils.getRandomNumber(1, PRODUCT_COUNT.total), PRODUCT_COUNT.total - 1),
  sidebarAnimationThreshold: ANIMATION.sidebarThreshold,
};
