// Simple argument parser
// Syntax for `syntax`:
// - keyword
// - <required>
// - [optional]
// For example, simpleArgumentParser({ sheep: 'sheep <name> [colour]' })
// Will parse arguments as { type: 'sheep', name, colour? }
// Entries should from highest to lowest priority
// Returns null if no arguments can be parsed
export function simpleArgumentParser (rawOptions) {
	const options = Object.entries(rawOptions).map(([name, option]) => {
		return {
			name,
			syntax: option.split(/\s+/).map(argument => {
				let match
				match = argument.match(/^(\w+)$/)
				if (match) return { type: 'keyword', value: match[1] }
				match = argument.match(/^<(\w+)>$/)
				if (match) return { type: 'required', name: match[1] }
				match = argument.match(/^\[(\w+)\]$/)
				if (match) return { type: 'optional', name: match[1] }
				throw new Error(`Invalid syntax: ${argument} is neither <required>, [optional], nor a keyword`)
			})
		}
	})
	return {
		syntax: Object.values(rawOptions),
		parse: unparsedArgs => {
			// Unnecessarily complicated
			const tokens = [...unparsedArgs.matchAll(/"(?:[^"\\]|\\.)*"|\w+/g)]
				.map(match => match[0][0] === '"' ? JSON.parse(match[0]) : match[0])
			for (const { name, syntax } of options) {
				const data = { type: name }
				let success = true
				let i = 0
				for (const argument of syntax) {
					switch (argument.type) {
						case 'keyword':
							if (i < tokens.length && tokens[i] === argument.value) {
								i++
							} else {
								success = false
							}
							break
						case 'required':
							if (i < tokens.length) {
								data[argument.name] = tokens[i]
								i++
							} else {
								success = false
							}
							break
						case 'optional':
							if (i < tokens.length) {
								data[argument.name] = tokens[i]
								i++
							}
							break
					}
					if (!success) break
				}
				if (success && i === tokens.length) {
					return data
				}
			}
			return null
		}
	}
}
