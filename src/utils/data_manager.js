/*
* @Author: UnsignedByte
* @Date:   11:56:39, 25-May-2020
* @Last Modified by:   UnsignedByte
* @Last Modified time: 12:16:12, 25-May-2020
*/

class DataManager {
	constructor(raw){
		this.raw = raw;
	}

	get get({def:{}, args}, raw=this.raw){
		return this.get({def, args.slice(1)}, args[0] in raw || (raw[args[0]] = def))
	}
}