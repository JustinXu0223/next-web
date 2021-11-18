import { CSSProperties, ReactChild, ReactChildren, ReactHTML } from 'react';

/**
 * 图像处理支持的参数
 */
export type ImageProps = Omit<
  JSX.IntrinsicElements['img'],
  'src' | 'srcSet' | 'ref' | 'width' | 'height' | 'loading' | 'style'
> & {
  src: string | StaticImport;
  width?: number | string;
  height?: number | string;
  layout?: LayoutValue;
  loader?: ImageLoader;
  type?: keyof ReactHTML;
  style?: CSSProperties;
  href?: string;
  baseScale?: number; // 基础倍率
  quality?: number | string;
  priority?: boolean;
  loading?: LoadingValue;
  lazyBoundary?: string;
  placeholder?: PlaceholderValue;
  blurDataURL?: string;
  unoptimized?: boolean;
  objectFit?: ImgElementStyle['objectFit'];
  objectPosition?: ImgElementStyle['objectPosition'];
  onLoadingComplete?: OnLoadingComplete;
  children?: React.ReactNode | ReactChildren | ReactChild[];
} & (
    | {
        href?: never; // 背景图不支持配置跳转链接
        children?: React.ReactNode | ReactChildren | ReactChild[];
      }
    | {
        href?: string;
        children?: never;
      }
  ) &
  (
    | {
        // layout 没有传会默认 为fill并且layout=fill width/height 不能传
        width?: never;
        height?: never;
        layout?: 'fill';
      }
    | {
        // 如果传了宽高就必须传layout 并且layout 不能为fill
        width: number | string;
        height: number | string;
        layout?: Exclude<LayoutValue, 'fill'>;
      }
    | {
        width?: number | string;
        height?: number | string;
        layout?: 'auto';
      }
  ) &
  (
    | {
        placeholder?: Exclude<PlaceholderValue, 'blur'>;
        blurDataURL?: never;
      }
    | {
        placeholder: 'blur';
        blurDataURL: string;
      }
  );

export const VALID_LOADING_VALUES = ['lazy', 'eager', undefined] as const;
export const VALID_LAYOUT_VALUES = [
  'fill',
  'fixed',
  'intrinsic',
  'responsive',
  'auto',
  undefined,
] as const;

export type LoadingValue = typeof VALID_LOADING_VALUES[number];

export type ImageLoader = (resolverProps: ImageLoaderProps) => string;

export type ImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

export type DefaultImageLoaderProps = ImageLoaderProps & { root: string };

export type LayoutValue = typeof VALID_LAYOUT_VALUES[number];

export type PlaceholderValue = 'blur' | 'empty';

export type OnLoadingComplete = (result: { naturalWidth: number; naturalHeight: number }) => void;

export type ImgElementStyle = NonNullable<JSX.IntrinsicElements['img']['style']>;

export interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
}

export interface StaticRequire {
  default: StaticImageData;
}

export type StaticImport = StaticRequire | StaticImageData;

export type GenImgAttrsData = {
  src: string;
  unoptimized: boolean;
  priority: boolean;
  layout: LayoutValue;
  loader: ImageLoader;
  width?: number;
  quality?: number;
  sizes?: string;
};

export type GenImgAttrsResult = {
  src: string;
  srcSet: string | undefined;
  sizes: string | undefined;
};
