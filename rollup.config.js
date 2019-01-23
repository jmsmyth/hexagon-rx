import buble from 'rollup-plugin-buble'
import istanbul from 'rollup-plugin-istanbul'

const watch = {
  clearScreen: false
}

const es5 = {
  input: 'src/index.js',
  output: {
    file: 'dist/index.es5.js',
    format: 'es'
  },
  external: ['hexagon-js'],
  plugins: [
    buble()
  ],
  watch
}

const es5umd = {
  input: 'src/index.js',
  output: {
    name: 'rx',
    file: 'dist/index.es5.umd.js',
    format: 'umd',
    globals: {
      'hexagon-js': 'window.hx'
    }
  },
  external: ['hexagon-js'],
  plugins: [
    buble()
  ],
  watch
}

const es6 = {
  input: 'src/index.js',
  output: {
    file: 'dist/index.es6.js',
    format: 'es'
  },
  external: ['hexagon-js'],
  watch
}

const test = {
  input: 'test/index.spec.js',
  output: {
    file: 'target/index.spec.js',
    format: 'iife',
    globals: {
      'hexagon-js': 'window.hx',
      'chai': 'window.chai'
    }
  },
  external: ['hexagon-js', 'chai'],
  plugins: [
    buble()
  ],
  watch
}

const testCoverage = {
  input: 'test/index.spec.js',
  output: {
    file: 'target/index.spec.coverage.js',
    format: 'iife',
    globals: {
      'hexagon-js': 'window.hx',
      'chai': 'window.chai'
    }
  },
  external: ['hexagon-js', 'chai'],
  plugins: [
    buble(),
    istanbul({
      exclude: ['test/**/*.js']
    })
  ],
  watch
}

export default [
  es5,
  es5umd,
  es6,
  test,
  testCoverage
]
