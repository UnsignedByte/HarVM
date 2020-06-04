/*
* @Author: UnsignedByte
* @Date:   11:56:39, 25-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 23:29:31, 03-Jun-2020
*/

async function dataManager(name='data'){
	let ret = new DataManager(name);
	await ret.init();
	return ret;
}

class DataManager {
	constructor(name){
		this.loc = name;
	}

	async init(){
		if (typeof process !== 'undefined' && process.versions && process.versions.node) {
			//if using node
			const url = new URL(`../../data/${this.loc}.json`, import.meta.url)
			// const { promises: fs } = require('fs')
			const { promises: fs } = await import('fs')
			this.raw = JSON.parse(await fs.readFile(url, 'utf8').catch(err => {
					// If the file doesn't exist, return null like what localStorage does
					if (err.code === 'ENOENT') {
						return null
					} else {
						return Promise.reject(err)
					}
				}))||{}
			this.save = async ()=>await fs.writeFile(url, JSON.stringify(this.raw))
		} else {
			//if not
			const url = `[HarVM] ${this.loc}`;
			await import('localforage');
			this.raw = await localforage.getItem(url)||{};
			this.save = async ()=>await localforage.setItem(url, this.raw)
		}
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
		def = typeof def !== 'undefined' ? def:{};

		if(!(arg in raw)){
			raw[arg] = otherArgs.length===0 ? def:{};
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
		this.get({args})[lastArg] = value;
	}
}

export default dataManager
