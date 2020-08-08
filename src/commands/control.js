// Basically the same as the control blocks in Scratch lol

import { BashlikeArgumentParser, SimpleArgumentParser } from '../utils/parsers.js'

ifCondition.parser = new BashlikeArgumentParser([
	{ name: 'values', aliases: ['...'], validate: 'isArray' }
])
function ifCondition ({ args, env, run }) {
	const { values } = args
	for (let i = 0; i < values.length; i += 2) {
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

async function cond ({ args: { commands }, run, env }) {
	for (let i = 0; i < commands.length; i += 2) {
		if (i === commands.length - 1) {
			// If it's the last item in the array, then it's the else code.
			return run('batch ' + env.get(commands[i]))
		} else {
			// Error is assumed to be false
			const err = await run(commands[i])
			if (!err) {
				return run('batch ' + env.get(commands[i + 1]))
			}
		}
	}
}
cond.parser = new BashlikeArgumentParser([
	{ name: 'commands', aliases: ['...'], validate: 'isArray' }
])

async function each ({ args: { line: lineVar, lines: linesVar, command }, run, env }) {
	const lines = env.get(linesVar)
	if (lines) {
		for (const line of lines.split(/\r?\n/)) {
			env.set(lineVar, line)
			const err = await run(command)
			if (err) return err
		}
	}
}
each.parser = new SimpleArgumentParser({
	main: '<line> in <lines> do <command>'
}, null, 'Sets the variable given as `line` to each line in `lines` and then runs `command`.')

export default function main ({ reply }) {
	reply('Usage: control [if|cond|each] ...')
}

export {
	ifCondition as if,
	cond,
	each
}
