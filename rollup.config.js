import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default [
  // Legacy JavaScript app
  {
    input: 'src/scripts/app.js',
    output: {
      file: 'dist/app.min.js',
      format: 'es',
      inlineDynamicImports: true
    },
    plugins: [terser()],
    external: []
  },
  // New TypeScript modules
  {
    input: 'dist/lib/lib/integration.js', // TypeScript already compiled by tsc
    output: {
      file: 'dist/lib/integration.min.js',
      format: 'es',
      inlineDynamicImports: true
    },
    plugins: [terser()],
    external: []
  }
];