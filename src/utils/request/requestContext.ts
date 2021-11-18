import { GetServerSidePropsContext } from 'next';

export interface RequestContext extends GetServerSidePropsContext {}

export let requestContext: RequestContext;

/**
 * 当使用SSR场景渲染页面时，暴露serverSidePropsContext
 * 可以协助请求库从cookie中读取token
 * @example
 * import { GetServerSideProps } from 'next';
 * export const getServerSideProps: GetServerSideProps = exposeRequestContext(
 *  async (context) => {
 *     console.log(context.req.cookies);
 *     return {
 *       props: {},
 *     };
 *   },
 * );
 */
export function exposeRequestContext<T>(handler: T): T {
  // @ts-ignore
  return (...args) => {
    requestContext = args[0];
    // @ts-ignore
    return handler(...args);
  };
}
