import { NextPage } from 'next';
import { GetServerSideProps } from 'next';
// utils
import { exposeRequestContext } from '@/utils/request/requestContext';

const SSRDemo: NextPage = () => {
  return <div>ssr demo</div>;
};

export const getServerSideProps: GetServerSideProps = exposeRequestContext(async ({}) => {
  try {
    // TODO 增加api请求
    return {
      props: {
        ssrSuccess: true,
        text: '成功',
      },
    };
  } catch (err) {
    return {
      props: {
        ssrSuccess: false,
        text: '失败',
      },
    };
  }
});

export default SSRDemo;
