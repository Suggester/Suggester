const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "blacklisttemp",
		permission: 10,
		aliases: ["blacklist", "unblacklist"],
		usage: "blacklisttemp",
		description: "Shows information about the deprecated blacklist command",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"]
	},
	do: async (locale, message, client, args, Discord) => {
		message.channel.send(new Discord.MessageEmbed()
			.setDescription(string(locale, "BLACKLIST_DEPRECATED_INFO"))
			.setColor("BLACK"));
	}
};
