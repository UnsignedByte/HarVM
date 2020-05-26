function collect ({ client, msg, reply }) {
	reply(JSON.stringify(client.data.get({args:['user', msg.author.id]})))
}

function data ({ client, reply }) {
	reply('```\n' + JSON.stringify(client.data.raw()) + '\n```')
}

function args ({ unparsedArgs, reply }) {
	reply('```\n' + unparsedArgs + '\n```')
}

function get ({ client, unparsedArgs, reply }) {
	reply('```\n' + JSON.stringify(client.data.get({args:unparsedArgs})) + '\n```')
}

function set ({ client, unparsedArgs, reply }) {
	unparsedArgs = unparsedArgs.split(/\s+/)
	client.data.set({args:unparsedArgs.slice(1)}, unparsedArgs[0])
	reply('success')
}

function main ({ reply }) {
	reply('hi')
}

export { collect, args, data, get, set}
export default main
