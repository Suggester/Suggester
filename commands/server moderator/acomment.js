const { colors } = require("../../config.json");
const { string } = require("../../utils/strings");
const { dbQuery, serverLog, fetchUser, dbModify, suggestionEmbed, dbQueryNoNew, checkConfig, channelPermissions } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "acomment",
		permission: 3,
		aliases: ["anonymouscomment"],
		usage: "acomment <suggestion id> <comment>",
		description: "Adds a comment to an approved suggestion anonymously",
		enabled: true,
		docs: "staff/acomment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
	},
	do: async (message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(string("UNCONFIGURED_ERROR", {}, "error"));

		let missingConfig = await checkConfig(qServerDB);
		if (missingConfig) return message.channel.send(missingConfig);

		if (client.channels.cache.get(qServerDB.config.channels.suggestions)) {
			let perms = channelPermissions( "suggestions", client.channels.cache.get(qServerDB.config.channels.suggestions), client);
			if (perms) return message.channel.send(perms);
		} else return message.channel.send(string("NO_SUGGESTION_CHANNEL_ERROR", {}, "error"));

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(string("INVALID_SUGGESTION_ID_ERROR", {}, "error"));

		let id = qSuggestionDB.suggestionId;

		if (qSuggestionDB.status !== "approved") return message.channel.send(string("SUGGESTION_NOT_APPROVED_ERROR", {}, "error"));

		if (qSuggestionDB.implemented) return message.channel.send(string("SUGGESTION_IMPLEMENTED_ERROR", {}, "error"));

		if (!args[1]) return message.channel.send(string("NO_COMMENT_ERROR", {}, "error"));

		if (qSuggestionDB.comments && qSuggestionDB.comments.filter(c => !c.deleted).length + 1 > 23) return message.channel.send(string("TOO_MANY_COMMENTS_ERROR", {}, "error"));

		let comment = args.splice(1).join(" ");

		if (comment.length > 1024) return message.channel.send(string("COMMENT_TOO_LONG_ERROR", {}, "error"));

		qSuggestionDB.comments.push({
			comment: comment,
			author: 0,
			id: qSuggestionDB.comments.length+1,
			created: new Date()
		});
		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string("ERROR", {}, "error"));

		let suggestionEditEmbed = await suggestionEmbed(qSuggestionDB, qServerDB, client);
		let messageEdited;
		await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
			f.edit(suggestionEditEmbed);
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return message.channel.send(string("SUGGESTION_FEED_MESSAGE_NOT_EDITED_ERROR", {}, "error"));

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string("ANONYMOUS_COMMENT_ADDED_TILE"))
			.setDescription(`${qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT")}\n[${string("SUGGESTION_FEED_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.addField(string("COMMENT_TITLE_ANONYMOUS"), comment)
			.setColor(colors.blue)
			.setFooter(string("SUGGESTION_FOOTER", { id: id.toString() }))
			.setTimestamp();
		message.channel.send(replyEmbed);

		let qUserDB = await dbQuery("User", { id: suggester.id });
		if (qServerDB.config.notify && qUserDB.notify) {
			let dmEmbed = new Discord.MessageEmbed()
				.setTitle(string("COMMENT_ADDED_DM_TITLE", { server: message.guild.name }))
				.setDescription(`${qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT")}\n[${string("SUGGESTION_FEED_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
				.addField(string("COMMENT_TITLE_ANONYMOUS"), comment)
				.setColor(colors.blue)
				.setFooter(string("SUGGESTION_FOOTER", { id: id.toString() }))
				.setTimestamp();
			suggester.send(dmEmbed).catch(() => {});
		}

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(string("ANONYMOUS_COMMENT_ADDED_LOG", { user: message.author.tag, id: id.toString() }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.addField(string("SUGGESTION"), qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"))
				.addField(string("COMMENT_TITLE_ANONYMOUS"), comment)
				.setFooter(string("LOG_SUGGESTION_SUBMITTED_FOOTER", { id: id.toString(), user: message.author.id }))
				.setTimestamp()
				.setColor(colors.blue);
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
