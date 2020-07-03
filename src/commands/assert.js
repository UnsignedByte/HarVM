import { SimpleArgumentParser, BashlikeArgumentParser } from '../utils/parsers.js'
import authorize from '../utils/authorize.js'

// Asserts authorization and returns an error if authorization fails
auth.parser = new SimpleArgumentParser({main:'...'})
function auth({Discord, msg, reply, args, trace}){
	if (!authorize(Discord, msg, args['...'])){
		return {
			message: `Insufficient permissions; expected at least one of the following permissions: ${args['...'].join(', ')}.`,
			trace
		}
	}
}

function range ({ args: { value, lowX = null, low = null, highX = null, high = null }, trace }) {
	value = +value
	if (lowX !== null && value <= +lowX) return { message: 'Value too low', trace }
	if (low !== null && value < +low) return { message: 'Value too low', trace }
	if (highX !== null && value >= +highX) return { message: 'Value too high', trace }
	if (high !== null && value > +high) return { message: 'Value too high', trace }
}
range.parser = new BashlikeArgumentParser([
	{
		name: 'value',
		aliases: ['v'],
		validate: 'isNumber',
		description: 'Value to test'
	},
	{
		name: 'lowX',
		aliases: ['l'],
		validate: 'isNumber',
		description: 'Lower bound (exclusive)',
		optional: true
	},
	{
		name: 'low',
		aliases: ['L'],
		validate: 'isNumber',
		description: 'Lower bound (inclusive)',
		optional: true
	},
	{
		name: 'highX',
		aliases: ['h'],
		validate: 'isNumber',
		description: 'Upper bound (exclusive)',
		optional: true
	},
	{
		name: 'high',
		aliases: ['H'],
		validate: 'isNumber',
		description: 'Upper bound (inclusive)',
		optional: true
	}
], 'Returns an error if the given value is not within the specified range.')

async function ok ({ run, args: { command, var: varName }, env }) {
	const err = await run(command)
	if (varName) {
		// Empty strings are considered false
		env.set(varName, err ? '' : 'ok')
	}
}
ok.parser = new SimpleArgumentParser({
	store: 'store <command> in <var>',
	try: 'try <command>'
})

export {
	auth,
	range,
	ok,
}

export default function main ({ reply }) {
	return reply('assert [auth|range|ok] ...')
}
