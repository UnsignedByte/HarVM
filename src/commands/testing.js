function random ({ msg }) {
	msg.channel.send('4')
}

function args ({ args, msg }) {
	msg.channel.send('```' + args + '```')
}

function main ({ msg }) {
	msg.channel.send('Available commands: ' + Object.keys(module.exports))
}

module.exports = { random, args, default: main }
