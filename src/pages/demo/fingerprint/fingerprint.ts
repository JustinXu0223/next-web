// store
import Fingerprint from 'fingerprintjs2';

const getCrossList = () => {
  const platformMap = {
    Win32: [
      'colorDepth',
      'screenResolution',
      'timezoneOffset',
      'navigatorPlatform',
      'touchSupport',
    ],
    Win64: [
      'colorDepth',
      'screenResolution',
      'timezoneOffset',
      'navigatorPlatform',
      'touchSupport',
    ],
    MacIntel: [
      'colorDepth',
      'screenResolution',
      'pixelRatio',
      'timezoneOffset',
      'navigatorPlatform',
      'touchSupport',
    ],
    iPhone: [
      'canvasHash',
      'colorDepth',
      'timezoneOffset',
      'cpuClass',
      'navigatorPlatform',
      'touchSupport',
      'screenResolution',
      'pixelRatio',
      'fontsHash',
      'webglVendorAndRenderer',
    ],
  } as any;
  return platformMap[navigator?.platform] || [];
};

export function getFingerprint(): Promise<string> {
  return Fingerprint.getPromise({})
    .then((components) => {
      const crossList = getCrossList();
      const options = components.reduce((prev, item) => {
        if (crossList.includes(item.key)) {
          prev.push(item.value);
        }
        return prev;
      }, [] as Array<any>);
      return Fingerprint.x64hash128(options.join(''), 31); // 生成指纹信息
    })
    .catch(() => {
      return ''; // 错误返回空string
    });
}
