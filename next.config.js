const fs = require('fs');
const path = require('path');
// App 内嵌需要特殊离线缓存需要特殊处理-只包括配置的路由
const swRouter = require('./src/config/swRouter');

/** @type {import('next').NextConfig} */
module.exports = require('next-compose-plugins')(
  [
    [
      require('next-plugin-antd-less'),
      {
        // optional
        modifyVars: require('less-vars-to-js')(
          fs.readFileSync(path.resolve(__dirname, `./src/themes/antd-custom.less`), 'utf8'),
        ),
      },
    ],
    [require('next-videos')],
    // 图片处理
    [require('js-next-optimized-images')],
    [
      require('@next/bundle-analyzer')({
        enabled: process.env.ANALYZE === 'true',
      }),
    ],
    [require('next-pwa')],
  ],
  {
    distDir: 'dist',
    reactStrictMode: true,
    pwa: {
      disable: process.env.NODE_ENV !== 'production',
      // 将sw.js workbox.js输出到public目录
      dest: 'public',
      // 在运行时缓存
      runtimeCaching: require('next-pwa/cache'),
      // 每次生成的sw文件不能一样，否则cdn会缓存这个sw文件,造成缓存下载的是旧资源
      // 下载旧资源会造成浪费带宽，下载无用的资源，且缓存了无效的文件。
      sw: `sw${new Date().getTime()}.js`,
      buildExcludes: [
        ({ asset }) => {
          // 只过滤图片，只有图片有来源路径
          if (asset.info.sourceFilename) {
            let swRouterArr = Object.keys(swRouter);
            for (let index = 0; index < swRouterArr.length; index++) {
              const item = swRouterArr[index];
              if (asset.info.sourceFilename.indexOf(item) === 0) {
                // 在配置的路由里面不排除
                return false;
              }
            }
            // 如果循环完成后没有匹配上排除
            return true;
          }
          return false;
        },
      ],
    },
    async rewrites() {
      return [
        // 重写路由
        ...Object.values(require('./src/config/rewritesRouter')).flat(),
      ];
    },
    async headers() {
      return [
        ...[
          // next-videos npm包生成的视频
          '/_next/static/videos/:path*',
          // next-images npm包生成的图像
          '/_next/static/images/:path*',
        ].map((source) => ({
          source,
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=315360000, immutable',
            },
          ],
        })),
      ];
    },
    images: {
      // 图片服务器地址需要先配置，否则获取线上服务器图片会报错
      domains: (process.env.NEXT_PUBLIC_IMAGE_DOMAINS || '').split(/[,\s]+/),
      deviceSizes: [768, 1200, 1440, 1600, 1680, 1920, 2560, 3840],
      imageSizes: [16, 32, 48, 64, 70, 89, 96, 106, 124, 140, 195, 216, 240, 384],
      disableStaticImages: true,
      // 缓存文件放到根目录(会提交到仓库),解决运维会清理掉cache造成打包慢问题（cache的是静态资源，根据buffer生成的唯一hash不会存在问题。）
      cacheFolder: '.cache',
    },
    // https://nextjs.org/docs/api-reference/next.config.js/custom-page-extensions
    pageExtensions: ['page.tsx', 'page.ts'],
    sassOptions: {
      additionalData: fs.readFileSync(
        // 主题文件<区分平台>
        path.resolve(__dirname, `./src/themes/custom.scss`),
        'utf8',
      ),
    },
    // 自定义webpack
    webpack: (config, { isServer }) => {
      if (!isServer) {
        // 删除nextjs的默认cacheGroups, 使用webpack的规则(nextjs cacheGroups规则在代码拆分后antd等组件没有拆分)
        delete config.optimization.splitChunks.cacheGroups;
      }

      // Important: return the modified config
      return config;
    },
  },
);
