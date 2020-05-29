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

	/**
	 * Gets a value given a path. It recursively traverses the given JSON using a
	 * list of keys.
	 * @param {*} [options.def={}] - The default value. If a key doesn't exist in
	 * `raw`, it'll set it to this default value before continuing to recurse.
	 * @param {string[]} options.args - A list of keys to recursively traverse
	 * through.
	 * @param {Object<string, *>} [raw] - A JSON object containing the stored
	 * data. By default, it uses the DataManager's saved data.
	 * @returns {*}
	 */
	// Doing `def={}` here will result in a circular JSON structure because the
	// same object reference will be passed down as it recurses LOL
	get({def, args}, raw=this.raw){
		if (args.length === 0) {
			return raw;
		}
		const [arg, ...otherArgs] = args
		if (!(arg in raw)) {
			raw[arg] = typeof def !== 'undefined' ? def : {};
		}
		return this.get({ def, args: otherArgs }, raw[arg]);
	}

	/**
	 * Similar to `get`; it gets the wrapper object using `get`, sets it to the
	 * given value, and saves.
	 * @async
	 * @param {*} [options.def] - The default value for the `get` method (see
	 * above.)
	 * @param {string[]} options.args - A list of keys for traversing the
	 * DataManager's saved data.
	 * @param {*} value - The value to set at the given location.
	 */
	// Shallow clone the `args` array because it is modified using .pop.
	set({def, args: [...args]}, value){
		const lastArg = args.pop()
		this.get({def, args})[lastArg] = value;
		return this.#save();
	}
}

export default DataManager
