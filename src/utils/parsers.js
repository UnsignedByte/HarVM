import { isWhitespace } from './str.js'

// Simple argument parser
// Syntax for `syntax`:
// - keyword
// - <required>
// - [optional]
// For example, simpleArgumentParser({ sheep: 'sheep <name> [colour]' })
// Will parse arguments as { type: 'sheep', name, colour? }
// Entries should from highest to lowest priority
// Returns null if no arguments can be parsed
function simpleArgumentParser (rawOptions) {
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
		toString: () => Object.values(rawOptions),
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

// Can parse something like
// parseBashlike('happy -car cool', ['r'])
// into { "...": ["happy"], "c": true, "a": true, "r": "cool" }
function parseBashlike (raw = '', haveArgs = new Set(), data = new Map()) {
	const options = { '...': [] }
	let optionType = null // 'single' | 'double' | 'rest' | null
	let inString = null // '"' | '\'' | null
	let escapeNext = false
	let currentToken = ''
	let expectValueNext = null // Otherwise is the name of the option
	let variableSubst = null // null | 1 | '' ... (1 means it has found a '$')
	for (const char of raw) {
		if (inString) {
			if (variableSubst === 1) {
				if (char === '(') {
					variableSubst = ''
					continue
				} else {
					currentToken += '$'
					variableSubst = null
				}
			}
			if (variableSubst !== null) {
				if (char === ')') {
					const data = data.get(variableSubst)
					currentToken += data === undefined ? '' : data + ''
					variableSubst = null
				} else {
					variableSubst += char
				}
			} else if (escapeNext) {
				currentToken += char
			} else if (char === inString) {
				inString = null
				if (expectValueNext) {
					options[expectValueNext] = currentToken
					expectValueNext = null
				} else {
					options['...'].push(currentToken)
				}
				currentToken = ''
			} else if (char === '\\') {
				escapeNext = true
			} else if (char === '$') {
				variableSubst = 1
			} else {
				currentToken += char
			}
		} else if (optionType === null) {
			if (char === '-') {
				if (currentToken) throw new SyntaxError('Required space before option.')
				if (expectValueNext) throw new SyntaxError(`Option "${expectValueNext}" expects a value.`)
				optionType = 'single'
			} else if (char === '"' || char === '\'') {
				if (currentToken) throw new SyntaxError('Required space before string.')
				inString = optionType
			} else if (isWhitespace(char)) {
				if (currentToken) {
					if (expectValueNext) {
						options[expectValueNext] = currentToken
						expectValueNext = null
					} else {
						options['...'].push(currentToken)
					}
					currentToken = ''
				}
			} else {
				currentToken += char
			}
		} else if (optionType === 'single') {
			if (char === '-') {
				if (expectValueNext) throw new SyntaxError(`Option "${expectValueNext}" expects a value.`)
				// A side effect is that you can do '-wow-eee'
				// which is the same as -w -o -w --eee
				// Not ideal but I think it's fine.
				optionType = 'double'
			} else if (isWhitespace(char)) {
				// Also, '-' is ok and does nothing. Again, not ideal, but tolerable.
				optionType = null
			} else if (expectValueNext) {
				throw new SyntaxError(`Option "${expectValueNext}" expects a value.`)
			} else if (haveArgs.has(char)) {
				expectValueNext = char
			} else {
				options[char] = true
			}
		} else if (optionType === 'double') {
			if (isWhitespace(char)) {
				optionType = null
				if (currentToken) {
					if (haveArgs.has(currentToken)) {
						expectValueNext = currentToken
					} else {
						options[currentToken] = true
					}
				} else {
					// '--'
					optionType = 'rest'
					// It's possible for '----' to conflict with '--' but whatever
					options['--'] = ''
				}
			} else {
				currentToken += char
			}
		} else if (optionType === 'rest') {
			if (expectValueNext || !isWhitespace(char)) {
				if (!expectValueNext) expectValueNext = true
				options['--'] += char
			}
		} else {
			console.error('Invalid state...?', { raw, options, optionType, inString, currentToken, char })
			throw new Error('Invalid state...?')
		}
	}
	if (inString) {
		throw new SyntaxError('String was not properly closed.')
	}
	if (expectValueNext) {
		throw new SyntaxError(`Option "${expectValueNext}" expects a value.`)
	}
	return options
}

// `optionTypes` should be an array of objects like
// {
// 	name: 'apple',
// 	aliases: ['a', 'aple'],
// 	validate: value => /\w+/.test(value),
// 	transform: value => ({ value }),
// 	description: 'Apple name',
// 	optional: true
// }
// Should give an options object like { apple: { value: 'happy' } } for '-a happy'
// If `validate` is absent, it's assumed to be a presence thing
//   and will give a boolean.
// `optionTypes` can be omitted and it won't validate anything.
// Special names: Use '...' for undashed arguments (it'll return an array)
//   and '--' for everything after a `--` (unparsed)
const builtInValidators = {
	isBoolean: value => typeof value === 'boolean',
	isWord: value => /\w+/.test(value)
}
function bashlikeArgumentParser (optionTypes = null) {
	const expectsNextValue = new Set()
	if (optionTypes) {
		for (const optionType of optionTypes) {
			const { name, aliases = [], validate, transform } = optionType
			if (validate) {
				for (const item of [name, ...aliases]) {
					if (expectValueNext.has(item)) {
						throw new Error(`Duplicate option name "${item}"`)
					} else {
						expectsNextValue.push(item)
					}
				}
			}
			if (typeof validate !== 'function') {
				if (!validate) {
					optionType.validate = builtInValidators.isBoolean
				} else if (builtInValidators[validate]) {
					optionType.validate = builtInValidators[validate]
				} else {
					throw new Error(`Invalid validate function for "${name}"`)
				}
			}
		}
	}
	return {
		parse: (unparsedArgs, data) => {
			const options = parseBashlike(unparsedArgs, expectsNextValue, data)
			if (!optionTypes) return options
			const validatedOptions = {}
			for (const { name, aliases = [], validate, transform, optional } of optionTypes) {
				if (options[name] === undefined) {
					for (const alias of aliases) {
						if (options[alias] !== undefined) {
							options[name] = options[alias]
							break
						}
					}
				}
				const value = options[name]
				if (value === undefined) {
					if (optional) {
						continue
					} else {
						throw new Error(`Missing option "${name}"`)
					}
				}
				if (validate(value)) {
					validatedOptions[name] = transform ? transform(value) : value
				} else if (!optional) {
					throw new Error(`Option "${name}" did not pass validation.`)
				}
			}
		}
	}
}

export {
	simpleArgumentParser,
	bashlikeArgumentParser
}
