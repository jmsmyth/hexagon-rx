import buble from 'rollup-plugin-buble'

export default {
  input: 'test/index.spec.js',
  output: {
    file: 'target/index.spec.js',
    format: 'iife'
  },
  external: ['hexagon-js', 'chai'],
  globals: {
    'hexagon-js': 'window.hx',
    'chai': 'window.chai'
  },
  plugins: [
    buble()
  ]
}
