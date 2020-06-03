import { SimpleArgumentParser, BashlikeArgumentParser } from '../utils/parsers.js'

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
		// reply('Your arguments should be in the form\n' + parser.options
		// 	.map(({name, syntax}) => `\`${name}:${JSON.stringify(syntax)}\``)
		// 	.join('\n'))
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
