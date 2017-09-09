import buble from 'rollup-plugin-buble'

export default {
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
