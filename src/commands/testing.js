import { simpleArgumentParser } from '../utils/parsers.js'

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

function get ({ client, unparsedArgs, reply }) {
	reply('```\n' + JSON.stringify(client.data.get({args:unparsedArgs})) + '\n```')
}

function set ({ client, unparsedArgs, reply }) {
	unparsedArgs = unparsedArgs.split(/\s+/)
	client.data.set({args:unparsedArgs.slice(1)}, unparsedArgs[0])
	reply('success')
}

function main ({ reply, unparsedArgs }) {
	reply('hi```\n' + unparsedArgs + '\n```')
}

export { collect, args, data, get, set, simple }
export default main
