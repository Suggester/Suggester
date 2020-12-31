const { string } = require("../../utils/strings");
const { prefix } = require("../../config");
const { dbQuery } = require("../../utils/db");
module.exports = {
	controls: {
		name: "prefix",
		permission: 10,
		usage: "prefix",
		description: "Shows the bot's prefix on this server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
		cooldown: 5,
		dmAvailable: true,
		docs: "sumup"
	},
	do: async (locale, message, client, args, Discord) => {
		let serverPrefix = prefix;

		if (message.guild) {
			let qServerDB = await dbQuery("Server", { id: message.guild.id });
			serverPrefix = qServerDB.config.prefix;
		}
		return message.channel.send(string(locale, "SERVER_PREFIX", { prefix: Discord.Util.escapeMarkdown(serverPrefix), id: client.user.id }));
	}
};
