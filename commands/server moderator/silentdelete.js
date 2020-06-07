const { colors } = require("../../config.json");
const { fetchUser, reviewEmbed, logEmbed } = require("../../utils/misc.js");
const { serverLog } = require("../../utils/logs");
const { dbModify } = require("../../utils/db");
const { suggestionDeleteCommandCheck, checkReview } = require("../../utils/checks");
const { string } = require("../../utils/strings");
const { deleteFeedMessage } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "silentdelete",
		permission: 3,
		usage: "silentdelete <suggestion id> (reason)",
		description: "Deletes a suggestion without posting it to the denied suggestions feed or DMing the suggesting user",
		enabled: true,
		docs: "staff/silentdelete",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		cooldownMessage: "Need to delete multiple suggestions? Try the `mdelete` command!"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionDeleteCommandCheck(locale, message, args);
		if (returned) return message.channel.send(returned);

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) {
			let reviewCheck = checkReview(locale, message.guild, qServerDB);
			if (reviewCheck) return message.channel.send(reviewCheck);
		}

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string(locale, "ERROR", {}, "error"));

		qSuggestionDB.status = "denied";
		qSuggestionDB.staff_member = message.author.id;

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(string(locale, "DELETION_REASON_TOO_LONG_ERROR", {}, "error"));
			qSuggestionDB.denial_reason = reason;
		}

		let deleteMsg = await deleteFeedMessage(locale, qSuggestionDB, qServerDB, client);
		if (deleteMsg[0]) return message.channel.send(deleteMsg[0]);

		await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "SUGGESTION_DELETED_TITLE"))
			.setAuthor(string(locale, "SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({format: "png", dynamic: true}))
			.setFooter(string(locale, "DELETED_BY", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion || string(locale, "NO_SUGGESTION_CONTENT"))
			.setColor(colors.red);
		reason ? replyEmbed.addField(string(locale, "REASON_GIVEN"), reason) : "";
		if (qSuggestionDB.attachment) {
			replyEmbed.addField(string(locale, "WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
				.setImage(qSuggestionDB.attachment);
		}
		message.channel.send(replyEmbed);

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) client.channels.cache.get(qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit((reviewEmbed(locale, qSuggestionDB, suggester, "red", string(locale, "DELETED_BY", { user: message.author.tag }))))).catch(() => {});

		if (qServerDB.config.channels.log) {
			let logs = logEmbed(locale, qSuggestionDB, message.author, "DELETED_LOG", "red")
				.addField(string(locale, "SUGGESTION_HEADER"), qSuggestionDB.suggestion || string(locale, "NO_SUGGESTION_CONTENT"));

			reason ? logs.addField(string(locale, "REASON_GIVEN"), reason) : "";
			if (qSuggestionDB.attachment) {
				logs.setImage(qSuggestionDB.attachment);
				logs.addField(string(locale, "WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment);
			}
			serverLog(logs, qServerDB, client);
		}
	}
};
