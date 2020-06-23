import { SimpleArgumentParser, BashlikeArgumentParser } from '../utils/parsers.js'
import * as resolve from '../utils/client-resolve.js'
import authorize from '../utils/authorize.js'

function collect ({ client, msg, reply }) {
	reply(JSON.stringify(client.data.get({args:['user', msg.author.id]})))
}

function data ({ client, reply }) {
	reply('```\n' + JSON.stringify(client.data.raw()) + '\n```')
}

function args ({ unparsedArgs, reply }) {
	reply('```\n' + unparsedArgs + '\n```')
}

simple.parser = new SimpleArgumentParser({
	main: '<required> [optional] keyboard',
	complex: 'complex int<requiredInt> float<requiredDouble> bool<requiredBool> customClass<testcustom> [optional]',
	alternative: 'keyword <required> [optional]',
	ellipsesint:'keybruh <test> customClass<nottest> int...',
	ellipses:'keybruh <test> <nottest> ...'
}, {
	customClass: value => `LMAO this was ur VALUE ${value}`
})
function simple ({ args, reply }) {
	reply('```json\n' + JSON.stringify(args, null, 2) + '\n```')
}

sh.parser = new BashlikeArgumentParser()
function sh ({ args, reply }) {
	if (args.h || args.help) {
		reply(sh.parser.toString())
	} else {
		reply('```json\n' + JSON.stringify(args, null, 2) + '\n```')
	}
}

resolveThing.parser = new SimpleArgumentParser({
	member: 'member <member>',
	user: 'user <user>',
	role: 'role <role>',
	channel: 'channel <channel> [count]'
})
async function resolveThing ({ client, msg, args, trace, reply, Discord }) {
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
			case 'channel': {
				const channel = resolve.channel(msg, args.channel)
				if (channel) {
					if (channel instanceof Discord.TextChannel) {
						const count = +args.count || 1
						const messages = await channel.messages.fetch({ limit: count })
						reply(messages.map(msg => `**[${msg.author.tag}]** ${msg.content}`).join('\n'))
					} else {
						reply(`that is ${channel.type} channel`)
					}
				} else {
					return {
						message: `I don't know to what "${args.channel}" refers.`,
						trace
					}
				}
			}
		}
	} else {
		return { message: 'Invalid syntax.', trace }
	}
}

makeManageRolesRole.parser = new SimpleArgumentParser({
	main: 'Let us perhaps synthesize a role by the name of <name> with the special and rare ability to manage roles'
})
async function makeManageRolesRole ({ msg, args: { name }, reply }) {
	await msg.guild.roles.create({
		data: {
			name,
			color: 'RANDOM',
			permissions: ['MANAGE_ROLES']
		},
		reason: 'Why not?'
	})
	reply('Sure!')
}

function get ({ client, args: { ['...']: args }, reply }) {
	reply('```\n' + JSON.stringify(client.data.get({args})) + '\n```')
}
get.parser = new SimpleArgumentParser({main:'...'})

async function set ({ client, args: { ['...']: parsedArgs }, reply }) {
	const [value, ...args] = parsedArgs
	await client.data.set({args}, value)
	reply('success')
}
set.parser = new SimpleArgumentParser({main:'...'})

function save({client, reply}){
	client.data.save();
	reply('saved!')
}

// Asserts authorization and returns an error if authorization fails
auth.parser = new SimpleArgumentParser({main:'...'})
function auth({Discord, msg, reply, args, trace}){
	if (!authorize(Discord, msg, args['...'])){
		return {
			message: `Insufficient permissions; expected at least one of the following permissions: ${args['...'].join(', ')}.`,
			trace
		}
	}
}

adminOnly.auth = ['administrator']
function adminOnly({reply, auth}){
		reply('omg u made it')
}

function main ({ reply, unparsedArgs }) {
	reply('Usage: testing [collect|data|args|simple|sh|resolve|makeManageRolesRole|get|set|save|auth|adminOnly] ...' +
		'\n```\n' + unparsedArgs + '\n```')
}

export {
	collect,
	args,
	data,
	get,
	set,
	simple,
	sh,
	save,
	resolveThing as resolve,
	auth,
	adminOnly,
	makeManageRolesRole
}
export default main
