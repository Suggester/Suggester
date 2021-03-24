const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "stats",
		permission: 10,
		usage: "stats",
		aliases: ["statistics"],
		description: "Shows the link to bot statistics",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
		cooldown: 20,
                docs: "topics/stats" 
		
	},
	do: async (locale, message) => {
		let chart_link = "https://charts.mongodb.com/charts-suggesterproduction-vredm/public/dashboards/79485b0d-217d-4d7d-9010-429befa016e9";
		return message.channel.send(string(locale, "STATS_RESPONSE", { link: chart_link }));
	}
};
