const inventoryPage = {
  numberOfProductsOnThePage: 6,
  defaultSortOption: 'az',
  sortOptions: {
    nameAscending: 'az',
    nameDescending: 'za',
    priceAscending: 'lohi',
    priceDescending: 'hilo',
  },
};

const text = {
  allowedSymbols: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
};

export default {
  inventoryPage,
  text,
};
