import { isNode } from './node.js'
import { BashlikeArgumentParser } from '../utils/parsers.js'

function main () {
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
	if (!isNode()) {
		return {
			message: 'Cannot fetch server information (because the bot is not being hosted on Node).',
			trace
		}
	}
	port = +port
	if (host) {
		if (setDefault) {
			if (!client.data.minecraft) client.data.minecraft = {}
			if (!client.data.minecraft.default) client.data.minecraft.default = {}
			client.data.minecraft.default.host = host
			client.data.minecraft.default.port = port
		}
	} else {
		if (setDefault) {
			return {
				message: 'You must give a hostname when setting the default server',
				trace
			}
		} else if (client.data.minecraft.default) {
			({ host, port }) = client.data.minecraft.default
		} else {
			return {
				message: 'No default server set. Do `mcserver status --help` for a list of arguments.',
				trace
			}
		}
	}

	if (!mcproto) mcproto = await import('mcproto')
	const { Client, PacketWriter, State } = mcproto

	// https://github.com/janispritzkau/mcproto#server-list-ping
	const client = await Client.connect(host, port)

	client.send(new PacketWriter(0x0).writeVarInt(404)
    .writeString(host).writeUInt16(port)
    .writeVarInt(State.Status))

	client.send(new PacketWriter(0x0))

	const response = await client.nextPacket(0x0)
	const { players: { online, max, sample } } = response.readJSON()

	reply(`__**${online}**/${max}__\n${
		sample.map(({ id, name }) =>
			`[\`${name}\`](https://minotar.net/armor/body/${id}/100.png)`)
			.join('\n')
	}`)

	client.end()
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
		description: 'Minecraft server host name (eg hypixel.net)'
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
