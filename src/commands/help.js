/*
* @Author: UnsignedByte
* @Date:   00:19:36, 25-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 00:30:05, 25-May-2020
*/
import { SimpleArgumentParser } from '../utils/parsers.js'

function commands ({ client: { commands }, reply }) {
	reply(`Command modules: ${
		Object.keys(commands).map(cmd => `\`${cmd}\``).join(' ')
	}\n\nDo \`help command <module name>\` for more details.`)
}
commands.description = 'Lists all available command modules.'

function command ({
	client: { commands },
	args: { module: main, subcommand: sub },
	reply,
	trace
}) {
	const mod = commands[main]
	if (!mod) {
		return {
			message: `The command module \`${main}\` does not exist. Do \`help commands\` for a list of command modules.`,
			trace
		}
	}
	const commandFn = sub ? mod[sub] : mod.default
	if (!commandFn) {
		return {
			message: `The command \`${main}${sub ? ` ${sub}` : ''}\` does not exist.`,
			trace
		}
	}
	reply(`${
		commandFn.parser || commandFn.description || 'This command has no description.'
	}${
		commandFn.auth ? `\n\nRequired permissions: ${
			commandFn.auth.map(perm => `\`${perm}\``).join(', ')
		}` : ''
	}${sub ? '' : `\n\n**Module subcommands: ${
		Object.keys(mod)
			.filter(cmd => cmd !== 'default')
			.map(cmd => `\`${cmd}\``)
			.join(' ')
	}.**\nDo \`help command ${main} <subcommand>\` to learn more about them.`}`, {
		title: `Help for \`${main}${sub ? ` ${sub}` : ''}\``
	})
}
command.parser = new SimpleArgumentParser({
	main: '<module> [subcommand]'
}, {}, 'Gives more information about the given command.')

function main({ reply }){
	reply('Usage: help commands|command ...')
}

export {
	commands,
	command,
}
export default main
