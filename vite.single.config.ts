import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 配布用: JS/CSSをすべてインライン化した単一HTMLを dist-single/ に出力する。
// file:// で直接開ける（localStorageは http://localhost とは別になる点に注意）。
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-single',
  },
});
