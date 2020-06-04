import Discord from 'discord.js'
import { promises as fs } from 'fs'

import main from './client.js'

fs.readFile(new URL('../data/token.txt', import.meta.url), 'utf8')
	.then(token => main(token.trim(), Discord))
	.catch(err => {
		console.error(err)
	})
