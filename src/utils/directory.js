import fetch from 'node-fetch'

function fetchDirectory (url, keyName) {
	// https://docs.google.com/spreadsheets/d/e/<id>/pub?gid=0&single=true&output=tsv
	return fetch(url)
		.then(r => r.ok ? r.text() : Promise.reject(new Error(`${r.statusCode} error`)))
		.then(tsv => {
			const [headers, ...lines] = tsv.split(/\r?\n/)
				.map(line => line.split('\t'))
			return Object.fromEntries(lines.map(line => {
				const info = Object.fromEntries(line.map((item, i) => [headers[i], item]))
				return [info[keyName], info]
			}))
		})
}

export {
	fetchDirectory
}
