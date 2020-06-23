## Adding a command

Commands are split up into modules with their own subcommands. Command modules
are JS files in `src/commands/`. They export subcommands and a default export
for a default command for the module.

For example, if one were to write `src/commands/billy.js` with

```js
async function hello ({ reply }) {
	await reply('Hello!')
}

async function main () {
	await reply('Available subcommands: `hello`')
}

export {
	hello
}
export default main
```

then add

```js
export * as billy from './commands/billy.js'
```

to `src/commands.js`, then doing `@bot billy hello` (where `@bot` is a user
mention of the bot) would give output `Hello!`, and doing `@bot billy` would
output ``Available subcommands: `hello` ``.

The command function can accept an object of helper methods and objects:

```js
async function hello({
	Discord,
	client,
	unparsedArgs,
	args,
	auth,
	msg,
	env,
	reply,
	aliasUtil,
	trace,
	run
}) {
	// ...
}
```

Here's a description of each property:

- `Discord` is the discord.js module; you can use this to construct various
discord.js objects if needed. This allows us to centralize importing discord.js
depending on if the bot is on the web or in Node. Don't do `import Discord from
'discord.js'` in your file, or the bot won't work on the web.

- `client` is the [discord.js Client of the
bot](https://discord.js.org/#/docs/main/stable/class/Client). Note that `client`
has two extra properties:

	- `client.data` contains a special data manager that can save persistent data,
	such as settings and user data, locally. Use this instead of using any
	Node-specific or browser-specific APIs (such as fs or localStorage) directly
	so that data may also be stored locally in the browser because the data
	manager intelligently uses IndexedDB or the file system depending on where the
	bot is used. More information in the [data manager
	section](#using-the-data-manager).

	- `client.commands` is a list of command modules. This is mainly for the `help
	commands` command.

- `unparsedArgs` contains the raw text after the command; for example, in `@bot
billy hello my name is Bob`, `unparsedArgs`'s value would be `my name is Bob`

- `args` is a getter function that, when retrieved, will parse the `unparsedArgs`
automatically for you. More on parsing command arguments in the [arguments
section](#command-arguments).

- `auth` is a getter function that doesn't return anything. Instead, when
retrieved, it'll check the permissions of the user calling the command. To use
this, set the command function's `auth` property to an array of required
permissions; see a list of permissions in `src/utils/authorize.js`. Permission
names are automatically made all caps with whitespace converted to underscores:

	```js
	// Require the manage server permission
	hello.auth = ['manage guild']
	```

	Setting a property of the command function is also used for command arguments;
	see the [arguments section](#command-arguments) for more details.

- `msg` is the [discord.js Message object that triggered the
command](https://discord.js.org/#/docs/main/stable/class/Message).

- `env` is a
[Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
between names and values of environment/temporary variables. These are temporary
variables that only last while the script is being run. This is only useful if
your command can store values in an environment variable.

- `reply` is a helper function for making output visible to the user. It deals
with wrapping it in a fancy embed so that the output looks consistent throughout
commands. It takes a string and an optional arguments object:

	- `replyOptions.error` is a boolean (`false` by default) determining whether the
	output should be displayed as an error. Currently, this just makes the embed
	colour red.

	- `replyOptions.fields` is an array of fields for the embed (default: `[]`).

	- You can add more options to `reply` by editing the `reply` function in
	`src/client.js`.

- `aliasUtil` is a helper object for dealing with aliases. Most commands shouldn't
have to use this.

	- `aliasUtil.aliases` is a [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) of alias names to the command to be substituted in.

	- `aliasUtil.saveAliases` is a function that will save changes to the aliases
	locally.

- `trace` is an array tracking the trace of the command. This is useful for
tracking down the source of an error. Learn how `trace` can be used in the
[returning an error section](#returning-an-error).

- `run` will run the given command as if the user ran it.

### Returning an error

To return an error, you can throw a JavaScript error, or you can return a string
or object.

Returning a string was the original way of returning an error message.

```js
return 'Task failed successfully.'
```

However, it is now better to return an object that gives trace information so it
can trickle back down to `src/client.js` where it will display a fancy
error-styled embed with the stack trace. Use the `trace` array from the command
parameter object to provide this.

```js
return {
	message: 'Task failed successfully.',
	trace
}
```

### Command arguments

> lol if the subsections are developed independently
> then we might have commands that are like
> @Broken Chromebook war attack @Fifth Master of the Plays
> [...]
> and other commands
> that are like
> @Broken Chromebook worldwar -g 478373272808062995 1000
> lol
> highly inconsistent arguments
> that would be both ideal and unideal
>
> —The person writing this (quoting oneself is epic, don't you agree?)

A command can directly parse `unparsedArgs` itself, but currently there exists
two parsers that can conveniently parse the arguments for you.

To use a parser, you can import them from `src/utils/parsers.js`:

```js
// Inside src/commands/billy.js, for example
import { SimpleArgumentParser, BashlikeArgumentParser } from '../utils/parsers.js'
```

Then, you can add the property `parser` to the command function.

```js
function hello ({ ... }) {
	// ...
}
hello.parser = new SimpleArgumentParser(...) // Or BashlikeArgumentParser
```

It might be preferable to take advantage of function hoisting and put it before
the function.

```js
hello.parser = new SimpleArgumentParser(...)
function hello ({ ... }) {
	// ...
}
```

With either parser (discussed below), you can do `parser.toString()` to generate
fancy documentation for the command. You can provide this with a help function,
or the error message will supply it automatically if there is a syntax error
parsing the arguments.

The difference between the two parsers will be explained briefly here. More
detail can be found in the essays of `src/utils/parsers.js`.

### `SimpleArgumentParser`

The simple argument parser is inspired by Minecraft commands.

```js
hello.parser = new SimpleArgumentParser({
	main: 'bigInt<requiredNum> [optional] keyword',
	alternative: 'something else <something> int...'
}, {
	bigInt: value => value !== '0' ? BigInt(value) : SimpleArgumentParser.FAILURE
})
```

Calling `billy hello 61 keyword` will populate `args` with

```js
{
	type: 'main',
	requiredNum: 61n
}
```

Angle brackets denote required parameters, while square brackets denote optional
parameters which may be omitted without causing an error. They surround the key
name in the `args` object. Unmarked tokens are keywords. Individual parameters
can be typed by prefixing a name. Built-in types include `string`, `int`,
`float`, `bool`, and `auto`, which tries to guess the type.

You can also pass a second argument: an object mapping a custom type to a
transformer function. This transformer function can return
`SimpleArgumentParser.FAILURE` to indicate that the value is invalid.

Calling `billy hello something else "three ones" 1 1 1` will populate `args`
with

```js
{
	type: 'alternative',
	something: 'three ones',
	'...': [1, 1, 1]
}
```

Multiple patterns can be given to the parser, and it'll try each one in order. `...`
means that the rest of the tokens will be included in an array.

Quotation marks can be used for strings that contain spaces and other special
characters. One can also use the substitution syntax to substitute environment
variables.

### `BashlikeArgumentParser`

The Bash-like argument parser is inspired by command line command arguments.

```js
main.parser = new BashlikeArgumentParser([
	{
		name: 'option',
		aliases: ['o', 'O'],
		// Default: 'isBoolean'; can be a function
		validate: 'isString',
		description: 'Description of what the option does (for help text).',
		optional: true
	},
	// and so on
], 'Description of the overall command.')
```

Calling `billy -o "Hello Billy!"` will populate `args` with

```js
{
	option: 'Hello Billy!'
}
```

Again, `src/utils/parsers.js` contains more information.
