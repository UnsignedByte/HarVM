import * as commands from './commands.js'
import DataManager from './utils/data_manager.js'
import * as storage from './utils/storage.js'

export default async function main (token, Discord) {
	const { Client } = Discord

	// Create an instance of a Discord client
	const client = new Client()

	await storage.ready
	client.prefix = await storage.getItem('[HarVM] prefix')
	client.data = new DataManager(JSON.parse(await storage.getItem('[HarVM] data'))||{})

	const aliases = new Map(JSON.parse(await storage.getItem('[HarVM] aliases')) || [])
	const aliasUtil = {
		aliases,
		saveAliases () {
			return storage.setItem('[HarVM] aliases', JSON.stringify([...aliases]))
		}
	}

	client.on('ready', () => {
		if (typeof client.prefix !== 'string') {
			client.prefix = new RegExp(`^<@!?${client.user.id}>`)
		}
		console.log('ready')
	})

	const commandParser = /^(\s*\w+)(?:\s+(\w+))?/

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
		if (!match) {
			return {
				message: `Invalid syntax; command names may only contain letters, numbers, and underscores.`,
				trace: [command.length > 20 ? command.slice(0, 15) + '...' : command, ...context.trace]
			}
		}
		const [matched, rawCommandName, subCommandName] = match
		const commandName = rawCommandName.trim()
		let commandFn, unparsedArgs
		const commandGroup = commands[commandName]
		if (commandGroup) {
			// Not using `hasOwnProperty` because Rollup's module object has no prototype,
			// but this also means that obj['toString'] etc won't be a problem anyways epic
			if (commandGroup[subCommandName]) {
				commandFn = commandGroup[subCommandName]
				unparsedArgs = command.slice(matched.length).trim()
				context.trace.unshift(`${commandName}/${subCommandName}`)
			} else if (commandGroup.default) {
				commandFn = commandGroup.default
				unparsedArgs = command.slice(rawCommandName.length).trim()
				context.trace.unshift(`${commandName}/@default`)
			} else {
				return {
					message: subCommandName
						? `Unknown subcommand \`${commandName} ${subCommandName}\`.`
						: `This command requires a subcommand.`,
					trace: context.trace
				}
			}
		} else if (aliases.has(commandName)) {
			context.trace.unshift(`@alias/${commandName}`)
			// Another benefit of putting all this in `runCommand` is that we can
			// recursively call
			// BUG: This setup may have a vulnerability where setting an alias to
			// itself will cause a maximum call size limit reached error
			return await runCommand(aliases.get(commandName) + command.slice(commandName.length), context)
		} else {
			return {
				message: `Unknown command \`${command}\`.`,
				trace: context.trace
			}
		}
		// Commands can return a string for an error message I guess
		return await commandFn({
			client,
			unparsedArgs,
			msg,
			env: context.env,
			reply: (...args) => reply(msg, ...args),
			aliasUtil,
			trace: context.trace,
			// Is this a good idea? lol
			run: command => {
				// Clone `trace` lol
				const { trace, ...otherContext } = context
				return runCommand(command, { trace: [...trace], ...otherContext })
			}
		})
	}

	function removePrefix (message) {
		const prefix = client.prefix
		if (typeof prefix === 'string') {
			if (message.startsWith(prefix)) return message.slice(prefix.length)
		} else if (prefix instanceof RegExp) {
			const match = message.match(prefix)
			if (match) {
				return message.slice(match[0].length)
			}
		}
		return null
	}

	client.on('message', async msg => {
		if (!msg.author.bot) {
			const command = removePrefix(msg.content)
			if (command !== null) {
				const error = await runCommand(command, {
					msg,
					// `env` is for storing variables in case we want to do that
					// in the future, lol
					// Using a map in case someone uses `__proto__` or something dumb
					// as a variable name
					env: new Map(),
					// Keep track of calls (in case it recurses); this way, we can "charge"
					// people for how many commands they run to discourage complex
					// computations
					calls: 0,
					trace: []
				})
					.catch(err => {
						const id = Math.random().toString(36).slice(2)
						console.log(id, err)
						// If there's a runtime error I guess we can also report it
						return { message: err.message, runtime: true, id }
					})
				// TODO: Probably can make this more sophisticated by indicating that it should
				// have a red stripe etc
				if (error) {
					if (typeof error === 'string') {
						reply(msg, error)
					} else if (error.runtime) {
						reply(msg, `A JavaScript runtime error occurred (id ${error.id}):\n${error.message}`)
					} else if (error.trace) {
						reply(msg, `A problem occurred:\n${error.message}\n\n**Trace**\n${error.trace.join('\n') || '[Top level]'}`)
					}
				}
			}
		}
	})

	await client.login(token)
}
