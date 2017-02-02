import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/index.js',
  dest: 'dist/index.es5.js',
  external: ['hexagon-js'],
  format: 'es',
  plugins: [
    buble()
  ]
}
