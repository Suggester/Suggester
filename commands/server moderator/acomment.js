const { string } = require("../../utils/strings");
const { fetchUser, dmEmbed, logEmbed } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { dbQuery, dbModify } = require("../../utils/db");
const { suggestionEditCommandCheck } = require("../../utils/checks");
const { editFeedMessage } = require("../../utils/actions");
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
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionEditCommandCheck(locale, message, args);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (!args[1]) return message.channel.send(string(locale, "NO_COMMENT_ERROR", {}, "error"));

		if (qSuggestionDB.comments && qSuggestionDB.comments.filter(c => !c.deleted).length + 1 > 23) return message.channel.send(string(locale, "TOO_MANY_COMMENTS_ERROR", {}, "error"));

		let comment = args.splice(1).join(" ");

		if (comment.length > 1024) return message.channel.send(string(locale, "COMMENT_TOO_LONG_ERROR", {}, "error"));

		qSuggestionDB.comments.push({
			comment: comment,
			author: 0,
			id: qSuggestionDB.comments.length+1,
			created: new Date()
		});

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string(locale, "ERROR", {}, "error"));

		let editFeed = await editFeedMessage({ guild: guildLocale, user: locale }, qSuggestionDB, qServerDB, client);
		if (editFeed) return message.channel.send(editFeed);

		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "ANONYMOUS_COMMENT_ADDED_TITLE"))
			.setDescription(`${qSuggestionDB.suggestion || string(locale, "NO_SUGGESTION_CONTENT")}\n[${string(locale, "SUGGESTION_FEED_LINK")}](https://discord.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.addField(string(locale, "COMMENT_TITLE_ANONYMOUS"), comment)
			.setColor(client.colors.blue)
			.setFooter(string(locale, "SUGGESTION_FOOTER", { id: id.toString() }))
			.setTimestamp(qSuggestionDB.submitted);
		message.channel.send(replyEmbed);

		let qUserDB = await dbQuery("User", { id: suggester.id });
		if (qServerDB.config.notify && qUserDB.notify) suggester.send((dmEmbed(qUserDB.locale || locale, client, qSuggestionDB, "blue", { string: "COMMENT_ADDED_DM_TITLE", guild: message.guild.name }, null, qServerDB.config.channels.suggestions, { header: string(locale, "COMMENT_TITLE_ANONYMOUS"), reason: comment }))).catch(() => {});

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "ANONYMOUS_COMMENT_ADDED_LOG", "blue")
				.addField(string(guildLocale, "COMMENT_TITLE_ANONYMOUS"), comment);
			serverLog(embedLog, qServerDB, client);
		}
	}
};
