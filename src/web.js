/*
* @Author: UnsignedByte
* @Date:   22:53:08, 24-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 21:32:36, 03-Jun-2020
*/
import './utils/_dom2.js'
import Discord from "../discord/discord.js"
import main from "./client.js"
// import * as storage from './utils/storage.js'

const TOKEN_KEY = '[HarVM] token'
const NO_STORE = 'please do not store token in localStorage thank'

let token = localStorage.getItem(TOKEN_KEY)
const tokenInput = Elem('input', {
	type: 'text',
	value: token === NO_STORE ? '' : token,
	onchange: () => {
    	if (!storeInput.checked) {
    		localStorage.setItem(TOKEN_KEY, tokenInput.value)
    	}
    }
})
const storeInput = Elem('input', {
	type: 'checkbox',
	checked: token === NO_STORE,
	onchange: () => {
			if (storeInput.checked) {
				localStorage.setItem(TOKEN_KEY, NO_STORE)
			} else {
				localStorage.setItem(TOKEN_KEY, tokenInput.value)
			}
		}
	})
	document.body.appendChild(Fragment([
	Elem('p', {}, [
		Elem('label', {}, [
			'Token: ',
			tokenInput
		])
	]),
	Elem('p', {}, [
		Elem('label', {}, [
			storeInput,
			'Do not store token in localStorage',
		])
	]),
	Elem('button', {
		autofocus: true,
		onclick: () => {
			empty(document.body)
			main(tokenInput.value, Discord).catch(err => {
				console.error(err)
				document.body.appendChild(Elem('p', {}, ['There was a problem. Check the console?']))
			})
		}
	}, ['Start'])
]))
