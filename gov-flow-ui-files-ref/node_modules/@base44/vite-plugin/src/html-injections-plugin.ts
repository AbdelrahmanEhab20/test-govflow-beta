import type { Plugin } from "vite";

export function htmlInjectionsPlugin({
  hmrNotifier,
  navigationNotifier,
  visualEditAgent,
}: {
  hmrNotifier: boolean;
  navigationNotifier: boolean;
  visualEditAgent: boolean;
}) {
  return {
    name: "html-injections",
    apply: (config) => config.mode !== "production",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: {
            src: "/node_modules/@base44/vite-plugin/dist/injections/unhandled-errors-handlers.js",
            type: "module",
          },
          injectTo: "head",
        },
        {
          tag: "script",
          attrs: {
            src: "/node_modules/@base44/vite-plugin/dist/injections/sandbox-mount-observer.js",
            type: "module",
          },
          injectTo: "body",
        },
        ...(hmrNotifier
          ? [
              {
                tag: "script",
                attrs: {
                  src: "/node_modules/@base44/vite-plugin/dist/injections/sandbox-hmr-notifier.js",
                  type: "module",
                },
                injectTo: "head",
              },
            ]
          : []),
        ...(navigationNotifier
          ? [
              {
                tag: "script",
                attrs: {
                  src: "/node_modules/@base44/vite-plugin/dist/injections/navigation-notifier.js",
                  type: "module",
                },
                injectTo: "head",
              },
            ]
          : []),
        ...(visualEditAgent
          ? [
              {
                tag: "script",
                attrs: {
                  src: "/node_modules/@base44/vite-plugin/dist/injections/visual-edit-agent.js",
                  type: "module",
                },
                injectTo: "body",
              },
            ]
          : []),
      ];
    },
  } as Plugin;
}
