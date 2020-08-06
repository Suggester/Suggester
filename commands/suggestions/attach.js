const { suggestionEditCommandCheck, checkURL } = require("../../utils/checks");
const { editFeedMessage } = require("../../utils/actions");
const { serverLog } = require("../../utils/logs");
const { dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { logEmbed } = require("../../utils/misc");
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
		cooldown: 5
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionEditCommandCheck(locale, message, args);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (qSuggestionDB.attachment) return message.channel.send(string(locale, "ALREADY_ATTACHMENT_ERROR", {}, "error"));

		if (!args[1] && !message.attachments.first()) return message.channel.send(string(locale, "NO_ATTACHMENT_ERROR", {}, "error"));

		let attachment = message.attachments.first() ? message.attachments.first().url : args.splice(1).join(" ");

		if (!(checkURL(attachment))) return message.channel.send(string(locale, "INVALID_AVATAR_ERROR", {}, "error"));

		qSuggestionDB.attachment = attachment;

		let editFeed = await editFeedMessage({ guild: guildLocale, user: locale }, qSuggestionDB, qServerDB, client);
		if (editFeed) return message.channel.send(editFeed);

		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "ATTACHMENT_ADDED_HEADER"))
			.setDescription(`${qSuggestionDB.suggestion || string(locale, "NO_SUGGESTION_CONTENT")}\n[${string(locale, "SUGGESTION_FEED_LINK")}](https://discord.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.setImage(attachment)
			.setColor(client.colors.blue)
			.setFooter(string(locale, "SUGGESTION_FOOTER", { id: id.toString() }))
			.setTimestamp(qSuggestionDB.submitted);
		message.channel.send(replyEmbed);

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "ATTACHED_LOG", "blue")
				.addField(string(guildLocale, "ATTACHMENT_ADDED_HEADER"), attachment)
				.setImage(attachment);
			serverLog(embedLog, qServerDB, client);
		}
	}
};
