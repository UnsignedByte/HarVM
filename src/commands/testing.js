function random ({ reply }) {
	reply('4')
}

function args ({ unparsedArgs, reply }) {
	reply('```\n' + unparsedArgs + '\n```')
}

function main ({ reply }) {
	reply('Available commands: ' + Object.keys(module.exports))
}


export { random, args }
export default main
