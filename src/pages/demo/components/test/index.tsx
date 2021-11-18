import React from 'react';
// components
import Image from '@/components/image';
// styles
import styles from './index.module.scss';

const Test = () => {
  return (
    <div>
      test
      <br />
      <img width={300} src={require('./img/4-20092Q55R1.jpeg')} alt='icon' />
      <div className={styles.demoText} />
      <br />
      <div className={styles.demo1Text} />
      <Image
        src={'https://avatars.githubusercontent.com/u/26669907'}
        width={200}
        height={200}
        priority
        alt='icon'
      />
    </div>
  );
};

export default Test;
