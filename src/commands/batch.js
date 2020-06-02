const getCommands = /^(?:```\w*\r?\n([^]+)\r?\n```|([^=][^]*)|=\s*(\w+)\s*<-\s*(".+"))$/
const getMultilineName = /^@\s*(\w+)\s*(.*)$/
const getIndent = /^\s+/

function getIndentLength (line) {
	const match = line.match(getIndent)
	return match ? match[0].length : 0
}

// This should make it more convenient to batch calls by making things
// syntactic sugar for other things
export default async function batch ({ unparsedArgs, run, env, reply }) {
	const match = unparsedArgs.match(getCommands)
	// Should this err?
	if (!match) return
	const [, tildeRawCmds, plainRawCmds, storeVarName, storeValue] = match
	if (storeVarName) {
		env.set(storeVarName, JSON.parse(storeValue))
		return
	}
	const rawCommands = (tildeRawCmds || plainRawCmds).split(/\r?\n/)
	const commands = []
	for (let i = 0; i < rawCommands.length; i++) {
		const rawCommand = rawCommands[i]

		// Ignore comments
		if (rawCommand[0] === '#') continue

		// Multiline string
		if (rawCommand[0] === '@') {
			const afterSetting = []
			let current = null
			for (; i < rawCommands.length; i++) {
				const rawCommand = rawCommands[i]
				// If is currently in a multiline block
				if (current) {
					if (getIndentLength(rawCommand) >= current.baseIndent) {
						current.data.push(rawCommand.slice(current.baseIndent))
					} else {
						// If the current line is less indented than the first line of the
						// multiline block
						commands.push(`batch = ${current.varName} <- ${JSON.stringify(current.data.join('\n'))}`)
						current = null
					}
				}
				if (!current) {
					if (rawCommand[0] !== '@') {
						i--
						break
					}
					const [, varName, thenCommand ] = rawCommand.match(getMultilineName)
					if (thenCommand) afterSetting.push(thenCommand)
					current = {
						varName,
						data: [],
						baseIndent: getIndentLength(rawCommands[i + 1] || '')
					}
				}
			}
			if (current) {
				commands.push(`batch = ${current.varName} <- ${JSON.stringify(current.data.join('\n'))}`)
			}
			commands.push(...afterSetting)
		} else if (rawCommand.trim() !== '') {
			commands.push(rawCommand)
		}
	}
	for (const command of commands) {
		const error = await run(command)
		if (error) return error
	}
}

// Ideally:
/*
# Comments starting with # are removed
data set 2 -> a

# A colon followed by a word indicates that the following lines will be stored
# in a VARIABLE; this can be passed into methods that can run the commands.
# This is actually a separate command inserted before the line; maybe it'll use
# its own setter like `batch storeBlock`
@if control if "$(a)" = 2 "batch $(if)" "batch $(else)"
	# `batch` is indentation sensitive. If the next line is more indented than the
	# previous, it'll use that as the baseline indent. All the following lines will
	# be deindented when stored in the variable.
	data log "a is equal to 2, epic"
@else
	# I think for situations where there are multiple blocks in a row, it'll group
	# the store commands before the actual command. Hmm
	data log "a is not equal to 2...?"

@str data log "$(str)"
	"Blocks" can actually be used for multiline strings.
*/
