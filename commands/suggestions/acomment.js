const { string } = require("../../utils/strings");
const { fetchUser, logEmbed } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { dbModify } = require("../../utils/db");
const { suggestionEditCommandCheck } = require("../../utils/checks");
const { editFeedMessage, notifyFollowers } = require("../../utils/actions");
const { cleanCommand } = require("../../utils/actions");
const { trelloComment } = require("../../utils/trello");
module.exports = {
	controls: {
		name: "acomment",
		permission: 3,
		aliases: ["anonymouscomment"],
		usage: "acomment [suggestion id] [comment]",
		description: "Adds a comment to an approved suggestion anonymously",
		examples: "`{{p}}acomment 1 This is a comment`\nAnonymously comments on suggestion #1 with \"This is a comment\"",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10,
		docs: "staff/acomment"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionEditCommandCheck(locale, message, args);
		if (returned) return message.channel.send(returned).then(sent => returned instanceof Discord.MessageEmbed ? null : cleanCommand(message, sent, qServerDB));
		let guildLocale = qServerDB.config.locale;

		if (!args.slice(1).join(" ").trim()) return message.channel.send(string(locale, "NO_COMMENT_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		if (qSuggestionDB.comments && qSuggestionDB.comments.filter(c => !c.deleted).length + 1 > 15) return message.channel.send(string(locale, "TOO_MANY_COMMENTS_ERROR_NEW", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let comment = args.splice(1).join(" ");

		if (comment.length > 1024) return message.channel.send(string(locale, "COMMENT_TOO_LONG_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let trello_comment = await trelloComment(qServerDB, {}, qSuggestionDB, comment);
		qSuggestionDB.comments.push({
			comment: comment,
			author: 0,
			id: qSuggestionDB.comments.length+1,
			created: new Date(),
			trello_comment
		});

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string(locale, "ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let editFeed = await editFeedMessage({ guild: guildLocale, user: locale }, qSuggestionDB, qServerDB, client);
		if (editFeed) return message.channel.send(editFeed).then(sent => cleanCommand(message, sent, qServerDB));

		await dbModify("Suggestion", { suggestionId: id, id: message.guild.id }, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "ANONYMOUS_COMMENT_ADDED_TITLE"))
			.setDescription(`${qSuggestionDB.suggestion || string(locale, "NO_SUGGESTION_CONTENT")}\n[${string(locale, "SUGGESTION_FEED_LINK")}](https://discord.com/channels/${qSuggestionDB.id}/${qSuggestionDB.channels.suggestions || qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.addField(string(locale, "COMMENT_TITLE_ANONYMOUS"), comment)
			.setColor(client.colors.blue)
			.setFooter(string(locale, "SUGGESTION_FOOTER", { id: id.toString() }))
			.setTimestamp(qSuggestionDB.submitted);
		message.channel.send(replyEmbed).then(sent => cleanCommand(message, sent, qServerDB));

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "ANONYMOUS_COMMENT_ADDED_LOG", "blue")
				.addField(string(guildLocale, "COMMENT_TITLE_ANONYMOUS"), comment);
			serverLog(embedLog, qServerDB, client);
		}

		await notifyFollowers(client, qServerDB, qSuggestionDB, "blue", { string: "COMMENT_ADDED_DM_TITLE", guild: message.guild.name }, null, qServerDB.config.channels.suggestions, { header: "COMMENT_TITLE_ANONYMOUS", reason: comment });
	}
};
