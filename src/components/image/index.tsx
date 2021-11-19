import React, { CSSProperties } from 'react';
import Head from 'next/head';
import { ImageConfig, imageConfigDefault } from '@/config/image-config';
import { useIntersection } from './useIntersection';
import { toBase64 } from 'js-base64';
import useDimensions from 'react-cool-dimensions';
import styles from './index.module.scss';
import {
  GenImgAttrsResult,
  ImageProps,
  ImgElementStyle,
  LayoutValue,
  VALID_LAYOUT_VALUES,
  VALID_LOADING_VALUES,
} from './index.interface';
import {
  defaultImageLoader,
  findNearbyValues,
  generateImgAttrs,
  getInt,
  handleLoading,
  isStaticImport,
  isStaticRequire,
  loadedImageURLs,
} from './utils';
import { reactClassNameJoin } from '@/utils/classNames';
import { useRouter } from 'next/router';

if (typeof window === 'undefined') {
  (global as any).__NEXT_IMAGE_IMPORTED = true;
}

const { deviceSizes: configDeviceSizes, imageSizes: configImageSizes } =
  (process.env.__NEXT_IMAGE_OPTS as any as ImageConfig) || imageConfigDefault;
// sort smallest to largest
const allSizes = [...configDeviceSizes, ...configImageSizes];
configDeviceSizes.sort((a: number, b: number) => a - b);
allSizes.sort((a, b) => a - b);

// react-cool-dimensions
let newSizes: any = {};
allSizes.map((size, index) => {
  newSizes[`X${index}`] = size;
});

/**
 * 图像加载组件
 * @param ImageProps
 * @returns Image
 */
export default function Image({
  src,
  sizes,
  // 只优化站外资源http开头的路径
  unoptimized = typeof src === 'string' ? !/^http/i.test(src) : false,
  priority = false,
  loading,
  children,
  lazyBoundary = children ? '300px' : '200px', // 背景图通常比较大，如果有children 需要更早的加载图片
  className,
  type = 'div',
  baseScale = 1,
  style,
  href,
  quality = 80,
  width,
  height,
  objectFit = width && height ? 'contain' : 'cover',
  objectPosition,
  onLoadingComplete,
  loader = defaultImageLoader,
  // 因为老站有模糊图,所以需要默认设置需要加载模糊图 如果不需要 业务代码中设置成 empty
  placeholder = src && typeof src === 'string' && !src.startsWith('data:') ? 'blur' : 'empty',
  blurDataURL,
  ...all
}: ImageProps) {
  const router = useRouter();

  let isLazy = !priority && (loading === 'lazy' || typeof loading === 'undefined');
  if (typeof src === 'string' && src.startsWith('data:')) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
    unoptimized = true;
    isLazy = false;
  }
  if (typeof window !== 'undefined' && loadedImageURLs.has(typeof src === 'string' ? src : '')) {
    isLazy = false;
  }
  const [setRef, isIntersected] = useIntersection<HTMLImageElement | HTMLDivElement>({
    rootMargin: lazyBoundary,
    disabled: !isLazy,
  });

  const {
    observe,
    width: calculateSizes,
    currentBreakpoint,
  } = useDimensions({
    breakpoints: newSizes,
    updateOnBreakpointChange: true,
  });

  // 如果src为空 但是children有值，不走图像处理直接返回type
  if (!src && children) {
    return React.createElement(
      type,
      {
        className: reactClassNameJoin(styles.imageContainer, className),
        style: { width, height, ...style },
      },
      [
        React.Children.map(children, (child: any, index): any => {
          return (
            <React.Fragment key={`__k${index}img-children`}>
              {React.isValidElement(child) ? React.cloneElement(child) : child}
            </React.Fragment>
          );
        }),
      ],
    );
  }

  if (!src) {
    return null;
  }

  let rest: Partial<ImageProps> = all;
  // 可以让宽高 定义在style, 不要定义在 className
  width = width || style?.width;
  height = height || style?.height;

  let layout: NonNullable<LayoutValue> = sizes ? 'responsive' : 'intrinsic';
  // 这段代码不能在layout之前,否在影响布局判断
  sizes = sizes || (calculateSizes ? `${calculateSizes * baseScale}px` : void 0);
  if ('layout' in rest) {
    if (rest.layout) layout = rest.layout;
    delete rest['layout'];
  }

  let staticSrc = '';
  if (isStaticImport(src)) {
    const staticImageData = isStaticRequire(src) ? src.default : src;
    if (!staticImageData.src) {
      throw new Error(
        `An object should only be passed to the image component src parameter if it comes from a static image import. It must include src. Received ${JSON.stringify(
          staticImageData,
        )}`,
      );
    }
    blurDataURL = blurDataURL || staticImageData.blurDataURL;
    staticSrc = staticImageData.src;
    if (!layout || layout !== 'fill') {
      height = height || staticImageData.height;
      width = width || staticImageData.width;
      if (!staticImageData.height || !staticImageData.width) {
        throw new Error(
          `An object should only be passed to the image component src parameter if it comes from a static image import. It must include height and width. Received ${JSON.stringify(
            staticImageData,
          )}`,
        );
      }
    }
  }
  src = typeof src === 'string' ? src : staticSrc;
  const widthInt = getInt(width);
  const heightInt = getInt(height);

  const qualityInt = getInt(quality);

  if (process.env.NODE_ENV !== 'production') {
    if (!src) {
      throw new Error(
        `Image is missing required "src" property. Make sure you pass "src" in props to the \`next/image\` component. Received: ${JSON.stringify(
          { width, height, quality },
        )}`,
      );
    }
    if (!VALID_LAYOUT_VALUES.includes(layout)) {
      throw new Error(
        `Image with src "${src}" has invalid "layout" property. Provided "${layout}" should be one of ${VALID_LAYOUT_VALUES.map(
          String,
        ).join(',')}.`,
      );
    }
    if (
      layout !== 'auto' &&
      ((typeof widthInt !== 'undefined' && isNaN(widthInt)) ||
        (typeof heightInt !== 'undefined' && isNaN(heightInt)))
    ) {
      throw new Error(
        `Image with src "${src}" has invalid "width" or "height" property. These should be numeric values.`,
      );
    }
    if (!VALID_LOADING_VALUES.includes(loading)) {
      throw new Error(
        `Image with src "${src}" has invalid "loading" property. Provided "${loading}" should be one of ${VALID_LOADING_VALUES.map(
          String,
        ).join(',')}.`,
      );
    }
    if (priority && loading === 'lazy') {
      throw new Error(
        `Image with src "${src}" has both "priority" and "loading='lazy'" properties. Only one should be used.`,
      );
    }
    if ('ref' in rest) {
      console.warn(
        `Image with src "${src}" is using unsupported "ref" property. Consider using the "onLoadingComplete" property instead.`,
      );
    }
    if ('style' in rest) {
      console.warn(
        `Image with src "${src}" is using unsupported "style" property. Please use the "className" property instead.`,
      );
    }
    const rand = Math.floor(Math.random() * 1000) + 100;
    if (!unoptimized && !loader({ src, width: rand, quality: 75 }).includes(rand.toString())) {
      console.warn(
        `Image with src "${src}" has a "loader" property that does not implement width. Please implement it or use the "unoptimized" property instead.` +
          `\nRead more: https://nextjs.org/docs/messages/next-image-missing-loader-width`,
      );
    }
  }

  const isVisible = !isLazy || isIntersected;

  let wrapperStyle: JSX.IntrinsicElements['div']['style'] | undefined;
  let sizerStyle: JSX.IntrinsicElements['div']['style'] | undefined;
  let sizerSvg: string | undefined;
  let imgStyle: ImgElementStyle | undefined = {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    boxSizing: 'border-box',
    padding: 0,
    border: 'none',
    margin: 'auto',
    display: 'block',
    width: 0,
    height: 0,
    minWidth: '100%',
    maxWidth: '100%',
    minHeight: '100%',
    maxHeight: '100%',
    objectFit,
    objectPosition,
  };
  //需要模糊图,并且在可见区域，及没有设置自定义的blurDataURL,并且不是优先加载 需要设置设置默认的模糊图
  if (
    placeholder === 'blur' &&
    isVisible &&
    !blurDataURL &&
    !src.startsWith('data:') &&
    !priority
  ) {
    // 如果需要模糊图，并且在可见区域，并且没有设置blurDataURL 给一张最小图片
    blurDataURL = generateImgAttrs(
      {
        src,
        unoptimized,
        priority,
        layout,
        width: 0,
        quality: qualityInt,
        sizes: '0px',
        loader,
      },
      allSizes,
    ).src;
  } else if (priority) {
    // 如果优先加载 不加载模糊图用 css filter: blur(20px);
    blurDataURL =
      blurDataURL ||
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }
  // 如果已经加载完成图片(loadedImageURLs.has(src)) 就不设置模糊图
  const blurStyle =
    placeholder === 'blur' && isVisible && !loadedImageURLs.has(src) && !src.startsWith('data:')
      ? {
          filter: 'blur(20px)',
          backgroundSize: objectFit || 'cover',
          backgroundImage: `url("${blurDataURL}")`,
          backgroundPosition: objectPosition || '0% 0%',
          backgroundRepeat: 'no-repeat',
        }
      : {};

  if (layout === 'fill') {
    wrapperStyle = {
      display: 'block',
      overflow: 'hidden',

      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,

      boxSizing: 'border-box',
      margin: 0,
    };
  } else if (typeof widthInt !== 'undefined' && typeof heightInt !== 'undefined') {
    const quotient = heightInt / widthInt;
    const paddingTop = isNaN(quotient) ? '100%' : `${quotient * 100}%`;

    if (layout === 'responsive') {
      wrapperStyle = {
        display: 'block',
        overflow: 'hidden',
        position: 'relative',

        boxSizing: 'border-box',
        margin: 0,
      };
      sizerStyle = { display: 'block', boxSizing: 'border-box', paddingTop };
    } else if (layout === 'intrinsic') {
      wrapperStyle = {
        display: 'block',
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        margin: 0,
      };
      sizerStyle = {
        boxSizing: 'border-box',
        display: 'block',
        maxWidth: '100%',
      };
      sizerSvg = `<svg width="${widthInt}" height="${heightInt}" xmlns="http://www.w3.org/2000/svg" version="1.1"/>`;
    } else if (layout === 'fixed') {
      wrapperStyle = {
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'inline-block',
        position: 'relative',
        width: widthInt,
        height: heightInt,
      };
    }
  }
  if (children) {
    // 如果是背景图不需要设置
    wrapperStyle = {};
  }

  let imgAttributes: GenImgAttrsResult = {
    src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    srcSet: undefined,
    sizes: undefined,
  };

  let bgStyle: CSSProperties = {};
  if (isVisible) {
    imgAttributes = generateImgAttrs(
      {
        src,
        unoptimized,
        priority,
        layout,
        width: widthInt,
        quality: qualityInt,
        sizes,
        loader,
      },
      allSizes,
    );
    // 有子节点并且在可见区域才加载背景图
    if (children && currentBreakpoint) {
      const nearbyValues = findNearbyValues(Object.values(newSizes), calculateSizes * baseScale);
      bgStyle.backgroundImage = src.startsWith('data:')
        ? `url(${imgAttributes.src})`
        : `url(${
            generateImgAttrs(
              {
                src,
                unoptimized,
                priority,
                // 背景图的大小是内容撑开的
                layout: 'auto',
                width: nearbyValues,
                quality: qualityInt,
                sizes,
                loader,
              },
              allSizes,
            ).src
          })`;
    }
  }

  const onClickImage = (href?: any) => () => {
    if (href) {
      router.push(href);
    }
  };

  // H5 width height % 会被设置成0
  let autoStyle: CSSProperties = {};
  if (layout === 'auto') {
    autoStyle.width = width;
    autoStyle.height = height;
  }
  let srcString: string = src;
  return React.createElement(
    type,
    {
      // 背景图的backgroundSize 只能这样写,如果用style 外层的className权重会没有style高
      className: reactClassNameJoin(styles.imageContainer, styles[objectFit], className),
      style: {
        width,
        height,
        cursor: href ? 'pointer' : 'inherit',
        ...bgStyle, // 背景图片
        ...style, // 自定义style
      },
      ref: (div: any) => {
        observe(div);
        (children || layout === 'auto') && setRef(div);
      },
      onClick: onClickImage(href),
    },
    [
      // auto 特殊处理
      layout === 'auto' && !children && (
        <img
          width={width}
          height={height}
          // sizes={calculateSizes}
          {...rest}
          {...imgAttributes}
          decoding='async'
          style={{ ...blurStyle, ...autoStyle }}
          onDragStart={(e) => {
            if (e && e.preventDefault) {
              e.preventDefault();
            }
          }}
          ref={(img) => {
            handleLoading(img, srcString, placeholder, onLoadingComplete);
          }}
          key={'__k8img-' + imgAttributes.src + imgAttributes.srcSet + imgAttributes.sizes}
        />
      ),
      // 和原来Image 组件层级保持一致
      !children &&
        layout !== 'auto' &&
        React.createElement(
          'div',
          {
            style: {
              ...wrapperStyle,
            },
            key: '__k0img-' + imgAttributes.src + imgAttributes.srcSet + imgAttributes.sizes,
          },
          [
            sizerStyle ? (
              <div
                style={sizerStyle}
                key={'__k1img-' + imgAttributes.src + imgAttributes.srcSet + imgAttributes.sizes}
              >
                {sizerSvg ? (
                  <img
                    style={{
                      maxWidth: '100%',
                      display: 'block',
                      margin: 0,
                      border: 'none',
                      padding: 0,
                    }}
                    alt=''
                    aria-hidden={true}
                    src={`data:image/svg+xml;base64,${toBase64(sizerSvg)}`}
                    key={
                      '__k2img-' + imgAttributes.src + imgAttributes.srcSet + imgAttributes.sizes
                    }
                  />
                ) : null}
              </div>
            ) : null,
            <img
              {...rest}
              {...imgAttributes}
              decoding='async'
              ref={(img) => {
                setRef(img);
                handleLoading(img, srcString, placeholder, onLoadingComplete);
              }}
              style={{ ...imgStyle, ...blurStyle, ...autoStyle }}
              onDragStart={(e) => {
                if (e && e.preventDefault) {
                  e.preventDefault();
                }
              }}
              key={'__k3img-' + imgAttributes.src + imgAttributes.srcSet + imgAttributes.sizes}
            />,
          ],
        ),
      priority ? (
        <Head key={'__nimg-' + imgAttributes.src + imgAttributes.srcSet + imgAttributes.sizes}>
          <link
            rel='preload'
            as='image'
            // safari 不支持imagesrcset 直接改成href, 或者 link 设置 media(但是现在h5和web是分开的，图片只有一张-暂时不考虑用)
            href={imgAttributes.src}
            // @ts-ignore: imagesrcset is not yet in the link element type
            // imagesrcset={imgAttributes.srcSet}
            // @ts-ignore: imagesizes is not yet in the link element type
            // imagesizes={imgAttributes.sizes}
          />
        </Head>
      ) : null,
      React.Children.map(children, (child: any, index): any => {
        return (
          <React.Fragment
            key={
              `__k${index}-children` +
              imgAttributes.src +
              imgAttributes.srcSet +
              imgAttributes.sizes
            }
          >
            {React.isValidElement(child) ? React.cloneElement(child) : child}
          </React.Fragment>
        );
      }),
    ],
  );
}
