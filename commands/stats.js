const { colors } = require("../config.json");
const { dbQueryAll } = require("../coreFunctions");
const { Suggestion } = require("../utils/schemas");
const humanizeDuration = require("humanize-duration");
module.exports = {
	controls: {
		permission: 10,
		usage: "stats",
		aliases: ["statistics"],
		description: "Shows server/global suggestion stats",
		enabled: true,
		docs: "all/stats",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let totalSuggestionsGlobal = await Suggestion.countDocuments();
		let approvedSuggestionsGlobal = await dbQueryAll("Suggestion", {status: "approved"});
		let deniedSuggestionsGlobal = await dbQueryAll("Suggestion", {status: "denied"});
		let totalSuggestionsServer = await dbQueryAll("Suggestion", {id: message.guild.id});
		let approvedSuggestionsServer = await dbQueryAll("Suggestion", {status: "approved", id: message.guild.id});
		let deniedSuggestionsServer = await dbQueryAll("Suggestion", {status: "denied", id: message.guild.id});
		let statEmbed = new Discord.RichEmbed()
			.setTitle("Suggestion Statistics")
			.addField("Global Statistics", `**${totalSuggestionsGlobal.toString()}** submitted globally\n**${approvedSuggestionsGlobal.length}** approved globally\n**${deniedSuggestionsGlobal.length}** denied globally`)
			.addField("Server Statistics", `**${totalSuggestionsServer.length}** submitted on this server\n**${approvedSuggestionsServer.length}** approved on this server\n**${deniedSuggestionsServer.length}** denied on this server\nThe bot has been in this server for **${humanizeDuration(Date.now()-message.guild.me.joinedTimestamp)}**`)
			.setColor(colors.default);
		message.channel.send(statEmbed);
		return;
	}
};
