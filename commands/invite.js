const config = require("../config.json");
module.exports = {
	controls: {
		permission: 10,
		usage: "invite",
		description: "Shows the link to invite the bot",
		enabled: true,
		docs: "all/invite",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {
		if (config.release === "stable") return message.reply(`You can invite Suggester to your server with this link: <https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=604367937>`);
		if (config.release === "canary") {
			if (client.guilds.get(config.main_guild) && client.guilds.get(config.main_guild).available && client.guilds.get(config.main_guild).roles.get("614084573139173389").members.get(message.author.id)) {
				let embed = new Discord.RichEmbed()
					.setDescription("<:canary:621530343081508899> You are a member of the Canary program!")
					.addField("Invite", `You can invite the Canary bot to your server with this link: <https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=604367937>`)
					.setColor(config.default_color);
				return message.reply("This instance of Suggester is the **Canary** version. You must apply to be a part of the Canary program on the main server.\nYou can invite the **public** version of Suggester at <https://discordapp.com/oauth2/authorize?client_id=564426594144354315&scope=bot&permissions=604367937>.", embed);
			} else {
				return message.reply("This instance of Suggester is the **Canary** version. You must apply to be a part of the Canary program on the main server.\nYou can invite the **public** version of Suggester at <https://discordapp.com/oauth2/authorize?client_id=564426594144354315&scope=bot&permissions=604367937>.");
			}
		}
		if (config.release === "special") {
			if (config.developer.includes(message.author.id)) {
				let embed = new Discord.RichEmbed()
					.setDescription("<:suggester:621530308592009242> You are a global administrator!")
					.addField("Invite", `You can invite this instance of the bot to your server with this link: <https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=604367937>`)
					.setColor(config.default_color);
				return message.reply("This instance of Suggester is a private version made specifically for a server.\nYou can invite the **public** version of Suggester at <https://discordapp.com/oauth2/authorize?client_id=564426594144354315&scope=bot&permissions=604367937>.", embed);
			}
			return message.reply("This instance of Suggester is a private version made specifically for a server.\nYou can invite the **public** version of Suggester at <https://discordapp.com/oauth2/authorize?client_id=564426594144354315&scope=bot&permissions=604367937>.");
		}
	}
};
