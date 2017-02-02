import buble from 'rollup-plugin-buble'

export default {
  entry: 'test/index.spec.js',
  dest: 'target/index.spec.js',
  external: ['hexagon-js', 'chai'],
  format: 'iife',
  globals: {
    'hexagon-js': 'window.hx',
    'chai': 'window.chai'
  },
  plugins: [
    buble()
  ]
}
