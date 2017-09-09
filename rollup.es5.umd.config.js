import buble from 'rollup-plugin-buble'

export default {
  name: 'rx',
  input: 'src/index.js',
  output: {
    file: 'dist/index.es5.umd.js',
    format: 'umd'
  },
  external: ['hexagon-js'],
  plugins: [
    buble()
  ],
  globals: {
    'hexagon-js': 'window.hx'
  }
}
