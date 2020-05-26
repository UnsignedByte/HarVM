/*
* @Author: UnsignedByte
* @Date:   16:10:21, 24-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 23:47:40, 24-May-2020
*/

export default {
  input: 'src/main.js',
  inlineDynamicImports:true,
  output: {
    file: 'build/main.js',
    format: 'iife',
    name: 'Bot',
		sourcemap: true
  }
};
