// 한 파일짜리 미리보기 빌드용 (npm run build:single). 평소 개발에는 필요 없음.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-single' },
})
