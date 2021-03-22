const { baseConfig, checkSuggestion, checkSuggestions, checkReview } = require("../../utils/checks");
const { editFeedMessage } = require("../../utils/actions");
const { serverLog } = require("../../utils/logs");
const { dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { logEmbed, fetchUser, reviewEmbed } = require("../../utils/misc");
const { cleanCommand } = require("../../utils/actions");
const { initTrello } = require("../../utils/trello");
const { emoji } = require("../../config");
module.exports = {
	controls: {
		name: "removeattachment",
		permission: 3,
		aliases: ["rmattachment", "rmattach", "delattachment", "deleteattachment"],
		usage: "removeattachment [suggestion id]",
		description: "Removes an attachment from a suggestion",
		enabled: true,
		examples: "`{{p}}removeattachment 1`\nRemoves the attachment from suggestion #1",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10,
		docs: "staff/removeattachment"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		let [sErr, qSuggestionDB] = await checkSuggestion(locale, message.guild, args[0]);
		if (sErr) return message.channel.send(sErr);
		let guildLocale = qServerDB.config.locale;

		if (qSuggestionDB.status === "denied") return message.channel.send(string(locale, "SUGGESTION_DENIED_ERROR", {}, "error"));

		if (!qSuggestionDB.attachment) return message.channel.send(string(locale, "NO_ATTACHMENT_REMOVE_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		let oldAttachment = qSuggestionDB.attachment;
		qSuggestionDB.attachment = null;

		if (qSuggestionDB.status === "approved") {
			let suggestionsCheck = checkSuggestions(locale, message.guild, qServerDB, qSuggestionDB);
			if (suggestionsCheck) return message.channel.send(suggestionsCheck);
			let editFeed = await editFeedMessage({guild: guildLocale, user: locale}, qSuggestionDB, qServerDB, client);
			if (editFeed) return message.channel.send(editFeed).then(sent => cleanCommand(message, sent, qServerDB));
		} else {
			let checkStaff = checkReview(locale, message.guild, qServerDB, qSuggestionDB);
			if (checkStaff) return message.channel.send(checkStaff);

			let suggester = await fetchUser(qSuggestionDB.suggester, client);
			if (!suggester) return message.channel.send(string(locale, "ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

			let embedReview = reviewEmbed(guildLocale, qSuggestionDB, suggester, "yellow");
			embedReview.addField(string(guildLocale, "APPROVE_DENY_HEADER"), string(guildLocale, "REVIEW_COMMAND_INFO_NEW", { approve: `<:${emoji.check}>`, deny: `<:${emoji.x}>`, channel: `<#${qServerDB.config.channels.suggestions}>` }));
			if (qSuggestionDB.reviewMessage && (qSuggestionDB.channels.staff || qServerDB.config.channels.staff)) client.channels.cache.get(qSuggestionDB.channels.staff || qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit(qServerDB.config.ping_role ? (qServerDB.config.ping_role === message.guild.id ? "@everyone" : `<@&${qServerDB.config.ping_role}>`) : "", { embed: embedReview, disableMentions: "none" })).catch(() => {});
		}

		await dbModify("Suggestion", { suggestionId: qSuggestionDB.suggestionId, id: message.guild.id }, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "ATTACHMENT_REMOVED_TITLE"))
			.setDescription(oldAttachment)
			.setImage(oldAttachment)
			.setColor(client.colors.orange)
			.setFooter(string(locale, "SUGGESTION_FOOTER", { id: qSuggestionDB.suggestionId.toString() }))
			.setTimestamp(qSuggestionDB.submitted);
		message.channel.send(replyEmbed).then(sent => cleanCommand(message, sent, qServerDB));

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "ATTACH_REMOVE_LOG", "orange")
				.addField(string(guildLocale, "ATTACHMENT_REMOVED_TITLE"), oldAttachment)
				.setImage(oldAttachment);

			serverLog(embedLog, qServerDB, client);
		}

		if (qServerDB.config.trello.board && qSuggestionDB.trello_card && qSuggestionDB.trello_attach_id) {
			const t = initTrello();
			t.makeRequest("delete", `/1/cards/${qSuggestionDB.trello_card}/attachments/${qSuggestionDB.trello_attach_id}`).then(() => {
				qSuggestionDB.trello_attach_id = "";
				qSuggestionDB.save();
			}).catch(() => null);
		}
	}
};
