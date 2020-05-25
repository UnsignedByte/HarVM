const {
	Client
} = require('discord.js')

const commands = {
	testing: require('./commands/testing.js')
}

const { token } = require('./token.json')

const client = new Client()

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`)
})

const commandParser = /^<@!?\d+>\s*(\w+)(?:\s+(\w+))?\s*/

client.on('message', msg => {
	if (!msg.author.bot && msg.mentions.has(client.user)) {
		const match = msg.content.match(commandParser)
		if (match) {
			const [matched, commandName, subCommandName] = match
			const command = commands[commandName]
			if (command) {
				const subCommand = command[subCommandName] || command.default
				if (subCommand) {
					return subCommand({
						client,
						args: msg.content.slice(match.index + matched.length),
						msg
					})
				}
			}
			msg.reply('Do not know that command lol')
		} else {
			msg.reply('invalid syntax (but still will give help ig)')
		}
	}
})

client.login(token)
