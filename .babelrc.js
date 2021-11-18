module.exports = {
  presets: ['next/babel'],
  plugins: [
    [
      'import',
      {
        libraryName: 'antd',
        style: true, // `style: true` 会加载 less 文件
      },
    ],
    [
      'import',
      {
        libraryName: '@ant-design/icons',
        libraryDirectory: 'lib/icons',
        camel2DashComponentName: false,
      },
      '@ant-design/icons',
    ],
  ],
};
