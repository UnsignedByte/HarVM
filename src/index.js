const {
  Client
} = require('discord.js')

const { token } = require('./token.json')

const client = new Client()

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
  if (msg.content.startsWith('ping')) {
    msg.reply(msg.content.slice(4))
  }
})

client.login(token)

