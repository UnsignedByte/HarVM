// Detect Node vs browser

// Apparently this is ok
// https://rollupjs.org/guide/en/#how-bindings-work
export let getItem
export let setItem
export let removeItem

export let ready

// https://stackoverflow.com/a/31456668
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
	const params = new URL('../../params.json', import.meta.url)

	ready = Promise.all([import('fs'), import('buffer')])
		.then(async ([{ promises: fs }, { Buffer }]) => {
			getItem = key => fs.readFile(params, 'utf8')
				.then(val => JSON.parse(key===undefined?val:val[key]))
				.catch(err => {
					// If the file doesn't exist, return null like what localStorage does
					if (err.code === 'ENOENT') {
						return null
					} else {
						return Promise.reject(err)
					}
				})
			setItem = (key, value) => fs.writeFile(params, JSON.stringify(Object.assign(await getItem(), {key:JSON.parse(value)})))
			removeItem = key => await getItem().then(val => {delete val[key]; return val}).then(val=>fs.writeFile(params, JSON.stringify(val))).catch(err => null)
		})
} else {
	const params = '[HarVM] params';
	// Using localForage because it's asynchronous and "better" according to the
	// Chrome people.
	ready = import('localforage')
		.then(() => {
			getItem = key => (val=> key===undefined?val:val[key])(localforage.getItem(params))
			setItem = (key, value) => localforage.setItem(params, JSON.stringify(Object.assign(await getItem(), {key:JSON.parse(value)})))
			removeItem = key => await getItem().then(val => {delete val[key]; return val}).then(val=>localforage.setItem(params, JSON.stringify(val))).catch(err => null)
		})
}
