import { NextPage } from 'next';
import { GetStaticProps } from 'next';

const SSGDemo: NextPage = () => {
  return <div>ssg demo</div>;
};

export const getStaticProps: GetStaticProps = async ({}) => {
  return {
    props: {},
  };
};

export default SSGDemo;
