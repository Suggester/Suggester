const { string } = require("../../utils/strings");
const { checkPermissions } = require("../../utils/checks");
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

			if (args[0]) {
				let permission = await checkPermissions(message.member || message.author, client);
				let configCmd = require("../configuration/config");
				if (permission <= configCmd.controls.permission) return configCmd.do(locale, message, client, ["prefix"].concat(args), Discord);
			}
		}
		return message.channel.send(string(locale, "SERVER_PREFIX", { prefix: Discord.Util.escapeMarkdown(serverPrefix), id: client.user.id }));
	}
};
