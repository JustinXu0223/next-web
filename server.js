const dev = process.env.NODE_ENV !== 'production';
const { renderJSONRouter, renderAndCache } = require('./lru-cache');

const next = require('next');
const app = next({
  dev,
});
app.prepare().then(() => {
  const express = require('express');
  const server = express();

  // next js内置请求处理器
  const handle = app.getRequestHandler();

  // 服务器缓存
  server.get(renderJSONRouter(), async (req, res) => {
    await renderAndCache(app, req, res, req.url.split('?')[0], { ...req.query });
  });

  // 远程图片资源域名解析
  server.get('/optimize/image/*', (req, res, next) => {
    const url = decodeURIComponent(req.url);
    const urlReg = /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/;
    const domain = urlReg.exec(url);
    if (domain) {
      const imgDomains = app.server.nextConfig.images.domains;

      if (!imgDomains.includes(domain[0])) {
        app.server.nextConfig.images.domains.push(domain[0]);
      }
    }
    next();
  });

  // https://levelup.gitconnected.com/set-up-next-js-with-a-custom-express-server-typescript-9096d819da1c
  server.all('*', require('./image-optimizer.rewrite').compose(handle));

  const port = parseInt(process.env.PORT, 10) || 3000;
  server.listen(port, (err) => {
    if (err) throw err;

    const url = `http://localhost:${port}`;
    console.log(`Listening on HTTPS url: ${url}`);

    if (dev) {
      require('open')(url);
    }
  });
});
