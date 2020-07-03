import { BashlikeArgumentParser } from '../utils/parsers.js'
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

export {
	dm,
	executor
}
export default function main ({ reply }) {
	reply('`user [` `dm` | `executor` `]`')
}
