const { Structures: { extend } } = require("discord.js");
const { dbQueryNoNew } = require("../db");

extend("User", (GM) => {
	return class extends GM {
		constructor (client, data) {
			super(client, data);
			this._client = client;
			this.data = data;
		}

		get unknown () {
			return ({
				username: "Unknown User",
				id: "0",
				tag: "Unknown User#0000",
				displayAvatarURL () {
					return "https://discord.com/assets/322c936a8c8be1b803cd94861bdfa868.png";
				},
				send () {
					return null;
				}
			});
		}

		get db () {
			return (async () => {
				const user = await dbQueryNoNew("User", { id: this.data.id });
				return user || null;
			})();
		}

		get db_flags () {
			return (async () => {
				const user = await dbQueryNoNew("User", { id: this.data.id });
				return user.flags || null;
			})();
		}
	};
});
