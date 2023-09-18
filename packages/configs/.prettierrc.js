module.exports = {
  ...require('gts/.prettierrc.json'),
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: [
    '^node:',
    '<THIRD_PARTY_MODULES>',
    '^@suggester/',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}
