import { ImageConfig, imageConfigDefault, LoaderValue, VALID_LOADERS } from '@/config/image-config';

import {
  DefaultImageLoaderProps,
  GenImgAttrsData,
  GenImgAttrsResult,
  ImageLoaderProps,
  LayoutValue,
  OnLoadingComplete,
  PlaceholderValue,
  StaticImageData,
  StaticImport,
  StaticRequire,
} from './index.interface';

const {
  deviceSizes: configDeviceSizes,
  imageSizes: configImageSizes,
  loader: configLoader,
  path: configPath,
  domains: configDomains,
} = (process.env.__NEXT_IMAGE_OPTS as any as ImageConfig) || imageConfigDefault;

const loaders = new Map<LoaderValue, (props: DefaultImageLoaderProps) => string>([
  ['default', defaultLoader],
  ['imgix', imgixLoader],
  ['cloudinary', cloudinaryLoader],
  ['akamai', akamaiLoader],
  ['custom', customLoader],
]);

// 查找最接近deviceSizes 和 imageSizes的临近值
export const findNearbyValues = (arr: Array<any>, size: number) => {
  const newSize =
    [size, size * 2].map((w) => arr.find((p: any) => p >= w) || arr[arr.length - 1]) || [];
  return newSize[0];
};

/**
 * 用来存储图片是否加载
 */
export const loadedImageURLs = new Set<string>();

/**
 * 判断是否是静态请求
 * @param src url
 * @returns
 */
export function isStaticRequire(src: StaticRequire | StaticImageData): src is StaticRequire {
  return (src as StaticRequire).default !== undefined;
}

/**
 * 是否静态图像数据
 * @param src url
 * @returns
 */
export function isStaticImageData(src: StaticRequire | StaticImageData): src is StaticImageData {
  return (src as StaticImageData).src !== undefined;
}

/**
 * 是否静态导入
 * @param src url
 * @returns
 */
export function isStaticImport(src: string | StaticImport): src is StaticImport {
  return (
    typeof src === 'object' &&
    (isStaticRequire(src as StaticImport) || isStaticImageData(src as StaticImport))
  );
}

/**
 *
 * @param width 宽度
 * @param layout  布局模式
 * @param sizes  容器大小
 * @returns { widths, kind: 'x' }
 */
export function getWidths(
  width: number | undefined,
  layout: LayoutValue,
  sizes: string | undefined,
  allSizes: any,
): { widths: number[]; kind: 'w' | 'x' } {
  if (sizes && sizes.endsWith('vw') && (layout === 'fill' || layout === 'responsive')) {
    // Find all the "vw" percent sizes used in the sizes prop
    const viewportWidthRe = /(^|\s)(1?\d?\d)vw/g;
    const percentSizes = [];
    for (let match; (match = viewportWidthRe.exec(sizes)); match) {
      percentSizes.push(parseInt(match[2]));
    }
    if (percentSizes.length) {
      const smallestRatio = Math.min(...percentSizes) * 0.01;
      return {
        widths: allSizes.filter((s: any) => s >= configDeviceSizes[0] * smallestRatio),
        kind: 'w',
      };
    }
    return { widths: allSizes, kind: 'w' };
  }
  if (sizes && (layout === 'fill' || layout === 'responsive' || layout === 'auto')) {
    const newSizes = getInt(sizes) || 0;
    const widths = [
      // @ts-ignore
      ...new Set(
        [newSizes, newSizes * 2 /*, width * 3*/].map(
          (w) => allSizes.find((p: any) => p >= w) || allSizes[allSizes.length - 1],
        ),
      ),
    ];
    return { widths: widths, kind: 'w' };
  }
  if (!sizes && layout === 'auto') {
    return { widths: [...configImageSizes, ...configDeviceSizes], kind: 'w' };
  }
  if (typeof width !== 'number' || layout === 'fill' || layout === 'responsive') {
    return { widths: configDeviceSizes, kind: 'w' };
  } else if (!sizes && layout === 'auto') {
    return { widths: allSizes, kind: 'w' };
  }

  const widths = [
    // @ts-ignore
    ...new Set(
      // > This means that most OLED screens that say they are 3x resolution,
      // > are actually 3x in the green color, but only 1.5x in the red and
      // > blue colors. Showing a 3x resolution image in the app vs a 2x
      // > resolution image will be visually the same, though the 3x image
      // > takes significantly more data. Even true 3x resolution screens are
      // > wasteful as the human eye cannot see that level of detail without
      // > something like a magnifying glass.
      // https://blog.twitter.com/engineering/en_us/topics/infrastructure/2019/capping-image-fidelity-on-ultra-high-resolution-devices.html
      [width, width * 2 /*, width * 3*/].map(
        (w) => allSizes.find((p: any) => p >= w) || allSizes[allSizes.length - 1],
      ),
    ),
  ];
  return { widths, kind: 'x' };
}

/**
 * 生成图像属性
 */
export function generateImgAttrs(
  { src, unoptimized, priority, layout, width, quality, sizes, loader }: GenImgAttrsData,
  allSizes: any,
): GenImgAttrsResult {
  if (unoptimized) {
    return { src, srcSet: undefined, sizes: undefined };
  }

  const { widths, kind } = getWidths(width, layout, sizes, allSizes);
  const last = widths.length - 1;

  return {
    sizes: !sizes && layout === 'auto' ? '0px' : !sizes && kind === 'w' ? '100vw' : sizes,
    srcSet: widths
      .map((w, i) => `${loader({ src, quality, width: w })} ${kind === 'w' ? w : i + 1}${kind}`)
      .join(', '),

    // It's intended to keep `src` the last attribute because React updates
    // attributes in order. If we keep `src` the first one, Safari will
    // immediately start to fetch `src`, before `sizes` and `srcSet` are even
    // updated by React. That causes multiple unnecessary requests if `srcSet`
    // and `sizes` are defined.
    // This bug cannot be reproduced in Chrome or Firefox.
    src: loader({ src, quality, width: layout === 'auto' || priority ? widths[0] : widths[last] }),
  };
}

/**
 * 获取宽高
 * @param x
 * @returns
 */
export function getInt(x: unknown): number | undefined {
  if (typeof x === 'number') {
    return x;
  }
  if (typeof x === 'string' && !x.endsWith('%') && !x.endsWith('auto')) {
    return parseInt(x, 10);
  }
  return undefined;
}

/**
 * 默认图片加载器
 * @param loaderProps
 * @returns
 */
export function defaultImageLoader(loaderProps: ImageLoaderProps) {
  const load = loaders.get(configLoader);
  if (load) {
    return load({ root: configPath, ...loaderProps });
  }
  throw new Error(
    `Unknown "loader" found in "next.config.js". Expected: ${VALID_LOADERS.join(
      ', ',
    )}. Received: ${configLoader}`,
  );
}

/**
 * 处理加载中
 * @param img
 * @param src
 * @param placeholder
 * @param onLoadingComplete
 * @returns
 */
export function handleLoading(
  img: HTMLImageElement | null,
  src: string,
  placeholder: PlaceholderValue,
  onLoadingComplete?: OnLoadingComplete,
) {
  if (!img) {
    return;
  }
  const handleLoad = () => {
    if (!img.src.startsWith('data:')) {
      const p = 'decode' in img ? img.decode() : Promise.resolve();
      p.catch(() => {}).then(() => {
        if (placeholder === 'blur') {
          img.style.filter = 'none';
          img.style.backgroundSize = 'none';
          img.style.backgroundImage = 'none';
        }
        loadedImageURLs.add(src);
        if (onLoadingComplete) {
          const { naturalWidth, naturalHeight } = img;
          // Pass back read-only primitive values but not the
          // underlying DOM element because it could be misused.
          onLoadingComplete({ naturalWidth, naturalHeight });
        }
      });
    }
  };
  if (img.complete) {
    // If the real image fails to load, this will still remove the placeholder.
    // This is the desired behavior for now, and will be revisited when error
    // handling is worked on for the image component itself.
    handleLoad();
  } else {
    img.onload = handleLoad;
  }
}

/**
 * 默认图片加载器
 * @param param0
 * @returns
 */
function defaultLoader({ src, width, quality }: DefaultImageLoaderProps): string {
  if (process.env.NODE_ENV !== 'production') {
    const missingValues = [];

    // these should always be provided but make sure they are
    if (!src) missingValues.push('src');
    if (!width) missingValues.push('width');

    if (missingValues.length > 0) {
      throw new Error(
        `Next Image Optimization requires ${missingValues.join(
          ', ',
        )} to be provided. Make sure you pass them as props to the \`next/image\` component. Received: ${JSON.stringify(
          { src, width, quality },
        )}`,
      );
    }

    if (src.startsWith('//')) {
      throw new Error(
        `Failed to parse src "${src}" on \`next/image\`, protocol-relative URL (//) must be changed to an absolute URL (http:// or https://)`,
      );
    }

    if (!src.startsWith('/') && configDomains) {
      let parsedSrc: URL;
      try {
        parsedSrc = new URL(src);
      } catch (err) {
        console.error(err);
        throw new Error(
          `Failed to parse src "${src}" on \`next/image\`, if using relative image it must start with a leading slash "/" or be an absolute URL (http:// or https://)`,
        );
      }

      if (process.env.NODE_ENV !== 'test' && !configDomains.includes(parsedSrc.hostname)) {
        throw new Error(
          `Invalid src prop (${src}) on \`next/image\`, hostname "${parsedSrc.hostname}" is not configured under images in your \`next.config.js\`\n` +
            `See more info: https://nextjs.org/docs/messages/next-image-unconfigured-host`,
        );
      }
    }
  }

  return `/optimize/image/w=${width}&q=${quality || 75}/${encodeURIComponent(src)}`;
}

function normalizeSrc(src: string): string {
  return src[0] === '/' ? src.slice(1) : src;
}

// 图片加载器
function imgixLoader({ root, src, width, quality }: DefaultImageLoaderProps): string {
  // Demo: https://static.imgix.net/daisy.png?auto=format&fit=max&w=300
  const url = new URL(`${root}${normalizeSrc(src)}`);
  const params = url.searchParams;

  params.set('auto', params.get('auto') || 'format');
  params.set('fit', params.get('fit') || 'max');
  params.set('w', params.get('w') || width.toString());

  if (quality) {
    params.set('q', quality.toString());
  }

  return url.href;
}

// 阿卡迈-加载器
function akamaiLoader({ root, src, width }: DefaultImageLoaderProps): string {
  return `${root}${normalizeSrc(src)}?imwidth=${width}`;
}

// 云加载器
function cloudinaryLoader({ root, src, width, quality }: DefaultImageLoaderProps): string {
  // Demo: https://res.cloudinary.com/demo/image/upload/w_300,c_limit,q_auto/turtles.jpg
  const params = ['f_auto', 'c_limit', 'w_' + width, 'q_' + (quality || 'auto')];
  let paramsString = params.join(',') + '/';
  return `${root}${paramsString}${normalizeSrc(src)}`;
}
// 自定义加载器
function customLoader({ src }: DefaultImageLoaderProps): string {
  throw new Error(
    `Image with src "${src}" is missing "loader" prop.` +
      `\nRead more: https://nextjs.org/docs/messages/next-image-missing-loader`,
  );
}
