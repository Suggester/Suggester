const { support_invite } = require("../../config.json");
const { string } = require("../../utils/strings");
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
	do: async (locale, message) => {
		let lists = {
			"topgg": "https://top.gg/bot/564426594144354315/vote",
			"botlistspace": "https://botlist.space/bot/564426594144354315/upvote",
			"bfd": "https://botsfordiscord.com/bot/564426594144354315/vote",
			"dbl": "https://discordbotlist.com/bots/564426594144354315/upvote",
			"dboats": "https://discord.boats/bot/564426594144354315/vote",
			"gbl": "https://glennbotlist.xyz/bot/suggester/vote",
			"bod": "https://bots.ondiscord.xyz/bots/564426594144354315/review"
		};

		return message.channel.send(string(locale, "VOTE_INFO", { link: `<https://discord.gg/${support_invite}>`, links: `<${Object.values(lists).join(">\n<")}>` }));
	}
};
