/**
 * NextJS 内置图像处理服务url静态化
 * 目的简述：
 * 原版动态url例子 /_next/image?w=100&q=75&url=%2F_next%2Fstatic%2Fimage%2Fa.png
 * 静态化过程是通过url rewrite特性重新定义了一个静态url，方便传统cdn缓存图像
 * 静态化后例子 /optimize/image/w=100&q=75/%2F_next%2Fstatic%2Fimage%2Fa.png
 */

const { pathToRegexp, match, MatchResult } = require('path-to-regexp');

const sourceUrlPattern = '/optimize/image/:param/:url';
const sourceUrlPatternRegexp = pathToRegexp(sourceUrlPattern);
const sourceUrlMatcher = match(sourceUrlPattern, { decode: decodeURIComponent });

function sourceTest(url) {
  return sourceUrlPatternRegexp.test(url);
}

/**
 *
 * @param url
 * @returns {import('url').UrlWithParsedQuery | undefined}
 */
function parsedDestinationUrl(url) {
  /**
   * @type {false | MatchResult<{ param: string, url: string}>}
   */
  const matchResult = sourceUrlMatcher(url);

  if (matchResult) {
    const optimizeSearchParams = new URLSearchParams(matchResult.params.param);
    optimizeSearchParams.set('url', matchResult.params.url);
    const { parse } = require('url');
    return parse('/_next/image?' + optimizeSearchParams.toString(), true);
  }
}

const _removeWebpMimeTypeRegexp = /image\/webp,?/i;
/**
 * 通过修改请求头信息accept禁用NextJS图像处理服务转换webp功能
 * @param req {import('http').IncomingMessage}
 */
function disableWebp(req) {
  // accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8
  req.headers['accept'] = (req.headers['accept'] || '').replace(_removeWebpMimeTypeRegexp, '');
}

/**
 * @param req {import('http').IncomingMessage}
 */
function shouldBeGetReq(req) {
  return req.method === 'GET';
}

/**
 * @param handler {(req: import('http').IncomingMessage, res: import('http').ServerResponse, parsedUrl?: UrlWithParsedQuery | undefined) => Promise<any>}
 * @returns {(req: import('http').IncomingMessage, res: ServerResponse, parsedUrl?: UrlWithParsedQuery | undefined) => Promise<any>}
 */
exports.compose = (handler) => (req, res) => {
  if (shouldBeGetReq(req) && sourceTest(req.url)) {
    disableWebp(req);
    return handler(req, res, parsedDestinationUrl(req.url));
  }
  return handler(req, res);
};
