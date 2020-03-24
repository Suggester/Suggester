const { colors, emoji } = require("../../config.json");
const { dbQueryAll, checkPermissions } = require("../../coreFunctions");
const { Server } = require("../../utils/schemas");
const humanizeDuration = require("humanize-duration");
module.exports = {
	controls: {
		name: "stats",
		permission: 10,
		usage: "stats",
		aliases: ["statistics"],
		description: "Shows server/global suggestion stats",
		enabled: true,
		docs: "all/stats",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let server;
		let permission = await checkPermissions(message.member, client);
		if (!args[0] || permission > 1) server = message.guild;
		else if (client.guilds.cache.get(args[0])) server = client.guilds.cache.get(args[0]);
		if (!server) return message.channel.send(`<:${emoji.x}> I couldn't find a guild with ID \`${args[0]}\``);
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
			.setTitle("Suggestion Statistics")
			.addField("Global Statistics", `**${client.guilds.cache.size}** servers\n**${totalConfiguredServers}** server configurations\n**${suggestions.length.toString()}** suggestions submitted globally\n**${approvedSuggestionsGlobal.length}** suggestions approved globally\n**${deniedSuggestionsGlobal.length}** suggestions denied globally`)
			.addField(`Server Statistics for **${server.name}**`, `**${totalSuggestionsServer.length}** suggestions submitted on this server\n**${approvedSuggestionsServer.length}** suggestions approved on this server\n**${deniedSuggestionsServer.length}** suggestions denied on this server\nThe bot has been in this server for **${humanizeDuration(Date.now()-server.me.joinedTimestamp)}**`)
			.addField("Your Statistics", `**${suggestionsUserGlobal.length}** suggestions submitted globally\n**${suggestionsUserServer.length}** suggestions submitted on this server\n**${client.guilds.cache.filter(guild => guild.members.cache.get(message.author.id)).size}** shared servers with the bot`)
			.setColor(colors.default);
		message.channel.send(statEmbed);
		return;
	}
};
