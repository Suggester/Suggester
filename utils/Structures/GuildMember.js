const { Structures: { extend } } = require("discord.js");
const { dbQueryNoNew } = require("../../coreFunctions");

extend("GuildMember", (GM) => {
	return class extends GM {
		constructor (client, data, guild) {
			super(client, data, guild);
			this._client = client;
			this.data = data;
			this.guild = guild;
		}

		get db () {
			return (async () => {
				const user = await dbQueryNoNew("User", { id: this.data.user.id });
				return user || null;
			})();
		}

		get flags () {
			return (async () => {
				const user = await dbQueryNoNew("User", { id: this.data.user.id });
				return user.flags || null;
			})();
		}
	};
});
