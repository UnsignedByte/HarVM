// PSUEDO CODE - I would like to implement a more clever argument parsing system in the future for this
// This is mostly for batching purposes, which I think will be quite interesting

import { bashlikeArgumentParser } from '../utils/parsers.js'

const setParser = bashlikeArgumentParser([
	{ name: 'variable', aliases: ['>'], validate: 'isWord' }
])
export function set ({ unparsedArgs, temp }) {
	const { ['>']: variable, ['']: value } = parseArgs(unparsedArgs)
	// eg `data set 2 -> a` will set a to 2
	temp.set(variable, value)
	// I'm not sure if these functions should log anything. It might be annoying
	// for batching, but we might also just supress output if batching
}

export function op ({ unparsedArgs, temp }) {
	const { ['>']: outputName, ['']: operation, a: varA, b: varB } = parseArgs(unparsedArgs)
	// eg `data op + -a a -b b -> c` will store a + b in c
	const a = temp.get(varA)
	const b = temp.get(varB)
	let output = null
	switch (operation) {
		case '+':
			output = a + b
			break
		case '-':
			output = a - b
			break
		case '*':
			output = a * b
			break
		case '/':
			output = a / b
			break
		case '%':
			output = a % b
			break
		case '^':
			output = a ** b
			break
	}
	if (output !== null) temp.set(outputName, output)
}

export function run ({ unparsedArgs, run, temp }) {
	const { c: command, '': commandSource } = parseArgs(unparsedArgs)
	// eg `data run -c "data set 2 -> a"`
	if (command) {
		return run(command)
	} else {
		return run(temp.get(commandSource))
	}
}
