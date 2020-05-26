/*
* @Author: UnsignedByte
* @Date:   11:56:39, 25-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 00:45:05, 26-May-2020
*/

class DataManager {
	constructor(raw, saveloc='[HarVM] data'){
		this.raw = raw;
		this.loc = saveloc;
	}

	#save = ()=>{
		localStorage.setItem(this.loc, JSON.stringify(this.raw))
	} 

	get({def, args}, raw=this.raw){
		this.#save();
		def = {} || def
		return (args.length===0 && raw) || this.get({ def, args:args.slice(1) }, (args[0] in raw && args[0]) || (raw[args[0]] = def))
	}

	set({def, args}, value){
		this.get({def, args:args.slice(0, args.length-1)})[args[args.length-1]] = value;
	}
}

export default DataManager