function collect ({ client, msg, reply }) {
	client.data.user[msg.author.id]
}

function data ({ client, reply }) {
	reply('```\n' + JSON.stringify(client.data) + '\n```')
}

function args ({ unparsedArgs, reply }) {
	reply('```\n' + unparsedArgs + '\n```')
}

function main ({ reply }) {
	reply('hi')
}

export { random, args, data}
export default main
