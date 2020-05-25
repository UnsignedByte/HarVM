function random ({ reply }) {
	reply('4')
}

function args ({ unparsedArgs, reply }) {
	reply('```\n' + unparsedArgs + '\n```')
}

function main ({ reply }) {
	reply('hi')
}

export { random, args }
export default main
