const config = require("../../config.json");
const { checkPermissions } = require("../../coreFunctions");
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
		const url = "<https://discordapp.com/oauth2/authorize?client_id=[ID]&scope=bot&permissions=872803409>";
		let stableId = "564426594144354315";
		if (config.release === "stable") return message.reply(`You can invite Suggester to your server with this link: ${url.replace("[ID]", client.user.id)}`);
		if (config.release === "canary") {
			let userPermission = await checkPermissions(message.member, client);
			if (client.guilds.cache.get(config.main_guild) && client.guilds.cache.get(config.main_guild).available && client.guilds.cache.get(config.main_guild).roles.cache.get("614084573139173389").members.get(message.author.id) || userPermission <= 1) {
				return message.channel.send(`You can invite the Canary bot to your server with this link: ${url.replace("[ID]", client.user.id)}`);
			} else {
				return message.channel.send(`This instance of Suggester is the **Canary** version. You must apply to be a part of the Canary program on the main server.\nYou can invite the **public** version of Suggester at ${url.replace("[ID]", stableId)}`);
			}
		}
		if (config.release === "special") {
			if (config.developer.includes(message.author.id)) {
				return message.channel.send(`You can invite this instance of the bot to your server with this link: ${url.replace("[ID]", client.user.id)}`);
			}
			return message.channel.send(`This instance of Suggester is a private version.\nYou can invite the **public** version of Suggester at ${url.replace("[ID]", stableId)}`);
		}
	}
};
