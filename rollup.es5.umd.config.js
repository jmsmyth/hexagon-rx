import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/index.js',
  dest: 'dist/index.es5.umd.js',
  external: ['hexagon-js'],
  moduleName: 'rx',
  format: 'umd',
  plugins: [
    buble()
  ],
  globals: {
    'hexagon-js': 'window.hx'
  }
}
