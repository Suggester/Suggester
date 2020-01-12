const config = require("../config.json");
module.exports = {
	controls: {
		permission: 10,
		usage: "support",
		description: "Shows the link to the support server",
		enabled: true,
		docs: "all/support",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: (message, client, args, Discord) => {
		return message.reply(`Need help with the bot? Join our support server at https://discord.gg/${config.support_invite} :wink:`);
	}
};
