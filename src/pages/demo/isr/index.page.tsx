import { NextPage } from 'next';
import { GetStaticProps } from 'next';
// config
import Isr from '@/config/isr';

const ISRDemo: NextPage = () => {
  return <div>isr demo</div>;
};

export const getStaticProps: GetStaticProps = async ({}) => {
  try {
    // TODO 增加api请求
    return {
      props: {
        text: '成功',
      },
      revalidate: Isr.success,
    };
  } catch (err) {
    return {
      props: {
        text: '失败',
      },
      revalidate: Isr.fail,
    };
  }
};

export default ISRDemo;
