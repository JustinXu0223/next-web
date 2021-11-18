// 禁止React Developer Tools
export const disableReactDevTools = () => {
  const noop = () => null;
  // @ts-ignore
  const DEV_TOOLS = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (typeof DEV_TOOLS === 'object') {
    for (const [key, value] of Object.entries(DEV_TOOLS)) {
      DEV_TOOLS[key] = typeof value === 'function' ? noop : [];
    }
  }
};

// 禁止调试
export const disableDebugger = () => {
  try {
    window.eval(
      ((c: string, _g: number, a, b: string | Array<any>, d: number | any, e: any) => {
        d = String;
        if (!''.replace(/^/, String)) {
          for (; a--; ) {
            e[a] = b[a] || a;
          }
          b = [
            (f: any) => {
              return e[f];
            },
          ];
          d = () => {
            return '\\w+';
          };
          a = 1;
        }
        for (; a--; ) {
          b[a] && (c = c.replace(new RegExp('\\b' + d(a) + '\\b', 'g'), b[a]));
        }
        return c;
      })(
        '(()=>{1 0(){2(()=>{3("4")()},5)}6{0()}7(8){}})();',
        9,
        9,
        'block function setInterval Function debugger 50 try catch err'.split(' '),
        0,
        {},
      ),
    );
  } catch (e) {}
};
