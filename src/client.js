import Discord from "../discord/discord.js"

import * as commands from './commands.js'
import { escapeRegex } from './utils/str.js'

const { Client } = Discord

export default function main (token) {
  // Create an instance of a Discord client
  const client = new Client()

  client.prefix = escapeRegex(localStorage.getItem('[HarVM] prefix'))
  client.data = JSON.parse(localStorage.getItem('[HarVM] data')) || {}

  client.on('ready', () => {
    console.log('ready')
  })

  const commandParser = new RegExp(`^${client.prefix}(\\w+)(?:\\s+(\\w+))?\\s*`)

  console.log(commandParser);

  client.on('message', async msg => {
    if (!msg.author.bot) {
      // We can make this fancier by making a standard embed response thing
      function reply (message, options={}) {
        msg.channel.send(`Requested by ${msg.author.tag}:\n${message}`, options)
      }
      
      const match = msg.content.match(commandParser)
      console.log(match)
      if (match) {
        const [matched, commandName, subCommandName] = match
        const command = commands[commandName]
        if (command) {
          const subCommand = command[subCommandName] || command.default
          if (subCommand) {
            subCommand({
              client,
              unparsedArgs: msg.content.slice(match.index + matched.length),
              msg,
              reply
            })
            localStorage.setItem('[HarVM] data', JSON.stringify(client.data))
          }
        } else {
          reply(`Unknown command \`${command}\``)
        }
      }
    }
  })

  client.login(token)
}
