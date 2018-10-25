import buble from 'rollup-plugin-buble'

const es5 = {
  input: 'src/index.js',
  output: {
    file: 'dist/index.es5.js',
    format: 'es'
  },
  external: ['hexagon-js'],
  plugins: [
    buble()
  ]
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
  ]
}


const es6 = {
  input: 'src/index.js',
  output: {
    file: 'dist/index.es6.js',
    format: 'es'
  },
  external: ['hexagon-js']
}

export default [
  es5,
  es5umd,
  es6
]
