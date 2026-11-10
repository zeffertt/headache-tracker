import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { readFileSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
export default defineConfig({ plugins: [preact()], define: { __APP_VERSION__: JSON.stringify(process.env.APP_VERSION || pkg.version) }, base: './', build: { outDir: 'dist', target: 'es2020' }, test: { environment: 'node' } });
