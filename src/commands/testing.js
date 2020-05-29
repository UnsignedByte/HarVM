import { simpleArgumentParser, bashlikeArgumentParser } from '../utils/parsers.js'

function collect ({ client, msg, reply }) {
	reply(JSON.stringify(client.data.get({args:['user', msg.author.id]})))
}

function data ({ client, reply }) {
	reply('```\n' + JSON.stringify(client.data.raw()) + '\n```')
}

function args ({ unparsedArgs, reply }) {
	reply('```\n' + unparsedArgs + '\n```')
}

const parser = simpleArgumentParser({ main: '<required> [optional] keyboard', alternative: 'keyword <required> [optional]' })
function simple ({ unparsedArgs, reply }) {
	const args = parser.parse(unparsedArgs)
	if (args) {
		reply('```json\n' + JSON.stringify(args, null, 2) + '\n```')
	} else {
		reply('Your arguments should be in the form ' + parser.syntax
			.map(option => `\`${option}\``)
			.join(' or '))
	}
}

const bashlikeParser = bashlikeArgumentParser()
function sh ({ unparsedArgs, reply }) {
	try {
		const args = bashlikeParser.parse(unparsedArgs)
		reply('```json\n' + JSON.stringify(args, null, 2) + '\n```')
	} catch (err) {
		// Don't need stack trace I think
		return err.message
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

export { collect, args, data, get, set, simple, sh }
export default main
