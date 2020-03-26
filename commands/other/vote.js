let { dbQuery } = require("../../coreFunctions");
const { prefix } = require("../../config.json");
module.exports = {
	controls: {
		name: "vote",
		permission: 10,
		usage: "vote",
		description: "Shows the link to vote for the bot on top.gg",
		enabled: true,
		docs: "all/vote",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: async message => {
		let server = await dbQuery("Server",{ id: message.guild.id });
		return message.reply(`You can vote for Suggester on Discord Bot List at https://top.gg/bot/564426594144354315/vote\nIf you're in our support server, you can also get cool perks for voting! (Link is in the \`${server.config.prefix || prefix}support\` command)`);
	}
};
