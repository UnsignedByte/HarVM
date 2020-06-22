import { isNode } from '../utils/node.js'
import { BashlikeArgumentParser } from '../utils/parsers.js'

function main ({ reply }) {
	reply('Usage: `mcserver [status]`')
}

export default main

let mcproto

async function status ({
	client,
	args: { help, setDefault, host, port = 25565 },
	reply,
	trace
}) {
	if (help) {
		return reply('Get the status of a Minecraft server. It uses the [`mcproto`](https://github.com/janispritzkau/mcproto) library, which only works in Node. ' +
			(isNode() ? 'Fortunately, the bot is running on Node, so this will work.' : 'Unfortunately, the bot is not running on Node, so this command will not work.') +
			'\n\n' +status.parser.toString())
	}
	if (!isNode()) {
		return {
			message: 'Will not be able to fetch server information (because the bot is not being hosted on Node).',
			trace
		}
	}
	port = +port
	if (host) {
		if (setDefault) {
			client.data.set({ args: ['minecraft', 'default'] }, { host, port, set: true })
			await client.data.save()
		}
	} else {
		if (setDefault) {
			return {
				message: 'You must give a hostname when setting the default server',
				trace
			}
		} else {
			const get = client.data.get(['minecraft', 'default'])
			if (!get || !get.set) {
				return {
					message: 'No default server set. Do `mcserver status --help` for a list of arguments.',
					trace
				}
			} else {
				;({ host, port } = get)
			}
		}
	}

	if (!mcproto) mcproto = (await import('mcproto')).default
	const { Client, PacketWriter, State } = mcproto

	// https://github.com/janispritzkau/mcproto#server-list-ping
	const mcClient = await Client.connect(host, port)

	mcClient.send(new PacketWriter(0x0).writeVarInt(404)
		.writeString(host).writeUInt16(port)
		.writeVarInt(State.Status))

	mcClient.send(new PacketWriter(0x0))

	const response = await mcClient.nextPacket(0x0)
	const { players: { online, max, sample = [] } } = response.readJSON()

	reply(`__**${online}**/${max}__\n${
		sample.map(({ id, name }) =>
			`[\`${name}\`](https://minotar.net/armor/body/${id}/100.png)`)
			.join('\n') || 'No one\'s on :('
	}${setDefault ? '\n(Defaults saved)' : ''}`)

	mcClient.end()
}
status.parser = new BashlikeArgumentParser([
	{
		name: 'help',
		aliases: ['h', '?'],
		description: 'Print argument information (this thing)'
	},
	{
		name: 'setDefault',
		aliases: ['d', 'set-default', 'default'],
		description: 'Set the given host and port as the default.'
	},
	{
		name: 'host',
		aliases: ['H'],
		validate: 'isString',
		description: 'Minecraft server host name (eg hypixel.net)',
		optional: true
	},
	{
		name: 'port',
		aliases: ['P'],
		// Current validation system is non ideal
		validate: 'isString',
		description: 'Minecraft server port (eg 25565)',
		optional: true
	}
])

export {
	status
}
