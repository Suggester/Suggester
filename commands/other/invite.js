const { release } = require("../../config.json");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "invite",
		permission: 10,
		usage: "invite",
		description: "Shows the link to invite the bot",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
		cooldown: 5,
		dmAvailable: true
	},
	do: async (locale, message, client) => {
		if (release === "special") {
			if (client.admins.has(message.author.id)) {
				return message.channel.send(string(locale, "INVITE_BOT", { name: client.user.username, link: module.exports.url.replace("[ID]", client.user.id) }));
			}
			const stableId = "564426594144354315";
			return message.channel.send(string(locale, "INVITE_RESTRICTED", { link: module.exports.url.replace("[ID]", stableId) }, "error"));
		}
		return message.channel.send(string(locale, "INVITE_BOT", { name: client.user.username, link: module.exports.url.replace("[ID]", client.user.id) }));
	},
	url: "<https://discord.com/oauth2/authorize?client_id=[ID]&scope=bot&permissions=805694544>"
};
