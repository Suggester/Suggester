const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "stats",
		permission: 10,
		usage: "stats",
		aliases: ["statistics"],
		description: "Shows the link to bot statistics",
		enabled: true,
		docs: "all/stats",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
		cooldown: 20
	},
	do: async (message) => {
		let chart_link = "https://suggester.js.org/#/botstats";
		return message.channel.send(string("STATS_RESPONSE", { link: chart_link }));
	}
};
