// PSUEDO CODE - I would like to implement a more clever argument parsing system in the future for this
// This is mostly for batching purposes, which I think will be quite interesting

import { BashlikeArgumentParser } from '../utils/parsers.js'

set.parser = new BashlikeArgumentParser([
	{ name: 'variable', aliases: ['>'], validate: 'isWord' },
	{ name: 'value', aliases: ['...'], validate: 'isArray', transform: ([value]) => value }
])
function set ({ args, env }) {
	const { variable, value } = args
	// eg `data set 2 -> a` will set a to 2
	env.set(variable, value)
	// I'm not sure if these functions should log anything. It might be annoying
	// for batching, but we might also just supress output if batching
}

op.parser = new BashlikeArgumentParser([
	{ name: 'outputName', aliases: ['>'], validate: 'isWord' },
	{ name: 'varA', aliases: ['a'], validate: 'isWord' },
	{ name: 'varB', aliases: ['b'], validate: 'isWord' },
	{ name: 'operation', aliases: ['...'], validate: 'isArray', transform: ([op]) => op }
])
function op ({ args, env }) {
	const { outputName, operation, varA, varB } = args
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

runCommand.varsParser = new BashlikeArgumentParser('expect-all')
runCommand.parser = new BashlikeArgumentParser([
	{
		name: 'withVars',
		aliases: ['--'],
		validate: 'isString',
		transform: (varValues, data) => {
			const values = runCommand.varsParser.parse(varValues, data)
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
async function runCommand ({ args, run, env, trace }) {
	// eg `data run "data op -a a + -b b -> sum" "data log '\$(sum)'" -- -a 3 -b 4`
	// will log 7
	const { commands, withVars, ignoreError } = args
	console.log(commands, withVars, ignoreError)
	// If `withVars` is a string, there was a problem
	if (withVars) return { message: withVars, trace }
	for (const command of commands) {
		const error = await run(command)
		if (error && !ignoreError) return error
	}
}

log.parser = new BashlikeArgumentParser([
	{ name: 'output', aliases: ['...'], validate: 'isArray', transform: values => values.join('\n') }
])
function log ({ args, env, reply }) {
	const { output } = args
	return reply(output)
}

export default function main ({ reply }) {
	reply('Usage: data [set|op|run|log] ...')
}

export {
	set,
	op,
	runCommand as run,
	log
}
