import { NextPage } from 'next';
import { GetStaticProps } from 'next';
// mobx
import { compose } from '@/utils/redux';
import { observer } from 'mobx-react';
import countStore from './index.store';
// components
import { Button } from 'antd';

const MobxDemo: NextPage = () => {
  return (
    <div>
      mobx demo
      <hr />
      count: {countStore.count}
      <hr />
      <Button onClick={() => countStore.setCount(countStore.count - 1)}>减少</Button>
      &nbsp;&nbsp;
      <Button type={'primary'} onClick={() => countStore.setCount(countStore.count + 1)}>
        增加
      </Button>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({}) => {
  return {
    props: {},
  };
};

export default compose(
  observer, //
)(MobxDemo);
