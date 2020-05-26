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
			// Omg an obscure JavaScript label
			mainLoop:
			for (const { name, syntax } of options) {
				const data = { type: name }
				let success = true
				let i = 0
				for (let j = 0; j < syntax.length; j++) {
					const argument = syntax[j]
					if (i >= tokens.length) {
						if (argument.type === 'optional') {
							break
						} else {
							continue mainLoop
						}
					}
					switch (argument.type) {
						case 'keyword':
							if (tokens[i] === argument.value) {
								i++
							} else {
								continue mainLoop
							}
							break
						case 'required':
							data[argument.name] = tokens[i]
							i++
							break
						case 'optional':
							// Test for the special case such as when the rule is `[optional] keyword`
							// and the user gives "keyword"; it should match the keyword and skip
							// optional. However, "keyword keyword"'s first keyword should be
							// used for the optional
							if (!(syntax[j + 1] && syntax[j + 1].type === 'keyword' &&
								syntax[j + 1].value !== tokens[i + 1] && syntax[j + 1].value === tokens[i])) {
								data[argument.name] = tokens[i]
								i++
							}
							break
					}
				}
				if (i < tokens.length) continue
				return data
			}
			return null
		}
	}
}
