module.exports = {
  ...require('gts/.prettierrc.json'),
  importOrder: ['<THIRD_PARTY_MODULES>', 'suggester', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
