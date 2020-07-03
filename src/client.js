import * as commands from './commands.js'
import dataManager from './utils/data_manager.js'
import authorize from './utils/authorize.js'
import {Parser, ParserError} from './utils/parsers.js'

export default async function main (token, Discord) {
	const { Client } = Discord

	// Create an instance of a Discord client
	const client = new Client()

	client.data = await dataManager();
	client.commands = commands

	const aliases = new Map(client.data.get({args:['aliases'],def:[]}))
	const aliasUtil = {
		aliases,
		saveAliases () {
			client.data.set({ args: ['aliases'] }, [...aliases])
			return client.data.save()
		}
	}

	client.on('ready', () => {
		console.log('ready')
	})

	const commandParser = /^(\s*\w+)(?:\s+(\w+))?/

	// TODO: We can make this fancier by making a standard embed response thing
	function reply (msg, message, {
		error = false,
		fields = [],
		title = 'Hi,'
	} = {}) {
		return msg.channel.send('', {
			embed: {
				title,
				description: message,
				fields,
				color: error ? 0xff0000 : null, // TODO: Better colours lol
				footer: {
					text: `Requested by ${msg.author.tag}`,
					icon_url: msg.author.displayAvatarURL({
						format: 'png',
						dynamic: true
					})
				},
				timestamp: new Date().toISOString()
			}
		})
	}

	// Allows for batch calling in the future
	async function runCommand (command, context) {
		context.calls++
		// We can check if the user has gone over their call limit here
		const { msg } = context
		if (!command) {
			return {
				message: 'Tip: do \`help commands\` for a list of commands.',
				trace: ['@empty', ...context.trace],
				prefixIgnore: true
			}
		}
		const match = command.match(commandParser)
		if (!match) {
			return {
				message: 'Invalid syntax; command names may only contain letters, numbers, and underscores.',
				trace: [command.length > 20 ? command.slice(0, 15) + '...' : command, ...context.trace],
				prefixIgnore: true
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
			return await runCommand(aliases.get(commandName) + command.slice(rawCommandName.length), context)
		} else {
			return {
				message: `Unknown command \`${commandName}\`. Do \`help commands\` for a list of commands.`,
				trace: [`@unknown/${commandName}`, context.trace],
				prefixIgnore: true
			}
		}
		let parser
		const bridge = {
			Discord,
			client,
			unparsedArgs,
			//Parse args using the parser for the given command; return undefined if no parser exists
			get args() {
				if (!parser) parser = commandFn.parser||new Parser()
				return parser.parse(unparsedArgs, context.env)
			},
			get auth() {
				let authorized = authorize(Discord, msg, commandFn.auth)
				if (!authorized) throw new Error(`Insufficient Permissions to Run Command. The following permissions are required for authorization:\n\`${commandFn.auth.join('`\n`')}\``)
			},
			msg,
			env: context.env,
			reply: (...args) => reply(msg, ...args),
			aliasUtil,
			trace: context.trace,
			// Is this a good idea? lol
			run: command => {
				// Clone `trace` lol
				const { trace, prefixIgnore: _, ...otherContext } = context
				return runCommand(command, { trace: [...trace], ...otherContext })
			}
		}
		try {
			// Commands should return { message, trace } for an error message
			return await commandFn(bridge)
		} catch (err) {
			if (err instanceof ParserError) {
				return {
					message: `There was a problem parsing the arguments for the command:\n${
						err.message
					}\n\nTo use the command, refer to its syntax:\n${
						parser.toString()
					}`,
					trace: context.trace
				}
			} else {
				const id = Math.random().toString(36).slice(2)
				console.log(id, err)
				return { message: err.message, runtime: true, id, trace: context.trace }
			}
		}
	}

	function removePrefix (message) {
		const prefix = client.data.get({args:['prefix']})
		if (message.startsWith(prefix)) {
			return {
				command: message.slice(prefix.length),
				directMention: false
			}
		}
		const match = message.match(new RegExp(`^<@!?${client.user.id}>`))
		if (match) {
			return {
				command: message.slice(match[0].length),
				directMention: true
			}
		}
		return { command: null, directMention: false }
	}

	client.on('message', async msg => {
		if (!msg.author.bot) {
			const { command, directMention } = removePrefix(msg.content)
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
				if (error) {
					if (typeof error === 'string') {
						reply(msg, error, { error: true })
					} else if (error.runtime) {
						if (error.trace) {
							reply(
								msg,
								[
									`A JavaScript runtime error occurred (id \`${error.id}\`):`,
									error.message,
									'',
									'**Trace**',
									error.trace.join('\n') || '[Top level]'
								].join('\n'),
								{ error: true }
							)
						} else {
							reply(
								msg,
								[
									`A JavaScript runtime error occurred (id \`${error.id}\`):`,
									error.message
								].join('\n'),
								{ error: true }
							)
						}
					} else if (error.trace) {
						// Only send a direct non prefixIgnore error if bot is directly
						// mentioned (#22)
						if (!error.prefixIgnore || directMention || error.trace.length > 1) {
							reply(
								msg,
								[
									'A problem occurred:',
									error.message,
									'',
									'**Trace**',
									error.trace.join('\n') || '[Top level]'
								].join('\n'),
								{ error: true }
							)
						}
					}
				}
			}
		}
	})

	await client.login(token)
}
