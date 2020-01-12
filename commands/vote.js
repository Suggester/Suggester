module.exports = {
	controls: {
		permission: 10,
		usage: "support",
		description: "Shows the link to the support server",
		enabled: true,
		docs: "all/vote",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: (message, client) => {
		return message.reply(`You can vote for Suggester on Discord Bot List at https://discordbots.org/bot/564426594144354315/vote\nIf you're in our support server, you can also get cool perks for voting! (Link is in the \`${client.servers.get(message.guild.id, "prefix")}support\` command)`);
	}
};
