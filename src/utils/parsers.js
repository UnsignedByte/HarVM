import { isWhitespace } from './str.js'
import identity from './identity.js'

// Distinguish a parser error from a normal runtime error
class ParserError extends Error {
	constructor (...args) {
		super(...args)
	}
}

class Parser{
	parse(args, env){
		// Should we just throw a ParserError here?
		console.warn("Parser is undefined, generic parser being used.");
		return args;
	}

	toString(){
		return 'The command prefers to keep its function a mystery.'
	}
}

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



class SimpleArgumentParser extends Parser {
	static FAILURE = Symbol('Simple argument parser data failure')
	static argTypes = {
		keyword:/^(?<name>\w+)$/,
		required:/^(?<class>\w*)<(?<name>\w+)>$/,
		optional:/^(?<class>\w*)\[(?<name>\w+)\]$/
	}
	static builtInDataTypes = {
		'': identity, //default (no class)
		bool: value => {
			let v=/^(?<t>t(?:rue)?|1|y(?:es)?)|(?:f(?:alse)?|0|no?)$/i.exec(value);
			return v!==null?v.groups.t !== undefined:SimpleArgumentParser.FAILURE
		},
		int: value => parseInt(value)||SimpleArgumentParser.FAILURE,
		float: value => parseFloat(value)||SimpleArgumentParser.FAILURE
	}
	constructor(rawOptions, dataTypes={}){
		super();
		this.rawOptions = rawOptions;
		this.dataTypes = Object.assign(SimpleArgumentParser.builtInDataTypes, dataTypes);
		this.options = Object.entries(rawOptions).map(([name, option]) => {
			return {
				name,
				// Parse and validate the argument syntax
				syntax: option.split(/\s+/).map(argument => {
					// loop through all argTypes and try to match each
					for (let [type, reg] of Object.entries(SimpleArgumentParser.argTypes)){
						let match = reg.exec(argument);
						if (match) return Object.assign({type:type}, match.groups);
					}
					throw new Error(`Invalid syntax: ${argument} is not a valid argument type`)
				})
			}
		})
	}

	toString(){
		return Object.entries(this.rawOptions).map(([name, raw]) => `${name}: \`${raw}\``).join('\n');
	}

	parse(unparsedArgs, env){
		// Unnecessarily complicated; splits the unparsed arguments into an array
		// of "words" (see the function description) or strings.
		const tokens = [...unparsedArgs.matchAll(/("(?:[^"\\]|\\.)*")|[^\s]+/g)]
			// Parse strings using JSON.parse.
			.map(match => match[1] ? JSON.parse(match[1]) : match[0])

		const invalidations = []

		// Omg an obscure JavaScript label
		mainLoop:
		// Attempt to match the tokens using each possible parsing until there is
		// a match.
		for (const { name, syntax } of this.options) {
			/** @type {SimpleParserOutput} The output */
			const data = { type: name }

			/** @type {number} The index of the current token. */
			let i = 0

			/**
			 * The index of the current syntax argument or keyword.
			 * @type {number}
			 */
			for (let j = 0; j < syntax.length; j++) {
				const argument = syntax[j]
				console.log(argument);
				// Are there insufficient tokens?
				if (i >= tokens.length) {
					// Maybe the rest of the arguments are optional. However, if not,
					// then there isn't a match, so let's try the next possibility.
					if (argument.type !== 'optional') {
						invalidations.push(`${name}: Insufficient tokens.`)
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
						if (tokens[i] === argument.name) {
							i++
						} else {
							invalidations.push(`${name}: Keyword "${argument.name}" did not match.`)
							continue mainLoop
						}
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
						if (syntax[j + 1] && syntax[j + 1].type === 'keyword' &&
							syntax[j + 1].name !== tokens[i + 1] && syntax[j + 1].name === tokens[i]) {
							// Do not store
							break;
						}
						// If it continues, move down to required
					case 'required':
						// Store the token as the argument value
						data[argument.name] = this.dataTypes[argument.class](tokens[i]);
						if (data[argument.name]===SimpleArgumentParser.FAILURE) {
							if (argument.type === 'required') {
								invalidations.push(`${name}: Argument \`${argument.name}\` had value \`${tokens[i]}\`, which was not of type \`${argument.class}\`.`)
								continue mainLoop
							} else {
								delete data[argument.name]
							}
						}
						i++;
						break;
				}
			}
			// If there are extra tokens, then that shouldn't be considered a match.
			if (i < tokens.length) continue
			// Otherwise, the possible parsing has matched!
			return data
		}
		// The tokens didn't match any of the possible parsings, so it failed.
		throw new ParserError(invalidations.join('\n'))
	}
}

/**
 * Describes an option for the bash-like argument parser.
 * A "presence option" is an option that doesn't expect a value; instead, its
 * inclusion indicates that its value is true, and its exclusion makes its
 * value false.
 *
 * @example
 * {
 * 	name: 'apple',
 * 	aliases: ['a', 'aple'],
 * 	validate: value => /\w+/.test(value),
 * 	transform: value => ({ value }),
 * 	description: 'Apple name',
 * 	optional: true,
 * 	aliasesOnly: true
 * }
 *
 * @typedef OptionType
 * @property {string} name - The ID of the option that is used in the object map
 * that the parser returns. This is automatically included in `aliases` unless
 * `aliasesOnly` is true.
 * @property {string[]} [aliases] - A list of alternative names that can be used
 * for the option; this is good for common misspellings and alternative
 * spellings, and also single letter options for single dash options. This
 * should also include '...' or '--' for the respective outputs from
 * `parseBashlike`.
 * @property {(string | Function)} [validate='isBoolean'] - See below for a more
 * thorough description. You can pass in a string to refer to one of the
 * `builtInValidators` (see above) by ID. Omit this for "presence options."
 * @property {Function} [transform] - See below for a more thorough description.
 * @property {string} [description] - A description of the option; this is for
 * the generated help text for the command's options.
 * @property {boolean} [optional=false] - True if the option can be omitted;
 * useless for "presence options."
 * @property {boolean} [aliasesOnly=false] - True if `name` should not be
 * included in the `aliases` list. This can be used to prevent people from doing `--...`
 * for a "..." option.
 */

/**
 * Validates the option value. If the value is invalid, it'll either throw an
 * error or simply be omitted if the option is optional.
 * @function OptionType#validate
 * @param {(string[] | string | boolean)} value - The parsed value from
 * `parseBashlike`.
 * @returns {boolean} - Whether the option value is valid.
 */

/**
 * Converts the parsed value into something more usable for the command.
 * @function OptionType#transform
 * @param {(string[] | string | boolean)} value - The parsed value from
 * `parseBashlike`.
 * @returns {*}
 */

/**
 * An argument parser inspired by Bash. Most of the information about the parser
 * can be found in that of `parseBashlike` and OptionType.
 *
 * @param {?(OptionType[] | string)} [optionTypes] - The possible options for
 * the parser. Alternatively, you can give `null` and it'll return the result of
 * `parseBashlike` directly, or 'expect-all' for something similar but all
 * options expect values.
 * @returns {Parser<Object<string, *>>} - An object map of option names to
 * transformed values.
 */

class BashlikeArgumentParser extends Parser{

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
	static builtInValidators = {
		isBoolean: value => typeof value === 'boolean',
		isWord: value => /\w+/.test(value),
		isArray: Array.isArray,
		isString: value => typeof value === 'string'
	}

	constructor(optionTypes=null, description=''){
		super();
		this.optionTypes= optionTypes;
		this.description = description
		this.expectsNextValue = this.optionTypes === 'expect-all' ? null : new Set()
		if (Array.isArray(this.optionTypes)) {
			for (const optionType of this.optionTypes) {
				if (!optionType.aliases) optionType.aliases = []
				const { name, aliases, validate, transform, aliasesOnly = false } = optionType
				if (validate) {
					if (!aliasesOnly) {
						// `unshift` puts the name as the first item so that when it later
						// gets the option value by looping through the array of aliases,
						// it'll check the name first, thus giving it higher priority.
						aliases.unshift(name)
					}
					for (const alias of aliases) {
						if (this.expectsNextValue.has(alias)) {
							throw new Error(`Duplicate option name "${alias}".`)
						} else {
							this.expectsNextValue.add(alias)
						}
					}
				} else if (aliases.includes('...')) {
					// Since the default validate function is isBoolean, it'll always fail for something like '...'.
					console.warn('A `...` option does not have a validate function. You probably might want to add `, validate: \'isArray\'`.')
				}
				if (typeof validate !== 'function') {
					if (!validate) {
						// Assume that it's a thing where only the presence matters
						optionType.validate = BashlikeArgumentParser.builtInValidators.isBoolean
						optionType._presence = true
					} else if (BashlikeArgumentParser.builtInValidators[validate]) {
						optionType.validate = BashlikeArgumentParser.builtInValidators[validate]
					} else {
						throw new Error(`Invalid validate function for "${name}".`)
					}
				}
				if (aliases.includes('...')) {
					this._baseOption = name
				} else if (aliases.includes('--')) {
					this._restOption = name
				}
			}
		}
	}

	/**
	 * A helper function for an argument parser inspired by the style of Bash
	 * commands. Arguments, also known as options, are denoted using a hyphen for
	 * single letters or a double hyphen for an entire word. Single letter option
	 * names can be grouped together after a single hyphen, so "-cat" is equivalent
	 * to "-c -a -t" rather than "--cat". Values that don't follow an argument name
	 * will be placed into an array with argument name "...". All text after a
	 * double hyphen and a space "--" will be left unparsed, so you can have extra
	 * arguments that you could store or parse separately; its argument name is "--".
	 * Values can either be a "word," which is any string that only contains
	 * letters, numbers, and underscores, or a string enclosed in single or double
	 * quotes or backticks. You can also use $(variableName) to substitute in the
	 * value of a variable, which is extremely useful. Backslashes are used to
	 * escape characters.
	 *
	 * @example
	 * parseBashlike(
	 * 	'billy -cat time "epic $(gamer)" --dog woof -- -unparsed wow',
	 * 	new Set(['t', 'dog']),
	 * 	new Map([['gamer', 'Nichodon']])
	 * )
	 * // Outputs:
	 * {
	 * 	'...': ['billy', 'epic Nichodon'],
	 * 	'c': true,
	 * 	'a': true,
	 * 	't': 'time',
	 * 	'dog': 'woof',
	 * 	'--': '-unparsed wow'
	 * }
	 *
	 * @param {string} [raw] - The raw unparsed argument string from the user.
	 * @param {?Set<string>} [haveArgs] - A set of all the argument names that expect
	 * a value to follow it. If null, all options will expect values.
	 * @param {Map<string, string>} [data] - A map of temporary script variable
	 * values to use for variable substitution.
	 * @returns {Object<string, (string[] | string | boolean)>} - An object map between argument
	 * names and their string values. If the argument doesn't expect a value to
	 * follow it (according to the `haveArgs` parameter), the value will be `true`
	 * instead.
	 */
	_parseBashlike (raw = '', haveArgs = new Set(), data = new Map()) {
		/**
		 * An object in which the parsed options will be stored.
		 * @type {Object<string, (string[] | string | boolean)>}
		 */
		const options = { '...': [] }

		/**
		 * The "mode" of the parser; it's in one of three states:
		 * null - The parser is currently parsing non-option values. This is the
		 * default/starting state.
		 * 'single' - The parser is currently parsing options after a single hyphen.
		 * 'double' - The parser is currently parsing options after two hyphens.
		 * 'rest' - The parser is parsing all the characters after a lone --.
		 * @type {?string}
		 */
		let optionType = null

		/**
		 * Whether the parser is inside a string, and what character will close the
		 * string (either '\'', '"', or '`'). If null, then the parser is not inside
		 * the string.
		 * @type {?string}
		 */
		let inString = null

		/**
		 * For string parsing: whether the next character should be escaped. Escaping
		 * means that the next character will be considered part of the string
		 * regardless of its normal meaning.
		 * @type {boolean}
		 */
		let escapeNext = false

		/**
		 * The purpose of `currentToken` depends on the values of `optionType` (the
		 * mode of the parser) and `inString`, but generally it stores the currently
		 * parsed string of characters. In the default optionType = null mode,
		 * `currentToken` contains the current unquoted "word" to be added to the "..."
		 * array. In the optionType = 'double' mode, it contains the option name.
		 * Inside a string, it contains the parsed string data.
		 * @type {string}
		 */
		let currentToken = ''

		/**
		 * This has the name of the option that expects a value after it. This is used
		 * for storing that next value in `options` by the option name. Most of the
		 * time it'll probably be null, which means the currently parsed "word" or
		 * string is not meant to be the value of an option.
		 * @type {?string}
		 */
		let expectValueNext = null

		/**
		 * This variable is rather abstract. It's only used inside strings, and most
		 * of the time, it is null. However, when a string encounters an unescaped '$'
		 * character, it'll set this to the number 1. Then, if it encounters an
		 * opening parenthesis, '(', it'll set this to an empty string to store the
		 * name of the variable to be substituted. You can see how it works below.
		 * @type {?(number | string)}
		 */
		let variableSubst = null // null | 1 | '' ... (1 means it has found a '$')

		for (const char of raw) {
			if (inString) {
				// If `variableSubst` is 1, that means that the previous character was an
				// unescaped '$'.
				if (variableSubst === 1) {
					if (char === '(') {
						// Begin determining the name of the variable to be substituted
						variableSubst = ''
						continue
					} else {
						// That '$' was a false alarm, so add it to the string and parse this
						// character normally.
						currentToken += '$'
						variableSubst = null
					}
				}
				if (variableSubst !== null) {
					// This means that it's currently determining the name of a variable
					// inside a $(variableName) expression
					if (char === ')') {
						// Get the value of the variable and add it to the string.
						const value = data.get(variableSubst)
						currentToken += value === undefined ? '' : value + ''
						variableSubst = null
					} else {
						// Continue collecting the characters for the name of the variable
						variableSubst += char
					}
				} else if (escapeNext) {
					// The previous character was an unescaped backslash; this prevents the
					// later conditions from running, thereby escaping the character from
					// its normal behaviour in the string.
					// Note that there's no special escape sequences, so '\n' becomes 'n'.
					currentToken += char
					escapeNext = false
				} else if (char === inString) {
					// If the character is the same as the quotation mark that started the
					// string, then the string is to be closed. If the string is the value
					// of an option, store it as such; otherwise, it is added to the "..."
					// array.
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
					// An ordinary character of a string
					currentToken += char
				}
			} else if (optionType === null) {
				// Parsing tokens that aren't option names, such as:
				// apple -banana --car danny "elephant" ferry -- garry
				// ^^^^^               ^^^^^            ^^^^^
				if (char === '-') {
					if (currentToken) throw new ParserError(`Required space before option (was parsing "${currentToken}").`)
					if (expectValueNext) throw new ParserError(`Option "${expectValueNext}" expects a value.`)
					optionType = 'single'
				} else if (char === '"' || char === '\'' || char === '`') {
					if (currentToken) throw new ParserError(`Required space before string (was parsing "${currentToken}").`)
					inString = char
				} else if (isWhitespace(char)) {
					if (currentToken) {
						// If `currentToken` isn't empty, then there were non-whitespace
						// characters previously. This means that the currently parsed token
						// is complete, and it can be stored the same way a finished string is
						// (see above).
						if (expectValueNext) {
							options[expectValueNext] = currentToken
							expectValueNext = null
						} else {
							options['...'].push(currentToken)
						}
						currentToken = ''
					}
				} else {
					// This is actually very forgiving; characters other than a hyphen,
					// quotation mark, or whitespace don't need to be quoted.
					currentToken += char
				}
			} else if (optionType === 'single') {
				// Single hyphen options are for single letter option names, which allow
				// them to be grouped together like "-cat" for "-c -a -t". To prevent this
				// behaviour, use double hyphens.
				if (char === '-') {
					// If there's another hyphen after the first hyphen, it's probably for
					// a double hyphen option (eg "--cat").
					if (expectValueNext) throw new ParserError(`Option "${expectValueNext}" expects a value.`)
					// A side effect of this is that you can do '-wow-eee', which is the
					// same as "-w -o -w --ee"e. Not ideal but I think it's fine.
					optionType = 'double'
				} else if (isWhitespace(char)) {
					// Note that parsing simply "-" is valid but ignored.
					optionType = null
				} else if (expectValueNext) {
					// If some previous option in the group expects a value but there's
					// still another option anyways, then that is a PROBLEM.
					throw new ParserError(`Option "${expectValueNext}" expects a value.`)
				} else if (!haveArgs || haveArgs.has(char)) {
					// Note whether the option expects a value next.
					expectValueNext = char
				} else {
					// Mark the option as "present".
					options[char] = true
				}
			} else if (optionType === 'double') {
				// For double hyphened options, like "--cat". It also deals with "--".
				if (isWhitespace(char)) {
					optionType = null
					if (currentToken) {
						// Note the option the same way it is done for single hyphen options
						// (see above).
						if (!haveArgs || haveArgs.has(currentToken)) {
							expectValueNext = currentToken
						} else {
							options[currentToken] = true
						}
						currentToken = ''
					} else {
						// "--"
						optionType = 'rest'
						// Note that it's possible for the value of '----' to be overridden by '--',
						// but whatever.
						options['--'] = ''
					}
				} else {
					currentToken += char
				}
			} else if (optionType === 'rest') {
				// These are the characters after a "--".
				// In this case, `expectValueNext` is false at first until there is no
				// more whitespace. This is to trim the whitespace after a "--" by
				// ignoring the initial whitespace.
				if (expectValueNext || !isWhitespace(char)) {
					if (!expectValueNext) expectValueNext = true
					options['--'] += char
				}
			} else {
				// This shouldn't ever happen, but just in case, I guess.
				console.error('Invalid state...?', { raw, options, optionType, inString, currentToken, char })
				throw new ParserError('Invalid state...?')
			}
		}
		if (inString) {
			throw new ParserError('String was not properly closed.')
		}
		// The `currentToken` won't get stored in `options` until it finds whitespace,
		// but since we've reached the end of the string, there's no more whitespace
		// to be found. Thus, we must add it to `options` here as well.
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
			throw new ParserError(`Option "${expectValueNext}" expects a value.`)
		}
		return options
	}
	parse(unparsedArgs, env){
    const options = this._parseBashlike(unparsedArgs, this.expectsNextValue, env)
    if (!Array.isArray(this.optionTypes)) return options
    const validatedOptions = {}
    for (const {
      name,
      aliases,
      validate,
      transform,
      optional = false,
      _presence
    } of this.optionTypes) {
      // Get the option value by checking each alias.
      let value
      for (const alias of aliases) {
        if (options[alias] !== undefined) {
          value = options[alias]
          break
        }
      }
      if (value === undefined) {
        if (_presence) {
          value = false
        } else if (optional) {
          continue
				} else {
					throw new ParserError(`Missing option "${name}".`)
				}
			}
			if (validate(value, env)) {
				validatedOptions[name] = transform ? transform(value, env) : value
			} else if (!optional) {
				throw new ParserError(`Option "${name}" did not pass validation.`)
			}
		}
		return validatedOptions
	}

	toString () {
		if (!Array.isArray(this.optionTypes)) {
			return this.description || 'This command accepts any options and values.'
		}
		const options = this.optionTypes
			.map(({ name, aliases, optional, description, _presence }) => {
				aliases = aliases
					.filter(alias => alias !== '...' && alias !== '--')
					.map(alias => alias.length === 1 ? `\`-${alias}\`` : `\`--${alias}\``)
				return '`' + name.toUpperCase() + '`' +
					(aliases.length ? ': ' + aliases.join(', ') : aliases) +
					(_presence ? '' : ' <value>') +
					(optional ? ' (optional)' : '') +
					(description ? '\n\t' + description : '')
			})
			.filter(identity)
			.join('\n')
		return `Usage: \`${
			[
				options ? '[OPTIONS...]' : '',
				this._baseOption ? `<${this._baseOption.toUpperCase()}...>` : '',
				this._restOption ? `-- <${this._restOption.toUpperCase()}>` : ''
			].filter(identity).join(' ')
		}\`${
			this.description ? '\n\n' + this.description : ''
		}${
			options ? '\n\n' + options : ''
		}`
	}
}

export {
	ParserError,
	Parser,
	SimpleArgumentParser,
	BashlikeArgumentParser
}
