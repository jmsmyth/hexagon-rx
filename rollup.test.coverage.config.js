import buble from 'rollup-plugin-buble'
import istanbul from 'rollup-plugin-istanbul'

export default {
  entry: 'test/index.spec.js',
  dest: 'target/index.spec.coverage.js',
  external: ['hexagon-js', 'chai'],
  format: 'iife',
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
