function random ({ reply }) {
	reply('4')
}

function args ({ unparsedArgs, reply }) {
	reply('```\n' + unparsedArgs + '\n```')
}

function main ({ reply }) {
	reply('Available commands: ' + Object.keys(module.exports))
}

module.exports = { random, args, default: main }
