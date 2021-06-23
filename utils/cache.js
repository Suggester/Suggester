const NodeCache = require("node-cache");

class Cache {
	constructor(ttl = 600) {
		this.users = new NodeCache({ ttl });
		this.guilds = new NodeCache({ ttl });
		this.suggestions = new NodeCache({ ttl });
	}
}

module.exports = new Cache();
