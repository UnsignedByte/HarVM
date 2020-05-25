import Discord from "../discord/discord.js"

import * as commands from './commands.js'
import { escapeRegex } from './utils/str.js'

const { Client } = Discord

export default function main (token) {
  // Create an instance of a Discord client
  const client = new Client()

  client.prefix = escapeRegex(localStorage.getItem('[HarVM] prefix'))

  client.on('ready', () => {
    console.log('ready')
  })

  const commandParser = `^${client.prefix}(\w+)(?:\s+(\w+))?\s*`

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
            return subCommand({
              client,
              unparsedArgs: msg.content.slice(match.index + matched.length),
              msg,
              reply
            })
          }
        } else {
          reply(`Unknown command \`${command}\``)
        }
      } else {
        reply(`I'm not sure what you mean. Make sure your message is in the following format:\n> ${client.prefix}<command> [subcommand] [...arguments]\nFor example,\n> ${client.prefix}help`)
      }
    }
  })

  client.login(token)
}