let { dbQuery } = require("../coreFunctions");
module.exports = {
	controls: {
		permission: 10,
		usage: "support",
		description: "Shows the link to the support server",
		enabled: true,
		docs: "all/vote",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: async (message, client) => {
		let server = await dbQuery("Server",{ id: message.guild.id });
		return message.reply(`You can vote for Suggester on Discord Bot List at https://top.gg/bot/564426594144354315/vote\nIf you're in our support server, you can also get cool perks for voting! (Link is in the \`${server.config.prefix}support\` command)`);
	}
};
