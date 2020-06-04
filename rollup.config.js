/*
* @Author: UnsignedByte
* @Date:   16:10:21, 24-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 21:31:20, 03-Jun-2020
*/

import resolve from '@rollup/plugin-node-resolve';
import ignore from 'rollup-plugin-ignore';

export default {
  input: 'src/web.js',
  inlineDynamicImports: true,
  output: {
    file: 'build/main.js',
    format: 'iife',
    name: 'Bot',
		sourcemap: true
  },
	plugins: [
		resolve({
			browser: true
		}),
		ignore(['fs', 'buffer'])
	]
};
