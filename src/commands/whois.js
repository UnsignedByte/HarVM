import { SimpleArgumentParser, BashlikeArgumentParser } from '../utils/parsers.js'
import * as resolve from '../utils/client-resolve.js'
import { fetchDirectory } from '../utils/directory.js'
import identity from '../utils/identity.js'

function whois ({ args, reply, client, msg, trace }) {
	const whois = client.data.get({ args: ['whois'], def: null })
	if (!whois) {
		return { message: 'No whois information available. Do \`whois help\` for more information.', trace }
	}
	// Maybe should do resolve.member so command only works in the server? idk
	const userId = resolve.memberId(msg, args.user)
	if (!userId) {
		return { message: `Don't know to whom \`${args.user}\` refers.`, trace }
	}
	if (!whois.hasOwnProperty(userId)) {
		return { message: `<@${userId}> doesn't have an entry in the spreadsheet. (Tip: Have the server managers run \`whois fetch\` yet?)`, trace }
	}
	return reply(`Information about <@${userId}>`, {
		fields: Object.entries(whois[userId])
			.map(([col, value]) => value ? { name: col, value, inline: true } : null)
			.filter(identity)
	})
}
whois.parser = new SimpleArgumentParser({
	user: '<user>'
})

function help ({ reply }) {
	reply(`Use \`whois <user>\` to get information about the given user.\n\nServer managers will have to first link the whois information with a .tsv of URL. Do \`whois fetch -h\` for more information.`)
}

async function fetch ({ args, reply, client, trace }) {
	if (args.help) {
		return reply(fetch.parser.toString())
	}
	const {
		url = client.data.get({ args: ['whois_last_url'], def: null }),
		id = client.data.get({ args: ['whois_last_id'], def: null })
	} = args
	if (!url) {
		return { message: 'No URL (`-u`) given, nor has it been given before. (Do `whois fetch -h` for more info.)', trace }
	}
	if (!id) {
		return { message: 'No ID column name (`-i`) given, nor has it been given before. (Do `whois fetch -h` for more info.)', trace }
	}
	const whois = await fetchDirectory(url, id)
	client.data.set({ args: ['whois'] }, whois)
	client.data.set({ args: ['whois_last_url'] }, url)
	client.data.set({ args: ['whois_last_id'] }, id)
	await client.data.save()
	return reply(`Fetched! ${Object.keys(whois).length - 1} entries found.`)
}
fetch.auth = ['manage guild']
fetch.parser = new BashlikeArgumentParser([
	{
		name: 'help',
		aliases: ['h', '?'],
		description: 'Gives this help text.',
		optional: true
	},
	{
		name: 'url',
		aliases: ['u'],
		validate: 'isString',
		description: 'The URL of the .tsv data. Omit this option to use the previously used URL.',
		optional: true
	},
	{
		name: 'id',
		aliases: ['i'],
		validate: 'isString',
		description: 'The column name containing Discord user IDs. This is used to match members to entries in the spreadsheet.',
		optional: true
	}
], 'Fetches spreadsheet .tsv data from a URL and other information about users. The first row should be the names of each column. Option values are stored after the first call, so you can run `whois fetch` to update the data.\n\nIf fetching from a Google Sheet, you can use the URL `https://docs.google.com/spreadsheets/d/e/<ID>/pub?single=true&output=tsv`.')

export {
	help,
	fetch
}
export default whois
