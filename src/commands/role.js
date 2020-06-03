import { BashlikeArgumentParser } from '../utils/parsers.js'
import * as resolve from '../utils/client-resolve.js'
import identity from '../utils/identity.js'

const roleDistributionParser = new BashlikeArgumentParser([
	{
		name: 'roles',
		aliases: ['...'],
		validate: 'isArray'
	},
	{
		name: 'target',
		aliases: ['@', 't'],
		validate: 'isString'
	},
	{
		name: 'remove',
		aliases: ['r']
	}
])

async function give ({ msg, unparsedArgs, env, trace, reply }) {
	let parsedArgs
	try {
		parsedArgs = roleDistributionParser.parse(unparsedArgs, env)
	} catch (err) {
		return { message: err.message, trace }
	}
	const { roles, target, remove } = parsedArgs
	const member = resolve.member(msg, target)
	if (!member) {
		return { message: `Could not find the member "${target}"`, trace }
	}
	const roleObjects = roles.map(role => resolve.role(msg, role)).filter(identity)
	if (!roleObjects.length) {
		return { message: `No valid roles were given.`, trace }
	}
	if (remove) {
		await member.roles.remove(roleObjects)
	} else {
		await member.roles.add(roleObjects)
	}
	reply('Success!')
}

export {
	give
}
