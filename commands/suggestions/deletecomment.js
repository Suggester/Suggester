const { editFeedMessage } = require("../../utils/actions");
const { serverLog } = require("../../utils/logs");
const { dbModify, dbQueryNoNew } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { baseConfig, checkSuggestions } = require("../../utils/checks");
const { fetchUser, logEmbed } = require("../../utils/misc");
const { cleanCommand } = require("../../utils/actions");
const { initTrello } = require("../../utils/trello");
module.exports = {
	controls: {
		name: "deletecomment",
		permission: 3,
		aliases: ["delcomment", "dcomment", "rmcomment", "dc"],
		usage: "deletecomment [comment id]",
		description: "Deletes a comment from a suggestion",
		enabled: true,
		examples: "`{{p}}deletecomment 27_1`\nDeletes a comment with the ID `27_1`",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10,
		docs: "staff/deletecomment"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (!args[0]) return message.channel.send(string(locale, "NO_COMMENT_ID_SPECIFIED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		let idsections = args[0].split("_");
		if (idsections.length < 2) return message.channel.send(string(locale, "NO_COMMENT_ID_SPECIFIED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		let qSuggestionDB = await dbQueryNoNew("Suggestion", {suggestionId: idsections[0], id: message.guild.id});
		if (!qSuggestionDB) return message.channel.send(string(locale, "NO_COMMENT_ID_SPECIFIED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let suggestionsCheck = checkSuggestions(locale, message.guild, qServerDB, qSuggestionDB);
		if (suggestionsCheck) return message.channel.send(suggestionsCheck).then(sent => cleanCommand(message, sent, qServerDB));

		if (qSuggestionDB.implemented) return message.channel.send(string(locale, "SUGGESTION_IMPLEMENTED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let id = qSuggestionDB.suggestionId;

		let comment = qSuggestionDB.comments.find(comment => comment.id === idsections[1]) || null;
		if (!comment) return message.channel.send(string(locale, "NO_COMMENT_ID_SPECIFIED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		if (comment.deleted) return message.channel.send(string(locale, "COMMENT_ALREADY_DELETED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		comment.deleted = true;

		let editFeed = await editFeedMessage({ guild: guildLocale, user: locale }, qSuggestionDB, qServerDB, client);
		if (editFeed) return message.channel.send(editFeed).then(sent => cleanCommand(message, sent, qServerDB));

		let author = await fetchUser(comment.author, client);
		if (!author) return message.channel.send(string(locale, "ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		await dbModify("Suggestion", { suggestionId: id, id: message.guild.id }, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "COMMENT_DELETED_TITLE"))
			.addField(author.id !== "0" ? string(locale, "COMMENT_TITLE", { user: author.tag, id: `${id}_${comment.id}` }) : string(locale, "COMMENT_TITLE_ANONYMOUS"), comment.comment)
			.setColor(client.colors.red)
			.setTimestamp();
		message.channel.send(replyEmbed).then(sent => cleanCommand(message, sent, qServerDB));

		console.log(comment);
		if (qServerDB.config.trello.board && qSuggestionDB.trello_card && comment.trello_comment) {
			const t = initTrello();
			console.log(`/1/cards/${qSuggestionDB.trello_card}/actions/${comment.trello_comment}/comments`);
			t.makeRequest("delete", `/1/cards/${qSuggestionDB.trello_card}/actions/${comment.trello_comment}/comments`).catch(() => null);
		}

		if (qServerDB.config.channels.log) {
			let logs = logEmbed(guildLocale, qSuggestionDB, message.author, "DELETED_COMMENT_LOG", "red")
				.addField(author.id !== "0" ? string(guildLocale, "COMMENT_TITLE", { user: author.tag, id: `${id}_${comment.id}` }) : string(guildLocale, "COMMENT_TITLE_ANONYMOUS"), comment.comment)
				.setAuthor(string(locale, "DELETED_COMMENT_LOG", { user: message.author.tag, id: id, comment: `${id}_${comment.id}` }), message.author.displayAvatarURL({ format: "png", dynamic: true }));

			serverLog(logs, qServerDB, client);
		}
	}
};
