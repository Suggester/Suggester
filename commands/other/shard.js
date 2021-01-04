const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "shard",
		permission: 10,
		usage: "shard",
		description: "Shows the shard this server is on",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
		cooldown: 20,
		docs: "sumup"
	},
	do: async (locale, message, client) => {
		message.channel.send(string(locale, "SHARD_INFO", { shard: client.shard.ids[0].toString() }));
	}
};
