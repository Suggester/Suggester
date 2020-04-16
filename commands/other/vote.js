const { support_invite, colors } = require("../../config.json");
module.exports = {
	controls: {
		name: "vote",
		permission: 10,
		usage: "vote",
		description: "Shows the link to info about voting",
		enabled: true,
		docs: "all/vote",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: async (message, client, args, Discord) => {
		let lists = {
			"topgg": "https://top.gg/bot/564426594144354315/vote",
			"botlistspace": "https://botlist.space/bot/564426594144354315/upvote",
			"bfd": "https://botsfordiscord.com/bot/564426594144354315/vote",
			"dbl": "https://discordbotlist.com/bots/564426594144354315/upvote",
			"dboats": "https://discord.boats/bot/564426594144354315/vote",
			"divine": "https://divinediscordbots.com/bot/564426594144354315/vote",
			"gbl": "https://glennbotlist.xyz/bot/suggester/vote",
			"bod": "https://bots.ondiscord.xyz/bots/564426594144354315/review"
		};

		let embed = new Discord.MessageEmbed()
			.setTitle("Voting Information")
			.setDescription(`Voting on various bot lists sites really helps support Suggester, so as thanks we allow you to purchase various roles in the [Support Server](https://discord.gg/${support_invite}) with the votes you accumulate!`)
			.addField("How Voting Works", "We provide links (see below) that you can use to vote for the bot. When you vote, it gets logged in the support server and on our vote tracking bot.\nEach vote is 1 more for your total, except in these scenarios:\n> - You vote on top.gg on Friday, Saturday, or Sunday (GMT) `+2 Votes`\n> - You vote 5 times in a row (keep a streak) on __any__ bot list site `+1 Extra Vote per 5 Day Streak`\n> - You leave a review on [Bots on Discord](https://bots.ondiscord.xyz/bots/564426594144354315/review), then use the **v!checkreview** command in the support server `+3 Votes`")
			.addField("Where to Vote", `You can vote on all of the following sites:\n**[top.gg](${lists.topgg})** (Once every 12 hours)\n**[botlist.space](${lists.botlistspace})** (Once every 24 hours)\n**[Bots for Discord](${lists.bfd})** (Once every day, resets at midnight UTC)\n**[Discord Bot List](${lists.dbl})** (Once every 24 hours)\n**[Discord Boats](${lists.dboats})** (Once every 12 hours)\n**[Divine Discord Bot List](${lists.divine})** (Once every 24 hours)\n**[Glenn Bot List](${lists.gbl})** (Once every 12 hours)`)
			.addField("Rewards!", "Use the **v!buy** command in the support server to see a list of all rewards we offer for voting, and use **v!stats** to check your vote count!")
			.setColor(colors.default);
		return message.channel.send(embed);
	}
};
