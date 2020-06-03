// Basically the same as the control blocks in Scratch lol

import { BashlikeArgumentParser } from '../utils/parsers.js'

const ifParser = new BashlikeArgumentParser([
	{ name: 'values', aliases: ['...'], validate: 'isArray' }
])
function ifCondition ({ unparsedArgs, env, run }) {
	const { values } = ifParser.parse(unparsedArgs, env)
	for (let i = 0; i < values.length; i += 1) {
		if (i === values.length - 1) {
			// If it's the last item in the array, then it's the else code.
			return run(values[i])
		} else {
			// Empty string is assumed to be false
			if (values[i]) {
				return run(values[i + 1])
			}
		}
	}
}

// Could add loops here too, uauau

export {
	ifCondition as if
}
