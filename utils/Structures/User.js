const { Structures: { extend } } = require("discord.js");
const { dbQueryNoNew } = require("../../coreFunctions");

extend("User", (GM) => {
	return class extends GM {
		constructor (client, data) {
			super(client, data);
			this._client = client;
			this.data = data;
		}

		get db () {
			return (async () => {
				const user = await dbQueryNoNew("User", { id: this.data.id });
				return user || null;
			})();
		}

		get flags () {
			return (async () => {
				const user = await dbQueryNoNew("User", { id: this.data.id });
				return user.flags || null;
			})();
		}
	};
});
