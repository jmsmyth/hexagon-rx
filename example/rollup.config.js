import buble from 'rollup-plugin-buble'

export default {
  entry: 'index.js',
  dest: 'target/index.js',
  external: ['hexagon-js'],
  format: 'iife',
  plugins: [
    buble()
  ],
  globals: {
    'hexagon-js': 'window.hx'
  }
}
