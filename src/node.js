import Discord from 'discord.js'
import { promises as fs } from 'fs'

import main from './client.js'

fs.readFile(new URL('./token.json', import.meta.url), 'utf8')
	.then(JSON.parse)
	.then(({ token }) => main(token, Discord))
	.catch(err => {
		console.error(err)
	})
