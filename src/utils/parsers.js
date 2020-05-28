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
// If `haveArgs` is null, then all options will expect values.
function parseBashlike (raw = '', haveArgs = new Set(), data = new Map()) {
	const options = { '...': [] }
	let optionType = null // 'single' | 'double' | 'rest' | null
	let inString = null // '"' | '\'' | '`' | null
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
					const value = data.get(variableSubst)
					currentToken += value === undefined ? '' : value + ''
					variableSubst = null
				} else {
					variableSubst += char
				}
			} else if (escapeNext) {
				currentToken += char
				escapeNext = false
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
				if (currentToken) throw new SyntaxError(`Required space before option (was parsing "${currentToken}").`)
				if (expectValueNext) throw new SyntaxError(`Option "${expectValueNext}" expects a value.`)
				optionType = 'single'
			} else if (char === '"' || char === '\'' || char === '`') {
				if (currentToken) throw new SyntaxError(`Required space before string (was parsing "${currentToken}").`)
				inString = char
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
			} else if (!haveArgs || haveArgs.has(char)) {
				expectValueNext = char
			} else {
				options[char] = true
			}
		} else if (optionType === 'double') {
			if (isWhitespace(char)) {
				optionType = null
				if (currentToken) {
					if (!haveArgs || haveArgs.has(currentToken)) {
						expectValueNext = currentToken
					} else {
						options[currentToken] = true
					}
					currentToken = ''
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
	if (currentToken) {
		if (optionType === null) {
			if (expectValueNext) {
				options[expectValueNext] = currentToken
				expectValueNext = null
			} else {
				options['...'].push(currentToken)
			}
		} else if (optionType === 'double') {
			if (!haveArgs || haveArgs.has(currentToken)) {
				expectValueNext = currentToken
			} else {
				options[currentToken] = true
			}
		}
	}
	if (expectValueNext && optionType !== 'rest') {
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
// 	optional: true,
// 	aliasesOnly: true
// }
// Should give an options object like { apple: { value: 'happy' } } for '-a happy'
// If `validate` is absent, it's assumed to be a presence thing
//   and will give a boolean.
// `optionTypes` can be omitted and it won't validate anything.
// `optionTypes` can also be 'expect-all' which is basically the same but all
//   options will expect a value.
// Special names: Use '...' for undashed arguments (it'll return an array; can use aliasesOnly: true to disallow --...)
//   and '--' for everything after a `--` (unparsed)
const builtInValidators = {
	isBoolean: value => typeof value === 'boolean',
	isWord: value => /\w+/.test(value),
	isArray: Array.isArray,
	isString: value => typeof value === 'string'
}
function bashlikeArgumentParser (optionTypes = null) {
	const expectsNextValue = optionTypes === 'expect-all' ? null : new Set()
	if (Array.isArray(optionTypes)) {
		for (const optionType of optionTypes) {
			const { name, aliases = [], validate, transform, aliasesOnly = false } = optionType
			if (validate) {
				if (!aliasesOnly) {
					// Probably want name top priority
					aliases.unshift(name)
				}
				for (const alias of aliases) {
					if (expectsNextValue.has(alias)) {
						throw new Error(`Duplicate option name "${alias}".`)
					} else {
						expectsNextValue.add(alias)
					}
				}
			} else if (aliases.includes('...')) {
				console.warn('A `...` option does not have a validate function. You probably might want to add `, validate: \'isArray\'`.')
			}
			if (typeof validate !== 'function') {
				if (!validate) {
					// Assume that it's a thing where only the presence matters
					optionType.validate = builtInValidators.isBoolean
					optionType.optional = true
				} else if (builtInValidators[validate]) {
					optionType.validate = builtInValidators[validate]
				} else {
					throw new Error(`Invalid validate function for "${name}".`)
				}
			}
		}
	}
	return {
		parse: (unparsedArgs, data) => {
			const options = parseBashlike(unparsedArgs, expectsNextValue, data)
			if (!Array.isArray(optionTypes)) return options
			const validatedOptions = {}
			for (const {
				name,
				aliases = [],
				validate,
				transform,
				optional = false
			} of optionTypes) {
				let value
				for (const alias of aliases) {
					if (options[alias] !== undefined) {
						value = options[alias]
						break
					}
				}
				if (value === undefined) {
					if (optional) {
						continue
					} else {
						throw new Error(`Missing option "${name}".`)
					}
				}
				if (validate(value, data)) {
					validatedOptions[name] = transform ? transform(value, data) : value
				} else if (!optional) {
					throw new Error(`Option "${name}" did not pass validation.`)
				}
			}
			return validatedOptions
		}
	}
}

export {
	simpleArgumentParser,
	bashlikeArgumentParser
}
