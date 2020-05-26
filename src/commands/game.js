/*
* @Author: UnsignedByte
* @Date:   11:36:59, 25-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 11:38:41, 25-May-2020
*/

function random ({ reply }) {
	reply('4')
}

function args ({ unparsedArgs, reply }) {
	reply('```\n' + unparsedArgs + '\n```')
}

function main ({ client, reply }) {
	reply(`Try \`${client.prefix}help game\` to get a list of commands`)
}

export { random, args }
export default main
