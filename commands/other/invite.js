const { release } = require("../../config.json");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "invite",
		permission: 10,
		usage: "invite",
		description: "Shows the link to invite the bot",
		enabled: true,
		docs: "all/invite",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (message, client) => {
		const url = "<https://discordapp.com/oauth2/authorize?client_id=[ID]&scope=bot&permissions=805694544>";
		if (release === "special") {
			if (client.admins.has(message.author.id)) {
				return message.channel.send(string("INVITE_BOT", { name: client.user.username, link: url.replace("[ID]", client.user.id) }));
			}
			const stableId = "564426594144354315";
			return message.channel.send(string("INVITE_RESTRICTED", { link: url.replace("[ID]", stableId) }, "error"));
		}
		return message.channel.send(string("INVITE_BOT", { name: client.user.username, link: url.replace("[ID]", client.user.id) }));
	}
};
