/*
* @Author: UnsignedByte
* @Date:   11:56:39, 25-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 00:48:46, 26-May-2020
*/

import * as storage from './storage.js'

class DataManager {
	constructor(raw, saveloc='[HarVM] data'){
		this.raw = raw;
		this.loc = saveloc;
	}

	#save = ()=>{
		return storage.setItem(this.loc, JSON.stringify(this.raw))
	}

	get({def, args}, raw=this.raw){
		def = {} || def
		return (args.length===0 && raw) || this.get({ def, args:args.slice(1) }, (args[0] in raw && args[0]) || (raw[args[0]] = def))
	}

	set({def, args}, value){
		// Why is it saving before setting??
		this.#save();
		this.get({def, args:args.slice(0, args.length-1)})[args[args.length-1]] = value;
	}
}

export default DataManager
