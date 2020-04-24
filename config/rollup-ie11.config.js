/* cSpell:disable */
import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import multi from '@rollup/plugin-multi-entry';
import replace from '@rollup/plugin-replace';
import banner from './banner.config';

export default {
  input: ['src/polyfills.js', 'src/index.js'],
  output: {
    name: 'suke',
    file: 'dist/suke-ie11.js',
    format: 'umd',
    banner: banner
  },
  plugins: [
    multi(),
    commonjs(),
    replace({ 'process.env.NODE_ENV': "'production'" }),
    resolve(),
    filesize(),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: '> 0.5%, ie >= 11'
            },
            modules: false,
            spec: true,
            useBuiltIns: 'usage',
            forceAllTransforms: true,
            corejs: {
              version: 3,
              proposals: false
            }
          }
        ]
      ]
    })
  ]
};
