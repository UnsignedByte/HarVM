import { SimpleArgumentParser, BashlikeArgumentParser } from '../utils/parsers.js'
import * as resolve from '../utils/client-resolve.js'

function collect ({ client, msg, reply }) {
	reply(JSON.stringify(client.data.get({args:['user', msg.author.id]})))
}

function data ({ client, reply }) {
	reply('```\n' + JSON.stringify(client.data.raw()) + '\n```')
}

function args ({ unparsedArgs, reply }) {
	reply('```\n' + unparsedArgs + '\n```')
}

const parser = new SimpleArgumentParser({ main: '<required> [optional] keyboard', alternative: 'keyword <required> [optional]' })
function simple ({ unparsedArgs, reply }) {
	const args = parser.parse(unparsedArgs)
	if (args) {
		reply('```json\n' + JSON.stringify(args, null, 2) + '\n```')
	} else {
		reply('Your arguments should be in the form\n`' + parser.toString().join('`\n`')+'`')
	}
}

const bashlikeParser = new BashlikeArgumentParser()
function sh ({ unparsedArgs, reply }) {
	try {
		const args = bashlikeParser.parse(unparsedArgs)
		reply('```json\n' + JSON.stringify(args, null, 2) + '\n```')
	} catch (err) {
		// Don't need stack trace I think
		return err.message
	}
}

const userParser = simpleArgumentParser({
	member: 'member <member>',
	user: 'user <user>',
	role: 'role <role>'
})
function user ({ client, msg, unparsedArgs, trace, reply }) {
	const args = userParser.parse(unparsedArgs)
	if (args) {
		switch (args.type) {
			case 'member': {
				const member = resolve.member(msg, args.member)
				if (member) {
					reply(`Their displayHexColor is ${member.displayHexColor}.`)
				} else {
					return {
						message: `I don't know to whom "${args.member}" refers.`,
						trace
					}
				}
			}
			case 'user': {
				const user = resolve.user(client, args.user)
				if (user) {
					reply(`Their avatar URL is ${
						user.displayAvatarURL({ dynamic: true, size: 4096, format: 'png' })
					} (default: ${user.defaultAvatarURL}).`)
				} else {
					return {
						message: `I don't know to whom "${args.user}" refers.`,
						trace
					}
				}
			}
			case 'role': {
				const role = resolve.role(msg, args.role)
				if (role) {
					reply(`The role's colour is https://sheeptester.github.io/colour/${role.hexColor}`)
				} else {
					return {
						message: `I don't know to what "${args.role}" refers.`,
						trace
					}
				}
			}
		}
	} else {
		return { message: 'Invalid syntax.', trace }
	}
}

function get ({ client, unparsedArgs, reply }) {
	const args = unparsedArgs.split(/\s+/).filter(arg => arg)
	reply('```\n' + JSON.stringify(client.data.get({args})) + '\n```')
}

async function set ({ client, unparsedArgs, reply }) {
	const [value, ...args] = unparsedArgs.split(/\s+/)
	await client.data.set({args}, value)
	reply('success')
}

function main ({ reply, unparsedArgs }) {
	reply('hi```\n' + unparsedArgs + '\n```')
}

export {
	collect,
	args,
	data,
	get,
	set,
	simple,
	sh,
	user
}
export default main
