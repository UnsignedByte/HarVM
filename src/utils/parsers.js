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

/**
 * An argument parser; use `.parse(unparsedArgs, temp?)` to parse unparsed
 * arguments.
 * @interface Parser<ParserOutput>
 */

/**
 * Returns a human-readable string for command documentation.
 * @function Parser#toString
 * @returns {string}
 */

/**
 * Parses a string of raw arguments from the user into a fancy object that a
 * command can use.
 * @function Parser#parse
 * @param {string} unparsedArgs - A raw string of the arguments for the command
 * to be parsed.
 * @param {Map<string, string>} data - A map containing the temporary script
 * session variables for the command. This could be used for substituting
 * variable values, for example.
 * @returns {ParserOutput}

/**
 * The output of the simple argument parser. It maps the names of arguments to
 * string values.
 * @typedef SimpleParserOutput
 * @type {Object<string, string>}
 * @property {string} type - The ID of the possible parsing. This is the key of
 * the key-value pair in the object that is passed into `simpleArgumentParser`.
 */

/**
 * A simple argument parser inspired by Minecraft commands. It supports multiple
 * possible argument parsings. and keywords to distinguish between them. When
 * specifying the syntax for a possible parsing, <angle brackets> are used to
 * denote required arguments, [square brackets] are used to denote optional
 * arguments, and keywords are unmarked.
 *
 * Keywords may only contain letters, numbers, and underscores (a "word"). When
 * calling the command, arguments can be a word or a string in double quotes
 * with backslashes to escape. Note that strings do not support variable
 * substitution; however, they do support more sophisticated escape sequences
 * because they are parsed using `JSON.parse`. If none of the possible parsings
 * match, the parser will return null.
 *
 * @example
 * const parser = simpleArgumentParser({
 * 	apple: 'apple <name> [colour]',
 * 	banana: 'banana <name> [colour]'
 * })
 * parser.parse('apple Billy red') // { type: 'apple', name: 'Billy', colour: 'red' }
 * parser.parse('banana "Leuf Munkler"') // { type: 'banana', name: 'Leuf Munkler' }
 * parser.parse('carrot Ovinus white') // null
 *
 * @param {Object<string, string>} rawOptions - An object map of a possible
 * argument parsings. The keys should be in order of precedence, from top to
 * lowest priority.
 * @returns {Parser<?SimpleParserOutput>}
 */
function simpleArgumentParser (rawOptions) {
	const options = Object.entries(rawOptions).map(([name, option]) => {
		return {
			name,
			// Parse and validate the argument syntax
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
			// Unnecessarily complicated; splits the unparsed arguments into an array
			// of "words" (see the function description) or strings.
			const tokens = [...unparsedArgs.matchAll(/"(?:[^"\\]|\\.)*"|\w+/g)]
				// Parse strings using JSON.parse.
				.map(match => match[0][0] === '"' ? JSON.parse(match[0]) : match[0])
			// Omg an obscure JavaScript label
			mainLoop:
			// Attempt to match the tokens using each possible parsing until there is
			// a match.
			for (const { name, syntax } of options) {
				// The output
				const data = { type: name }
				let success = true
				let i = 0
				for (let j = 0; j < syntax.length; j++) {
					const argument = syntax[j]
					// Are there insufficient tokens?
					if (i >= tokens.length) {
						// Maybe the rest of the arguments are optional. However, if not,
						// then there isn't a match, so let's try the next possibility.
						if (argument.type !== 'optional') {
							continue mainLoop
						}
					}
					// `continue mainLoop` means that the match has failed, so it'll
					// attempt the next possible parsing.
					// `i++` means that the current token has passed so far, so it'll
					// check the next token too.
					switch (argument.type) {
						case 'keyword':
							// The current token should match the keyword exactly.
							if (tokens[i] === argument.value) {
								i++
							} else {
								continue mainLoop
							}
							break
						case 'required':
							// Store the token as the argument value
							data[argument.name] = tokens[i]
							i++
							break
						case 'optional':
							// This is so complicated because it's looking ahead to check to
							// next syntax element. If it's a keyword that would match the
							// current token, and the next token wouldn't match the keyword,
							// then the current token was probably meant for the keyword
							// rather than this optional argument; in that case, the optional
							// argument is skipped.
							// For example, "tp [target] to <destination>" parsing "tp to
							// Billy" should not be considered invalid just because "to" is
							// considered as the target, thus making "Billy" not match the
							// keyword "to".
							if (!(syntax[j + 1] && syntax[j + 1].type === 'keyword' &&
								syntax[j + 1].value !== tokens[i + 1] && syntax[j + 1].value === tokens[i])) {
								// Store the token as the argument value
								data[argument.name] = tokens[i]
								i++
							}
							break
					}
				}
				// If there are extra tokens, then that shouldn't be considered a match.
				if (i < tokens.length) continue
				// Otherwise, the possible parsing has matched!
				return data
			}
			// The tokens didn't match any of the possible parsings, so it failed.
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
