import type { NextPage } from 'next';
import Link from 'next/link';
// components
import { Button } from 'antd';

const Home: NextPage = () => {
  return (
    <div>
      首页
      <hr />
      <Link href={'/demo/img'}>
        <Button type={'primary'}>IMG demo 真实路由</Button>
      </Link>
      &nbsp;&nbsp;
      <Link href={'/demo/img1'}>
        <Button type={'link'}>IMG demo1 真实路由</Button>
      </Link>
      <hr />
      <Link href={'/demo/ssr'}>
        <Button type={'primary'}>SSR demo 真实路由</Button>
      </Link>
      &nbsp;&nbsp;
      <Link href={'/demo/ssr1'}>
        <Button type={'link'}>SSR demo1 反转路由</Button>
      </Link>
      <hr />
      <Link href={'/demo/isr'}>
        <Button type={'link'}>ISR demo 真实路由</Button>
      </Link>
      <hr />
      <Link href={'/demo/ssg'}>
        <Button type={'link'}>SSG demo 真实路由</Button>
      </Link>
      <hr />
    </div>
  );
};

export default Home;
