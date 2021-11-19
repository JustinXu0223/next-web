/**
 * glob syntax https://github.com/isaacs/node-glob#glob-primer
 */
module.exports = {
  '*.ts*(x)': [
    () => `yarn lint`,
    (filenames) => `prettier --write ${filenames.join(' ')}`
  ],
  // 'src/**/*.*(p|s|l)+(c|a|e)ss': (filenames) => `stylelint --fix ${filenames.join(' ')}`,
};
