import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default [
  // Main TypeScript app
  {
    input: 'src/scripts/app.ts',
    output: {
      file: 'dist/app.min.js',
      format: 'es',
      inlineDynamicImports: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      }),
      terser()
    ],
    external: []
  },
  // BOVI TypeScript modules
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