import buble from 'rollup-plugin-buble'
import istanbul from 'rollup-plugin-istanbul'

export default {
  input: 'test/index.spec.js',
  output: {
    file: 'target/index.spec.coverage.js',
    format: 'iife'
  },
  external: ['hexagon-js', 'chai'],
  globals: {
    'hexagon-js': 'window.hx',
    'chai': 'window.chai'
  },
  plugins: [
    istanbul({
      exclude: ['test/**/*.js']
    }),
    buble()
  ]
}
