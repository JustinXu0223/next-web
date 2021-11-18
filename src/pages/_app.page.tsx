import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';
// 重置样式
require('@/config/rest.scss');
// 字体
require('@/config/font.css');
// mobx
import { enableStaticRendering } from 'mobx-react';
// 生产环境禁止调试
import { disableReactDevTools, disableDebugger } from '@/utils/debug';
import { isBrowser } from '@/utils/detect';
if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_ENV === 'prod' &&
  isBrowser()
) {
  disableReactDevTools();
  disableDebugger();
}
// https://github.com/mobxjs/mobx-react
enableStaticRendering(!isBrowser());

function App({ Component, pageProps }: AppProps) {
  return (
    <React.Fragment>
      <Head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <meta httpEquiv='Content-Language' content='zh-CN' />
        <meta httpEquiv='X-UA-Compatible' content='IE=edge,chrome=1' />
        <title>My App</title>
        <link rel='icon' href='/favicon.ico' />

        {/* 慎用预加载- 如果使用不当，预加载可能会对未使用的资源发出不必要的请求，从而损害性能。这两个字体是全局使用需要优先加载 */}
        {/* 现在的字体放在静态资源下面(正常情况不会修改)， 如果有修改的情况可以 配置<%= timestamp %>做版本管控 */}
        <link
          rel='preload'
          href='/font/DINPro.ttf'
          as='font'
          type='font/ttf'
          crossOrigin='anonymous'
        />
        <link
          rel='preload'
          href='/font/din.woff'
          as='font'
          type='font/woff'
          crossOrigin='anonymous'
        />
      </Head>
      <Script
        strategy='beforeInteractive'
        crossOrigin='anonymous'
        src='https://polyfill.io/v3/polyfill.min.js?flags=gated&features=default%2Ces2015%2Ces2016%2Ces2017%2Ces2018%2Ces2019%2Ces5%2Ces6%2Ces7%2Csmoothscroll%2CResizeObserver%2CAbortController%2CIntersectionObserver'
      />
      <Component {...pageProps} />
    </React.Fragment>
  );
}

export default App;
