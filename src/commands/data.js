// PSUEDO CODE - I would like to implement a more clever argument parsing system in the future for this
// This is mostly for batching purposes, which I think will be quite interesting

import { BashlikeArgumentParser, SimpleArgumentParser } from '../utils/parsers.js'

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
function op ({ args, env, trace }) {
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
		default:
			return {
				message: 'Invalid operation',
				trace
			}
	}
	if (output !== undefined) env.set(outputName, output)
}

function math ({ args: { type, a, b, out }, env, trace }) {
	let output
	switch (type) {
		case 'add':
		case 'addInt':
			output = a + b
			break
		case 'sub':
		case 'subInt':
			output = a - b
			break
		case 'mult':
		case 'multInt':
			output = a * b
			break
		case 'div':
		case 'divInt':
			output = a / b
			break
		case 'rem':
		case 'remInt':
			output = (a % b + b) % b
			break
		case 'expt':
		case 'exptInt':
			output = a ** b
			break
		default:
			return {
				message: 'Invalid operation',
				trace
			}
	}
	env.set(out, output.toString())
}
math.parser = new SimpleArgumentParser({
	addInt: '<out> bigint<a> plus bigint<b>',
	add: '<out> float<a> plus float<b>',
	subInt: '<out> bigint<a> minus bigint<b>',
	sub: '<out> float<a> minus float<b>',
	multInt: '<out> bigint<a> times bigint<b>',
	mult: '<out> float<a> times float<b>',
	divInt: '<out> bigint<a> divided by bigint<b>',
	div: '<out> float<a> divided by float<b>',
	remInt: '<out> remainder of bigint<a> divided by bigint<b>',
	rem: '<out> remainder of float<a> divided by float<b>',
	exptInt: '<out> bigint<a> to the power of bigint<b>',
	expt: '<out> float<a> to the power of float<b>'
})

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
	// console.log(commands, withVars, ignoreError)
	// If `withVars` is a string, there was a problem
	if (withVars) return { message: withVars, trace }
	for (const command of commands) {
		const error = await run(command)
		if (error && !ignoreError) return error
	}
}

async function params ({ args: { commands, params, values }, run, env }) {
	for (let i = 0; i < params.length; i++) {
		env.set(params[i], values[i] || '')
	}
	return await run(`batch ${env.get(commands)}`)
}
const paramValuesParser = new BashlikeArgumentParser([
	{
		name: '...',
		validate: 'isArray'
	}
])
const paramsExample = `\`\`\`py
@wrapper alias set divide "batch $(wrapper)"
	@main
		data op -a dividend / -b divisor -> quotient
		data log "$(dividend) / $(divisor) = $(quotient)"
	data params dividend divisor -c main --

# Outputs "6 / 3 = 2"
divide 6 3
\`\`\``
params.parser = new BashlikeArgumentParser([
	{
		name: 'commands',
		aliases: ['c'],
		validate: 'isString',
		description: 'The variable name containing the code to be run with `batch` after setting the parameter values.'
	},
	{
		name: 'params',
		aliases: ['...'],
		validate: 'isArray',
		description: 'The names of the parameters.'
	},
	{
		name: 'values',
		aliases: ['--'],
		validate: 'isString',
		transform: (unparsed, env) => paramValuesParser.parse(unparsed, env)['...'],
		description: 'The respective values of each parameter.'
	}
], `A convenience command for declaring aliased batch commands (ABCs) that support multiple parameters. Example:\n${paramsExample}`)

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
	log,
	params,
	math,
}
