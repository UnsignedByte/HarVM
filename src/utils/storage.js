// Detect Node vs browser

// Apparently this is ok
// https://rollupjs.org/guide/en/#how-bindings-work
export let getItem
export let setItem
export let removeItem

export let ready

// https://stackoverflow.com/a/31456668
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
	const storageFolder = new URL('./node-storage/', import.meta.url)

	ready = Promise.all([import('fs'), import('buffer')])
		.then(async ([{ promises: fs }, { Buffer }]) => {
			function keyToPath (key) {
				// https://stackoverflow.com/a/23097961
				return new URL(`./${
					Buffer.from(key)
						.toString('base64')
						.replace(/\//g, '_')
						.replace(/\+/g, '-')
				}.json`, storageFolder)
			}

			await fs.mkdir(storageFolder)
				.catch(err => {
					// Only reject if the error isn't about the folder already existing
					if (err.code !== 'EEXIST') return Promise.reject(err)
				})
			getItem = key => fs.readFile(keyToPath(key), 'utf8')
				.catch(err => {
					// If the file doesn't exist, return null like what localStorage does
					if (err.code === 'ENOENT') {
						return null
					} else {
						return Promise.reject(err)
					}
				})
			setItem = (key, value) => fs.writeFile(keyToPath(key), value)
			removeItem = key => fs.unlink(keyToPath(key)).catch(err => null)
		})
} else {
	// Using localForage because it's asynchronous and "better" according to the
	// Chrome people.
	ready = import('localforage')
		.then(() => {
			getItem = key => localforage.getItem(key)
			setItem = (key, value) => localforage.setItem(key, value)
			removeItem = key => localforage.removeItem(key)
		})
}
