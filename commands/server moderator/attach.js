const { colors } = require("../../config.json");
const { suggestionEditCommandCheck, checkURL } = require("../../utils/checks");
const { editFeedMessage } = require("../../utils/actions");
const { serverLog } = require("../../utils/logs");
const { dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "attach",
		permission: 3,
		usage: "attach <suggestion id> <attachment link>",
		description: "Attaches a file to an approved suggestion",
		image: "images/Attach.gif",
		enabled: true,
		docs: "staff/attach",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ATTACH_FILES"],
		cooldown: 5
	},
	do: async (message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionEditCommandCheck(message, args);
		if (returned) return message.channel.send(returned);

		if (qSuggestionDB.attachment) return message.channel.send(string("ALREADY_ATTACHMENT_ERROR", {}, "error"));

		if (!args[1] && !message.attachments.first()) return message.channel.send(string("NO_ATTACHMENT_ERROR", {}, "error"));

		let attachment = message.attachments.first() ? message.attachments.first().url : args.splice(1).join(" ");

		if (!(checkURL(attachment))) return message.channel.send(string("INVALID_AVATAR_ERROR", {}, "error"));

		qSuggestionDB.attachment = attachment;
		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let editFeed = await editFeedMessage(qSuggestionDB, qServerDB, client);
		if (editFeed) return message.channel.send(editFeed);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string("ATTACHMENT_ADDED_HEADER"))
			.setDescription(`${qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT")}\n[${string("SUGGESTION_FEED_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.setImage(attachment)
			.setColor(colors.blue)
			.setFooter(string("SUGGESTION_FOOTER", { id: id.toString() }));
		message.channel.send(replyEmbed);

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(string("ATTACHED_LOG", { user: message.author.tag, id: id.toString() }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.addField(string("ATTACHMENT_ADDED_HEADER"), attachment)
				.setImage(attachment)
				.setFooter(string("LOG_SUGGESTION_SUBMITTED_FOOTER", { id: id.toString(), user: message.author.id }))
				.setTimestamp()
				.setColor(colors.blue);
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
