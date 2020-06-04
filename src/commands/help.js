/*
* @Author: UnsignedByte
* @Date:   00:19:36, 25-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 00:30:05, 25-May-2020
*/

function commands ({ client: { commands }, reply }) {
	reply('Commands: ' + commands.map(cmd => `\`${cmd}\``).join(' '))
}

function main({ reply }){
	reply('Usage: help [commands]')
}

export {
	commands
}
export default main
