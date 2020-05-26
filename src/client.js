import Discord from "../discord/discord.js"

import * as commands from './commands.js'
import DataManager from './utils/data_manager.js'

const { Client } = Discord

export default async function main (token) {
  // Create an instance of a Discord client
  const client = new Client()

  client.prefix = localStorage.getItem('[HarVM] prefix')
  client.data = new DataManager(JSON.parse(localStorage.getItem('[HarVM] data'))||{})

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
		const match = command.match(commandParser)
		if (!match) return `Invalid syntax; command names may only contain letters, numbers, and underscores.`
		const [matched, commandName, subCommandName] = match
		let commandFn, unparsedArgs
		const commandGroup = commands[commandName]
		if (commandGroup) {
			// Not using `hasOwnProperty` because Rollup's module object has no prototype,
			// but this also means that obj['toString'] etc won't be a problem anyways epic
			if (commandGroup[subCommandName]) {
				commandFn = commandGroup[subCommandName]
				unparsedArgs = command.slice(matched.length).trim()
			} else if (commandGroup.default) {
				commandFn = commandGroup.default
				unparsedArgs = command.slice(commandName.length).trim()
			} else {
				return subCommandName
					? `Unknown subcommand \`${commandName} ${subCommandName}\`.`
					: `This command requires a subcommand.`
			}
		} else if (aliases.has(commandName)) {
			// Another benefit of putting all this in `runCommand` is that we can
			// recursively call
			// BUG: This setup may have a vulnerability where setting an alias to
			// itself will cause a maximum call size limit reached error
			return await runCommand(aliases.get(commandName) + command.slice(commandName.length), context)
		} else {
			return `Unknown command \`${command}\``
		}
		// Commands can return a string for an error message I guess
		return await commandFn({
			client,
			unparsedArgs,
			msg,
			reply: (...args) => reply(msg, ...args),
			aliasUtil,
			// Is this a good idea? lol
			run: command => runCommand(command, context)
		})
  }

  client.on('message', async msg => {
    if (!msg.author.bot) {
      if (msg.content.startsWith(client.prefix)) {
				const error = await runCommand(msg.content.slice(client.prefix.length), {
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
					.catch(err => {
						// If there's a runtime error I guess we can also report it
						return err.stack
					})
				// TODO: Probably can make this more sophisticated by indicating that it should
				// have a red stripe etc
        if (error) reply(msg, error)
      }
    }
  })

  client.login(token)
}
