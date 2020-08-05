import { BashlikeArgumentParser, SimpleArgumentParser } from '../utils/parsers.js'
import * as resolve from '../utils/client-resolve.js'

async function dm ({ args: { message, recipient }, client, msg }) {
	recipient = resolve.user(client, recipient)
	await recipient.send('', {
		embed: {
			title: 'You\'ve received a love letter!',
			description: message,
			footer: {
				text: `From ${msg.author.tag}`,
				icon_url: msg.author.displayAvatarURL({
					format: 'png',
					dynamic: true
				})
			},
			timestamp: new Date().toISOString()
		}
	})
}
dm.parser = new BashlikeArgumentParser([
	{
		name: 'message',
		aliases: ['m'],
		validate: 'isString',
		description: 'Message to direct message.'
	},
	{
		name: 'recipient',
		aliases: ['@', 't', '2', 'to'],
		validate: 'isString',
		description: 'The user to whom the message should be sent.'
	}
], 'Send a direct message to a user.')

function executor ({ args: { target }, env, msg }) {
	env.set(target, msg.author.toString())
}
executor.parser = new BashlikeArgumentParser([
	{
		name: 'target',
		aliases: ['>'],
		validate: 'isString',
		description: 'Variable to store the value in.'
	}
], 'Store the @mention of the user running the command in a variable. Example: `user executor -> me`.')

function compat ({ args: { userA, userB }, msg, reply, trace }) {
	userA = resolve.member(msg, userA)
	if (!userA) return { message: `Could not resolve the first person; are they on this server?`, trace }
	userB = resolve.member(msg, userB)
	if (!userB) return { message: `Could not resolve the second person; are they on this server?`, trace }
	// I can tolerate the loss of precision here from converting snowflakes to
	// floats
	const userAId = +userA.id
	const userBId = +userB.id
	reply(`${userA} and ${userB} are ${
		(1 / (Math.abs(userAId - userBId) / 2e17 + 1) * 100).toFixed(2)
	}% compatible!`)
}
compat.parser = new SimpleArgumentParser({
	main: '<userA> <userB>'
}, null, 'Determines how compatible two people are with each other.')

function ship ({ args: { userA, userB }, msg, reply, trace }) {
	userA = resolve.member(msg, userA)
	if (!userA) return { message: `Could not resolve the first person; are they on this server?`, trace }
	userB = resolve.member(msg, userB)
	if (!userB) return { message: `Could not resolve the second person; are they on this server?`, trace }
	reply(`${userA} x ${userB} -> 💞 **${
		// `slice` rounds down
		userA.displayName.slice(0, userA.displayName.length / 2) +
			userB.displayName.slice(userB.displayName.length / 2)
	}**`)
}
ship.parser = new SimpleArgumentParser({
	main: '<userA> <userB>'
}, null, 'Generate a portmanteau name for a couple. (This is not a commutative operation.)')

export {
	dm,
	executor,
	compat,
	ship
}
export default function main ({ reply }) {
	return reply('`user [` `dm` | `executor` | `compat` | `ship` `]` ...')
}
