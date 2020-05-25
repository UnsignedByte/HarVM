import Discord from "./discord.js"

const { Client } = Discord

export default function main (token) {
  // Create an instance of a Discord client
  const client = new Client()

  client.prefix = localStorage.getItem('[HarVM] prefix')

  client.on('ready', () => {
    console.log('ready')
  })

  client.on('message', async msg => {
    if (msg.mentions.has(client.user)) {
      return msg.reply(`try ${client.prefix}help`);
    }
  })

  client.login(token)
}