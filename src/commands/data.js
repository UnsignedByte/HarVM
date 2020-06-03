// PSUEDO CODE - I would like to implement a more clever argument parsing system in the future for this
// This is mostly for batching purposes, which I think will be quite interesting

import { BashlikeArgumentParser } from '../utils/parsers.js'

const setParser = new BashlikeArgumentParser([
	{ name: 'variable', aliases: ['>'], validate: 'isWord' },
	{ name: 'value', aliases: ['...'], validate: 'isArray', transform: ([value]) => value }
])
function set ({ unparsedArgs, env }) {
	const { variable, value } = setParser.parse(unparsedArgs, env)
	// eg `data set 2 -> a` will set a to 2
	env.set(variable, value)
	// I'm not sure if these functions should log anything. It might be annoying
	// for batching, but we might also just supress output if batching
}

const opParser = new BashlikeArgumentParser([
	{ name: 'outputName', aliases: ['>'], validate: 'isWord' },
	{ name: 'varA', aliases: ['a'], validate: 'isWord' },
	{ name: 'varB', aliases: ['b'], validate: 'isWord' },
	{ name: 'operation', aliases: ['...'], validate: 'isArray', transform: ([op]) => op }
])
function op ({ unparsedArgs, env }) {
	const { outputName, operation, varA, varB } = opParser.parse(unparsedArgs, env)
	// eg `data op + -a a -b b -> c` will store a + b in c
	const a = +env.get(varA)
	const b = +env.get(varB)
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
	if (output !== undefined) env.set(outputName, output)
}

const runVarsParser = new BashlikeArgumentParser('expect-all')
const runParser = new BashlikeArgumentParser([
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
async function runCommand ({ unparsedArgs, run, env, trace }) {
	// eg `data run "data op -a a + -b b -> sum" "data log '\$(sum)'" -- -a 3 -b 4`
	// will log 7
	const { commands, withVars, ignoreError } = runParser.parse(unparsedArgs, env)
	console.log(commands, withVars, ignoreError)
	// If `withVars` is a string, there was a problem
	if (withVars) return { message: withVars, trace }
	for (const command of commands) {
		const error = await run(command)
		if (error && !ignoreError) return error
	}
}

const logParser = new BashlikeArgumentParser([
	{ name: 'output', aliases: ['...'], validate: 'isArray', transform: values => values.join('\n') }
])
function log ({ unparsedArgs, env, reply }) {
	const { output } = logParser.parse(unparsedArgs, env)
	return reply(output)
}

export {
	set,
	op,
	runCommand as run,
	log
}
