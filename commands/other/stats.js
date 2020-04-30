const { colors, } = require("../../config.json");
const { dbQueryAll, checkPermissions } = require("../../coreFunctions");
const { Server } = require("../../utils/schemas");
const humanizeDuration = require("humanize-duration");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "stats",
		permission: 10,
		usage: "stats",
		aliases: ["statistics"],
		description: "Shows server/global suggestion stats",
		enabled: true,
		docs: "all/stats",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20
	},
	do: async (message, client, args, Discord) => {
		let server;
		let permission = await checkPermissions(message.member, client);
		if (!args[0] || permission > 1) server = message.guild;
		else if (client.guilds.cache.get(args[0])) server = client.guilds.cache.get(args[0]);
		if (!server) return message.channel.send(string("INVALID_GUILD_ID_ERROR", {}, "error"));

		message.channel.startTyping();
		let totalConfiguredServers = await Server.countDocuments();

		let suggestions = await dbQueryAll("Suggestion", {});
		let approvedSuggestionsGlobal = suggestions.filter(s => s.status === "approved");
		let deniedSuggestionsGlobal = suggestions.filter(s => s.status === "denied");
		let totalSuggestionsServer = suggestions.filter(s => s.id === server.id);
		let approvedSuggestionsServer = suggestions.filter(s => s.id === server.id && s.status === "approved");
		let deniedSuggestionsServer = suggestions.filter(s => s.id === server.id && s.status === "denied");
		let suggestionsUserGlobal = suggestions.filter(s => s.suggester === message.author.id);
		let suggestionsUserServer = suggestions.filter(s => s.suggester === message.author.id && s.id === server.id);
		let statEmbed = new Discord.MessageEmbed()
			.setTitle(string("STATS_TITLE"))
			.addField(string("GLOBAL_STATS_TITLE"), `${string("PING_GUILD_COUNT_HEADER")}: **${client.guilds.cache.size}**\n${string("TOTAL_CONFIGS_STATS")}: **${totalConfiguredServers}**\n${string("TOTAL_SUBMITTED_STATS")}: **${suggestions.length.toString()}**\n**${approvedSuggestionsGlobal.length}** suggestions approved globally\n**${deniedSuggestionsGlobal.length}** suggestions denied globally`)
			.addField(string("SERVER_STATS_TITLE", { server: server.name }), `**${totalSuggestionsServer.length}** suggestions submitted on this server\n**${approvedSuggestionsServer.length}** suggestions approved on this server\n**${deniedSuggestionsServer.length}** suggestions denied on this server\nThe bot has been in this server for **${humanizeDuration(Date.now()-server.me.joinedTimestamp)}**`)
			.addField(string("USER_STATS_TITLE"), `**${suggestionsUserGlobal.length}** suggestions submitted globally\n**${suggestionsUserServer.length}** suggestions submitted on this server`)
			.setColor(colors.default);
		message.channel.send(statEmbed);
		message.channel.stopTyping();
		return;
	}
};
