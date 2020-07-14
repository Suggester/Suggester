const { colors } = require("../../config.json");
const { editFeedMessage } = require("../../utils/actions");
const { serverLog } = require("../../utils/logs");
const { dbModify, dbQueryNoNew } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { baseConfig, checkSuggestions } = require("../../utils/checks");
const { fetchUser, logEmbed } = require("../../utils/misc");
module.exports = {
	controls: {
		name: "deletecomment",
		permission: 3,
		aliases: ["delcomment", "dcomment", "rmcomment"],
		usage: "deletecomment <comment id>",
		description: "Deletes a comment on a suggestion",
		enabled: true,
		docs: "staff/deletecomment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild.id);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		let suggestionsCheck = checkSuggestions(locale, message.guild, qServerDB);
		if (suggestionsCheck) return message.channel.send(suggestionsCheck);

		if (!args[0]) return message.channel.send(string(locale, "NO_COMMENT_ID_SPECIFIED_ERROR", {}, "error"));
		let idsections = args[0].split("_");
		if (idsections.length < 2) return message.channel.send(string(locale, "NO_COMMENT_ID_SPECIFIED_ERROR", {}, "error"));
		let qSuggestionDB = await dbQueryNoNew("Suggestion", {suggestionId: idsections[0], id: message.guild.id});
		if (!qSuggestionDB) return message.channel.send(string(locale, "NO_COMMENT_ID_SPECIFIED_ERROR", {}, "error"));

		if (qSuggestionDB.implemented) return message.channel.send(string(locale, "SUGGESTION_IMPLEMENTED_ERROR", {}, "error"));

		let id = qSuggestionDB.suggestionId;

		let comment = qSuggestionDB.comments.find(comment => comment.id === idsections[1]) || null;
		if (!comment) return message.channel.send(string(locale, "NO_COMMENT_ID_SPECIFIED_ERROR", {}, "error"));
		if (comment.deleted) return message.channel.send(string(locale, "COMMENT_ALREADY_DELETED_ERROR", {}, "error"));

		comment.deleted = true;

		let editFeed = await editFeedMessage({ guild: guildLocale, user: locale }, qSuggestionDB, qServerDB, client);
		if (editFeed) return message.channel.send(editFeed);

		let author = await fetchUser(comment.author, client);
		if (!author) return message.channel.send(string(locale, "ERROR", {}, "error"));

		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "COMMENT_DELETED_TITLE"))
			.addField(author.id !== "0" ? string(locale, "COMMENT_TITLE", { user: author.tag, id: `${id}_${comment.id}` }) : string(locale, "COMMENT_TITLE_ANONYMOUS"), comment.comment)
			.setColor(colors.red)
			.setTimestamp();
		message.channel.send(replyEmbed);

		if (qServerDB.config.channels.log) {
			let logs = logEmbed(guildLocale, qSuggestionDB, message.author, "DELETED_COMMENT_LOG", "red")
				.addField(author.id !== "0" ? string(guildLocale, "COMMENT_TITLE", { user: author.tag, id: `${id}_${comment.id}` }) : string(guildLocale, "COMMENT_TITLE_ANONYMOUS"), comment.comment)
				.setAuthor(string(locale, "DELETED_COMMENT_LOG", { user: message.author.tag, id: id, comment: `${id}_${comment.id}` }), message.author.displayAvatarURL({ format: "png", dynamic: true }));

			serverLog(logs, qServerDB, client);
		}
	}
};
