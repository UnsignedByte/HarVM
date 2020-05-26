import Discord from "../discord/discord.js"

import * as commands from './commands.js'

const { Client } = Discord

export default function main (token) {
  // Create an instance of a Discord client
  const client = new Client()

  client.prefix = localStorage.getItem('[HarVM] prefix')
  client.data = JSON.parse(localStorage.getItem('[HarVM] data')) || {}

	const aliases = new Map(JSON.parse(localStorage.getItem('[HarVM] aliases')) || [])
	const aliasUtil = {
		aliases,
		saveAliases () {
			localStorage.setItem('[HarVM] aliases', JSON.stringify([...aliases]))
		}
	}
	
  client.on('ready', () => {
    console.log('ready')
  })

	const commandParser = /^(\w+)(?:\s+(\w+))?/
	
	// TODO: We can make this fancier by making a standard embed response thing
	function reply (msg, message, options={}) {
		msg.channel.send(`Requested by ${msg.author.tag}:\n${message}`, options)
	}

	// Allows for batch calling in the future
  async function runCommand (command, context) {
		context.calls++
		// We can check if the user has gone over their call limit here
		const { msg } = context
		const [matched, commandName, subCommandName] = match
		const command = commands[commandName]
		let commandFn, unparsedArgs
		if (command) {
			// Using `hasOwnProperty` in case someone does `testing toString`, for example
			if (command.hasOwnProperty(subCommandName)) {
				subCommand = command[subCommandName]
				unparsedArgs = msg.content.slice(matched.length).trim()
			} else if (command.default) {
				subCommand = command.default
				unparsedArgs = msg.content.slice(commandName.length).trim()
			} else {
				return subCommandName
					? `Unknown subcommand \`${command} ${subCommandName}\``
					: `This command requires a subcommand.`
			}
		} else if (aliases.has(command)) {
			// Another benefit of putting all this in `runCommand` is that we can
			// recursively call
			// BUG: This setup may have a vulnerability where setting an alias to
			// itself will cause a maximum call size limit reached error
			return runCommand(aliases.get(command) + msg.content.slice(commandName.length), context)
		} else {
			return `Unknown command \`${command}\``
		}
		const error = commandFn({
			client,
			unparsedArgs,
			msg,
			reply: (...args) => reply(msg, ...args)
			aliasUtil,
			// Is this a good idea? lol
			run: command => runCommand(command, context)
		})
		localStorage.setItem('[HarVM] data', JSON.stringify(client.data))
		return error
  }

  client.on('message', async msg => {
    if (!msg.author.bot) {
      if (msg.content.startsWith(client.prefix)) {
				const error = runCommand(msg.content.slice(client.prefix.length), {
					msg,
					// `temp` is for storing variables in case we want to do that
					// in the future, lol
					// Using a map in case someone uses `__proto__` or something dumb
					// as a variable name
					temp: new Map(),
					// Keep track of calls (in case it recurses); this way, we can "charge"
					// people for how many commands they run to discourage complex
					// computations
					calls: 0
				})
				// TODO: Probably can make this more sophisticated by indicating that it should
				// have a red stripe etc
        if (error) reply(msg, error)
      }
    }
  })

  client.login(token)
}
