const { colors, emoji } = require("../config.json");
const { dbQueryAll, checkPermissions } = require("../coreFunctions");
const { Suggestion, Server } = require("../utils/schemas");
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
		let server;
		let permission = await checkPermissions(message.member, client);
		if (!args[0] || permission > 1) server = message.guild;
		else if (client.guilds.get(args[0])) server = client.guilds.get(args[0]);
		if (!server) return message.channel.send(`<:${emoji.x}> I couldn't find a guild with ID \`${args[0]}\``);
		let totalSuggestionsGlobal = await Suggestion.countDocuments();
		let totalConfiguredServers = await Server.countDocuments();
		let approvedSuggestionsGlobal = await dbQueryAll("Suggestion", {status: "approved"});
		let deniedSuggestionsGlobal = await dbQueryAll("Suggestion", {status: "denied"});
		let totalSuggestionsServer = await dbQueryAll("Suggestion", {id: server.id});
		let approvedSuggestionsServer = await dbQueryAll("Suggestion", {status: "approved", id: server.id});
		let deniedSuggestionsServer = await dbQueryAll("Suggestion", {status: "denied", id: server.id});
		let suggestionsUserGlobal = await dbQueryAll("Suggestion", {suggester: message.author.id});
		let suggestionsUserServer = await dbQueryAll("Suggestion", {suggester: message.author.id, id: server.id});
		let statEmbed = new Discord.RichEmbed()
			.setTitle(`Suggestion Statistics for **${server.name}**`)
			.addField("Global Statistics", `**${client.guilds.size}** servers\n**${totalConfiguredServers}** server configurations\n**${totalSuggestionsGlobal.toString()}** suggestions submitted globally\n**${approvedSuggestionsGlobal.length}** suggestions approved globally\n**${deniedSuggestionsGlobal.length}** suggestions denied globally`)
			.addField("Server Statistics", `**${totalSuggestionsServer.length}** suggestions submitted on this server\n**${approvedSuggestionsServer.length}** suggestions approved on this server\n**${deniedSuggestionsServer.length}** suggestions denied on this server\nThe bot has been in this server for **${humanizeDuration(Date.now()-server.me.joinedTimestamp)}**`)
			.addField("Your Statistics", `**${suggestionsUserGlobal.length}** suggestions submitted globally\n**${suggestionsUserServer.length}** suggestions submitted on this server\n**${client.guilds.filter(guild => guild.members.find(member => member.id === message.author.id)).size}** shared servers with the bot`)
			.setColor(colors.default);
		message.channel.send(statEmbed);
		return;
	}
};
