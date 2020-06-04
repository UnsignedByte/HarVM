/*
* @Author: UnsignedByte
* @Date:   00:35:20, 25-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 00:36:36, 25-May-2020
*/

function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

const whitespaceRegex = /^\s$/
function isWhitespace (char) {
	return whitespaceRegex.test(char)
}

// Too lazy to individually escape each backtick in a template literal.
const CODE = '```'

export {
	escapeRegex,
	isWhitespace,
	CODE
}
