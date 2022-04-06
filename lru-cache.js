const LRUCache = require('lru-cache');
// ssr 场景的html缓存时间
const ssrCache = new LRUCache({
  max: 100000, // 三分钟内同时最大条数设置1万条
  maxAge: 50 * 60 * 60, // 3 分钟 180000
});

// ---------------------需要缓存的路由 配置在这里----------------------------
// ---------------------****特别注意点**** 当前路由缓存只能配置给SSR场景的路由使用，SSG的路由不用配置----------------------------
const cacheRoute = [
  '/demo/ssr',
  '/demo/ssr1', //
];
// ---------------------需要缓存的路由 配置在这里 end ----------------------------

// cachek 由url加cookie生成(url里面已经自带参数，不用考虑不同参数路由的场景)
const getCacheKey = (req) => `${req.url}/${getCookieValue('X-API-TOKEN', req)}`;

// 获取cookie下的某个值
// 如果拿整个cookie 会造成如果三分钟内有修改cookie 造成key匹配不上会重复缓存。
function getCookieValue(key, req) {
  var result = new RegExp(`${key}=([^;]*)`).exec(req.headers.cookie);
  return result ? result[1] : ``;
}

// 处理路由-这个是nextjs 原生代码的处理规则-需要保持一致,否则会造成路由匹配不上造成无法缓存。
// 扩展 stt 截取路由前部分
function getRouteFromAssetPath(assetPath, stt = '', ext = '') {
  assetPath = assetPath.replace(/\\/g, '/');
  assetPath =
    stt && assetPath.startsWith(stt) ? assetPath.slice(stt.length, assetPath.length) : assetPath;
  assetPath = ext && assetPath.endsWith(ext) ? assetPath.slice(0, -ext.length) : assetPath;
  if (assetPath.startsWith('/index/')) {
    assetPath = assetPath.slice(6);
  } else if (assetPath === '/index') {
    assetPath = '/';
  }
  return assetPath;
}
// 获取 rewrites路由
function getTrulyRouter(app, assetPath, source = 'source') {
  if (!app) {
    return assetPath;
  }
  const rewrites = app.server.router.rewrites.afterFiles || [];
  for (const item of rewrites) {
    if (item && item[source] && item[source] === assetPath) {
      return source === 'source' ? item.destination : item.source;
    }
  }
  return assetPath;
}

module.exports = {
  renderJSONRouter: () => {
    return cacheRoute.concat(
      cacheRoute.map((key) => {
        // 需要多构建一条json路径，解决nextjs 第二次访问只请求了json文件问题。
        return `/_next/data/:path*${key}.json`;
      }),
    );
  },
  renderAndCache: async (app, req, res, pagePath, queryParams) => {
    const key = getCacheKey(req);
    if (ssrCache.has(key) && ssrCache.get(key)) {
      res.setHeader('x-cache', ssrCache.get(key) ? 'HIT' : 'MISS');
      // 发送缓存的json或者html
      res.send(ssrCache.get(key));
      return;
    }

    try {
      let content = null;
      if (pagePath.endsWith('.json')) {
        // 如果是json走 只触发服务端ssr 不构建html(走json说明html已经构建)
        const pathname = getRouteFromAssetPath(
          pagePath,
          `/_next/data/${app.server.buildId}`,
          '.json',
        );
        // 如果当前路由不是真实的路由,需要获取到真实路由
        content = await app.renderToHTML(req, res, getTrulyRouter(app, pathname), {
          ...queryParams,
          _nextDataReq: '1',
        });
      } else {
        // 如果当前路由不是真实的路由,需要获取到真实路由
        const pathname = getTrulyRouter(app, pagePath);
        content = await app.renderToHTML(req, res, pathname, queryParams);
        const matchProps = content.match(
          /application\/json">{"props":([\s\S]*),"__N_SSP":true|false},"page":"/,
        );
        // 缓存json数据
        const pageProps =
          matchProps && Array.isArray(matchProps) && matchProps.length > 1
            ? `${matchProps[1]},"__N_SSP":${JSON.parse(
                content.match(/"__N_SSP":([\s\S]*)},"page":"/)[1],
              )}}`
            : JSON.stringify({ pageProps: {}, __N_SSG: true });

        if (res.statusCode === 200) {
          // 模拟一个json格式的hash 构建两个key,一个真实的，一个虚拟的。
          const propsKey1 = `/_next/data/${app.server.buildId}${
            pathname !== pagePath ? pathname : pagePath
          }.json/${getCookieValue('X-API-TOKEN', req)}`;

          const propsKey2 = `/_next/data/${app.server.buildId}${
            pathname === pagePath ? getTrulyRouter(app, pagePath, 'destination') : pagePath
          }.json/${getCookieValue('X-API-TOKEN', req)}`;

          ssrCache.set(propsKey2, pageProps);
          ssrCache.set(propsKey1, pageProps);
        }
      }

      if (res.statusCode !== 200) {
        res.send(content);
        return;
      }

      // Let's cache this page
      ssrCache.set(key, content);

      res.setHeader('x-cache', 'MISS');
      res.send(content);
    } catch (err) {
      // 如果失败重新构建整个dom
      app.renderError(err, req, res, pagePath, queryParams);
    }
  },
};
