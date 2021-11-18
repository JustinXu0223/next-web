const NEXT_PUBLIC_IMAGE_DOMAINS_LIST = [
  'avatars.githubusercontent.com', //
];

// 环境列表
const ENV_LIST = [
  'dev', // 测试环境
  'release', // 预发环境
  'prod', // 生产环境
];

module.exports = ENV_LIST.reduce(
  (prev, curr) => {
    // 开发环境
    prev[`server:${curr}`] = Object.assign({
      NEXT_PUBLIC_ENV: curr,
      NEXT_PUBLIC_IMAGE_DOMAINS: NEXT_PUBLIC_IMAGE_DOMAINS_LIST.join(),
    });

    // 构建环境
    prev[`build:${curr}`] = Object.assign({
      NEXT_PUBLIC_ENV: curr,
      NEXT_PUBLIC_IMAGE_DOMAINS: NEXT_PUBLIC_IMAGE_DOMAINS_LIST.join(),
    });

    // 服务器启动
    prev[`start:${curr}`] = Object.assign({
      NEXT_PUBLIC_ENV: curr,
      NEXT_PUBLIC_IMAGE_DOMAINS: NEXT_PUBLIC_IMAGE_DOMAINS_LIST.join(),
    });

    // 返回数据
    return prev;
  },
  {
    // 打包分析
    analyze: {
      ANALYZE: true,
    },
  },
);
