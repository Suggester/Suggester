const { baseConfig, checkURL, checkSuggestion, checkSuggestions, checkReview } = require("../../utils/checks");
const { editFeedMessage } = require("../../utils/actions");
const { serverLog, mediaLog } = require("../../utils/logs");
const { dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { logEmbed, fetchUser, reviewEmbed } = require("../../utils/misc");
const { cleanCommand } = require("../../utils/actions");
const { initTrello } = require("../../utils/trello");
const { emoji } = require("../../config");
module.exports = {
	controls: {
		name: "attach",
		permission: 3,
		usage: "attach [suggestion id] [attachment link]",
		description: "Attaches a file to an approved suggestion",
		image: "images/Attach.gif",
		enabled: true,
		examples: "`{{p}}attach 1 https://i.imgur.com/zmntNve.png`\nAttaches https://i.imgur.com/zmntNve.png to suggestion #1\n\n`{{p}}attach 1`\nIf you attach an image via Discord's native uploader, it will be added to suggestion #1",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ATTACH_FILES"],
		cooldown: 5,
		docs: "staff/attach"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		let [sErr, qSuggestionDB] = await checkSuggestion(locale, message.guild, args[0]);
		if (sErr) return message.channel.send(sErr);
		let guildLocale = qServerDB.config.locale;

		if (qSuggestionDB.status === "denied") return message.channel.send(string(locale, "SUGGESTION_DENIED_ERROR", {}, "error"));

		if (qSuggestionDB.attachment) return message.channel.send(string(locale, "ALREADY_ATTACHMENT_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		if (!args[1] && !message.attachments.first()) return message.channel.send(string(locale, "NO_ATTACHMENT_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let attachment = message.attachments.first() ? message.attachments.first().url : args.splice(1).join(" ");

		if (!(checkURL(attachment))) return message.channel.send(string(locale, "INVALID_AVATAR_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		const res = await mediaLog(message, qSuggestionDB.suggestionId, attachment)
			.catch(console.error);

		if (res && res.code === 40005) return message.channel.send(string(locale, "ATTACHMENT_TOO_BIG", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		if (!res || !res.attachments || !res.attachments[0]) return message.channel.send(string(locale, "ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		qSuggestionDB.attachment = res.attachments[0].url;

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
			.setTitle(string(locale, "ATTACHMENT_ADDED_HEADER"))
			.setDescription(`${qSuggestionDB.suggestion || string(locale, "NO_SUGGESTION_CONTENT")}\n[${string(locale, qSuggestionDB.status === "approved" ? "SUGGESTION_FEED_LINK" : "QUEUE_POST_LINK")}](https://discord.com/channels/${qSuggestionDB.id}/${qSuggestionDB.status === "approved" ? (qSuggestionDB.channels.suggestions || qServerDB.config.channels.suggestions) : (qSuggestionDB.channels.staff || qServerDB.config.channels.staff)}/${qSuggestionDB.status === "approved" ? qSuggestionDB.messageId : qSuggestionDB.reviewMessage})`)
			.setImage(attachment)
			.setColor(client.colors.blue)
			.setFooter(string(locale, "SUGGESTION_FOOTER", { id: qSuggestionDB.suggestionId }))
			.setTimestamp(qSuggestionDB.submitted);
		message.channel.send(replyEmbed).then(sent => cleanCommand(message, sent, qServerDB));

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "ATTACHED_LOG", "blue")
				.addField(string(guildLocale, "ATTACHMENT_ADDED_HEADER"), attachment)
				.setImage(attachment);
			serverLog(embedLog, qServerDB, client);
		}

		if (qServerDB.config.trello.board && qSuggestionDB.trello_card) {
			const t = initTrello();
			await t.addAttachmentToCard(qSuggestionDB.trello_card, attachment).then(a => {
				qSuggestionDB.trello_attach_id = a.id;
				qSuggestionDB.save();
			}).catch(() => null);
		}
	}
};
