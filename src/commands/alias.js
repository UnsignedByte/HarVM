export function list ({ aliasUtil, reply }) {
	reply(Array.from(aliasUtil.keys(), ([alias, command]) => {
		return `**\`${alias}\`**: \`${command}\``
	}))
}

export function set ({ aliasUtil, reply }) {
	reply('not done lol')
	return

	// NOTE: Psuedo code
	if (command) {
		aliasUtil.set(aliasName, command)
	} else {
		aliasUtil.delete(aliasName)
	}
}

export default function help ({ reply }) {
	// I would like a cool helper function that can generate cool formatting for help, but this'll do.
	reply(`
		__**Aliases**__
		Some commands might be rather long, verbose, repetitive, and redundantly wordy. These commands can let you define aliases for commands.

		**\`alias\`** - Brings up this help list
		**\`alias list\`** - Lists all aliases and their commands
		**\`alias set -a <alias name: symbol> -c <command: string>\`** - Creates a new alias that is substituted with the given command.
		**\`alias set -a <alias name: symbol> -d\`** - Deletes specified alias
		Alias names can only contain letters, numbers, and underscores. They are case sensitive.

		For example, you can do
		> \`/alias set -a hi -c "user dm -m \\"Hello!\\" -2 "\`
		to create an alias, then you can use the alias by doing
		> \`/hi @Gamepro5\`
		which is equivalent to
		> \`/user dm -m "Hello!" -2 @Gamepro5\`
	`)
}
