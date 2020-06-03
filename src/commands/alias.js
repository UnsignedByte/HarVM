import { SimpleArgumentParser } from '../utils/parsers.js'

export function list ({ aliasUtil: { aliases }, reply }) {
	reply(Array.from(aliases.entries(), ([alias, command]) => {
		return `**\`${alias}\`**: \`${command}\``
	}).join('\n') || 'No aliases created yet.')
}

set.parser = new SimpleArgumentParser({ main: '<aliasName> [command]' })
export function set ({ aliasUtil: { aliases, saveAliases }, reply, unparsedArgs }) {
	const { aliasName, command } = set.parser.parse(unparsedArgs)
	if (!/^\w+$/.test(aliasName)) return 'Aliases may only contain letters, numbers, and underscores.'
	if (command) {
		aliases.set(aliasName, command)
		reply(`Alias \`${aliasName}\` created!`)
	} else {
		const oldCommand = aliases.get(aliasName)
		aliases.delete(aliasName)
		reply(`Alias \`${aliasName}\` deleted (was \`${oldCommand}\`).`)
	}
	return saveAliases()
}

export default function help ({ reply }) {
	// I would like a cool helper function that can generate cool formatting for help, but this'll do.
	reply(`
		__**Aliases**__
		Some commands might be rather long, verbose, repetitive, and redundantly wordy. These commands can let you define aliases for commands.

		**\`alias\`** - Brings up this help list
		**\`alias list\`** - Lists all aliases and their commands
		**\`alias set <alias name> <command>\`** - Creates a new alias that is substituted with the given command.
		**\`alias set <alias name>\`** - Deletes specified alias
		Alias names can only contain letters, numbers, and underscores. They are case sensitive.

		For example, you can do
		> \`/alias set hi "user dm -m \\"Hello!\\" -2 "\`
		to create an alias, then you can use the alias by doing
		> \`/hi @Gamepro5\`
		which is equivalent to
		> \`/user dm -m "Hello!" -2 @Gamepro5\`
	`)
}
