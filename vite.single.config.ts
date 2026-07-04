import { rename } from 'node:fs/promises';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 通常ビルド dist/index.html（file://では動かない）との取り違えを防ぐため、
// 配布用の単一HTMLは asrs.html という名前で出力する。
function renameOutputHtml(): Plugin {
  let outDir = 'dist-single';
  return {
    name: 'asrs-rename-output-html',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle: async () => {
      await rename(`${outDir}/index.html`, `${outDir}/asrs.html`);
    },
  };
}

// 配布用: JS/CSSをすべてインライン化した単一HTMLを dist-single/asrs.html に出力する。
// file:// で直接開ける（localStorageは http://localhost とは別になる点に注意）。
export default defineConfig({
  plugins: [react(), viteSingleFile(), renameOutputHtml()],
  build: {
    outDir: 'dist-single',
  },
});
