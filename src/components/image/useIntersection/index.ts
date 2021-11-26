import { useCallback, useEffect, useRef, useState } from 'react';
import { requestIdleCallback, cancelIdleCallback } from './components/request-idle-callback';

type UseIntersectionObserverInit = Pick<IntersectionObserverInit, 'rootMargin'>;
type UseIntersection = { disabled?: boolean } & UseIntersectionObserverInit;
type ObserveCallback = (isVisible: boolean) => void;
type Observer = {
  id: string;
  observer: IntersectionObserver;
  elements: Map<Element, ObserveCallback>;
};

const hasIntersectionObserver = typeof IntersectionObserver !== 'undefined';

/**
 *  判断元素是否在可见区域 IntersectionObserver 可能存在兼容性问题，已导入polyfill解决
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver 原API
 * @param rootMargin   与CSS属性margin语法相似的字符串
 * @param disabled  扩展属性-是否禁用
 * @returns
 */
export function useIntersection<T extends Element>({
  rootMargin,
  disabled = false,
}: UseIntersection): [(element: T | null) => void, boolean] {
  const isDisabled: boolean = disabled || !hasIntersectionObserver;

  const unobserve = useRef<Function>();
  const [visible, setVisible] = useState(false);

  const setRef = useCallback(
    (el: T | null) => {
      if (unobserve.current) {
        unobserve.current();
        unobserve.current = undefined;
      }

      if (isDisabled || visible) return;

      if (el && el.tagName) {
        unobserve.current = observe(el, (isVisible) => isVisible && setVisible(isVisible), {
          rootMargin,
        });
      }
    },
    [isDisabled, rootMargin, visible],
  );

  useEffect(() => {
    if (!hasIntersectionObserver) {
      if (!visible) {
        const idleCallback = requestIdleCallback(() => setVisible(true));
        // @ts-ignore
        return () => cancelIdleCallback(idleCallback);
      }
    }
  }, [visible]);

  return [setRef, visible];
}

function observe(
  element: Element,
  callback: ObserveCallback,
  options: UseIntersectionObserverInit,
): () => void {
  const { id, observer, elements } = createObserver(options);
  elements.set(element, callback);

  observer.observe(element);
  return function unobserve(): void {
    elements.delete(element);
    observer.unobserve(element);

    if (elements.size === 0) {
      observer.disconnect();
      observers.delete(id);
    }
  };
}

const observers = new Map<string, Observer>();
function createObserver(options: UseIntersectionObserverInit): Observer {
  const id = options.rootMargin || '';
  let instance = observers.get(id);
  if (instance) {
    return instance;
  }

  const elements = new Map<Element, ObserveCallback>();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const callback = elements.get(entry.target);
      const isVisible = entry.isIntersecting || entry.intersectionRatio > 0;
      if (callback && isVisible) {
        callback(isVisible);
      }
    });
  }, options);

  observers.set(
    id,
    (instance = {
      id,
      observer,
      elements,
    }),
  );
  return instance;
}
