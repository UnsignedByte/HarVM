// Produces a CommonJS file for Node <= 12

export default {
  input: 'src/node.js',
  output: {
    file: 'build/node.cjs',
    format: 'cjs'
  }
};
