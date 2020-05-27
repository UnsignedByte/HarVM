// PSUEDO CODE - I would like to implement a more clever argument parsing system in the future for this
// This is mostly for batching purposes, which I think will be quite interesting

import { bashlikeArgumentParser } from '../utils/parsers.js'

const setParser = bashlikeArgumentParser([
	{ name: 'variable', aliases: ['>'], validate: 'isWord' },
	{ name: 'value', aliases: ['...'], transform: ([value]) => value }
])
function set ({ unparsedArgs, temp }) {
	const { variable, value } = setParser.parse(unparsedArgs, temp)
	// eg `data set 2 -> a` will set a to 2
	temp.set(variable, value)
	// I'm not sure if these functions should log anything. It might be annoying
	// for batching, but we might also just supress output if batching
}

const opParser = bashlikeArgumentParser([
	{ name: 'outputName', aliases: ['>'], validate: 'isWord' },
	{ name: 'varA', aliases: ['a'], validate: 'isWord' },
	{ name: 'varB', aliases: ['b'], validate: 'isWord' },
	{ name: 'operation', aliases: ['...'], validate: 'isArray', transform: ([op]) => op }
])
function op ({ unparsedArgs, temp }) {
	const { outputName, operation, varA, varB } = opParser.parse(unparsedArgs, temp)
	// eg `data op + -a a -b b -> c` will store a + b in c
	const a = +temp.get(varA)
	const b = +temp.get(varB)
	let output
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
	console.log(output, outputName, temp)
	if (output !== undefined) temp.set(outputName, output)
}

const runVarsParser = bashlikeArgumentParser('expect-all')
const runParser = bashlikeArgumentParser([
	{
		name: 'withVars',
		aliases: ['--'],
		validate: 'isString',
		transform: (varValues, data) => {
			const values = runVarsParser.parse(varValues, data)
			for (const [varName, value] of Object.entries(values)) {
				if (/\w+/.test(varName)) {
					data.set(varName, value)
				} else if (varName !== '...') {
					return `\`${varName}\` is an invalid variable name.`
				}
			}
			return
		},
		optional: true
	},
	{ name: 'ignoreError', aliases: ['E'] },
	{ name: 'commands', aliases: ['...'], validate: 'isArray' }
])
async function runCommand ({ unparsedArgs, run, temp }) {
	// eg `data run "data op -a a + -b b -> sum" "data log '\$(sum)'" -- -a 3 -b 4`
	// will log 7
	const { commands, withVars, ignoreError } = runParser.parse(unparsedArgs, temp)
	console.log(commands, withVars, ignoreError)
	// If `withVars` is a string, there was a problem
	if (withVars) return withVars
	for (const command of commands) {
		const error = await run(command)
		if (error && !ignoreError) return error
	}
}

const logParser = bashlikeArgumentParser([
	{ name: 'output', aliases: ['...'], validate: 'isArray', transform: values => values.join('\n') }
])
function log ({ unparsedArgs, temp, reply }) {
	const { output } = logParser.parse(unparsedArgs, temp)
	console.log(output)
	return reply(output)
}

export {
	set,
	op,
	runCommand as run,
	log
}
