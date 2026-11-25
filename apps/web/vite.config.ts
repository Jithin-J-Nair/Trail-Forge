import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

/** three@0.174 dropped WebGLMultipleRenderTargets; stub unused SSR effect import. */
function stubPostprocessingSsr(): Plugin {
  return {
    name: 'stub-postprocessing-ssr',
    enforce: 'pre',
    resolveId(id) {
      if (id.includes('screen-space-reflections')) {
        return '\0stub-ssr-effect';
      }
      return null;
    },
    load(id) {
      if (id === '\0stub-ssr-effect') {
        return 'export class SSREffect {}\nexport default class SSREffectDefault {}';
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [stubPostprocessingSsr(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: [],
    esbuildOptions: {
      plugins: [
        {
          name: 'stub-ssr-esbuild',
          setup(build) {
            build.onLoad({ filter: /screen-space-reflections\.js$/ }, () => ({
              contents: 'export class SSREffect {}',
              loader: 'js',
            }));
          },
        },
      ],
    },
  },
});
