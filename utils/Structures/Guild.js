const { Structures: { extend } } = require("discord.js");
const { dbQueryNoNew } = require("../db");

extend("Guild", (GM) => {
	return class extends GM {
		constructor (client, data) {
			super(client, data);
			this._client = client;
			this.data = data;
		}

		get db () {
			return (async () => {
				const guild = await dbQueryNoNew("Server", { id: this.data.id });
				return guild || null;
			})();
		}
	};
});
