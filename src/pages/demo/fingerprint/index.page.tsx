import React, { useEffect, useState } from 'react';
// utils
import { getFingerprint } from './fingerprint';

const Demo = () => {
  const [uuid, setUuid] = useState('');

  useEffect(() => {
    getFingerprint().then((uid) => {
      setUuid(uid);
    });
  }, []);

  return (
    <div style={{ fontSize: '14px' }}>
      demo page
      <hr />
      uuid: {uuid}
    </div>
  );
};

export default Demo;
