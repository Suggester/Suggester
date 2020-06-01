const { colors } = require("../../config.json");
const { fetchUser, reviewEmbed, dmEmbed, logEmbed } = require("../../utils/misc.js");
const { serverLog } = require("../../utils/logs");
const { dbQuery, dbModify } = require("../../utils/db");
const { suggestionDeleteCommandCheck, checkReview } = require("../../utils/checks");
const { string } = require("../../utils/strings");
const { deleteFeedMessage, checkVotes } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "delete",
		permission: 3,
		usage: "delete <suggestion id> (reason)",
		description: "Deletes a suggestion",
		enabled: true,
		docs: "staff/delete",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		cooldownMessage: "Need to delete multiple suggestions? Try the `mdelete` command!"
	},
	do: async (message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionDeleteCommandCheck(message, args);
		if (returned) return message.channel.send(returned);

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) {
			let reviewCheck = checkReview(message.guild, qServerDB);
			if (reviewCheck) return message.channel.send(reviewCheck);
		}

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string("ERROR", {}, "error"));

		qSuggestionDB.status = "denied";
		qSuggestionDB.staff_member = message.author.id;

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(string("DELETION_REASON_TOO_LONG_ERROR", {}, "error"));
			qSuggestionDB.denial_reason = reason;
		}

		let deleteMsg = await deleteFeedMessage(qSuggestionDB, qServerDB, client);
		if (deleteMsg[0]) return message.channel.send(deleteMsg[0]);

		await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string("SUGGESTION_DELETED_TITLE"))
			.setAuthor(string("SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({format: "png", dynamic: true}))
			.setFooter(string("DELETED_BY", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"))
			.setColor(colors.red);
		reason ? replyEmbed.addField(string("REASON_GIVEN"), reason) : "";
		if (qSuggestionDB.attachment) {
			replyEmbed.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
				.setImage(qSuggestionDB.attachment);
		}
		message.channel.send(replyEmbed);

		let qUserDB = await dbQuery("User", { id: suggester.id });
		if (qServerDB.config.notify && qUserDB.notify) suggester.send((dmEmbed(qSuggestionDB, "red", { string: "DELETED_DM_TITLE", guild: message.guild.name }, qSuggestionDB.attachment, null, reason ? { header: string("REASON_GIVEN"), reason: reason } : null))).catch(() => {});

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) client.channels.cache.get(qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit((reviewEmbed(qSuggestionDB, suggester, "red", string("DELETED_BY", { user: message.author.tag }))))).catch(() => {});

		if (qServerDB.config.channels.denied) {
			let deniedEmbed = new Discord.MessageEmbed()
				.setTitle(string("SUGGESTION_DELETED_TITLE"))
				.setAuthor(string("SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"))
				.setFooter(string("SUGGESTION_FOOTER", {id: id.toString()}))
				.setTimestamp(qSuggestionDB.submitted)
				.setColor(colors.red);
			reason ? deniedEmbed.addField(string("REASON_GIVEN"), reason) : "";
			let votes = checkVotes(qSuggestionDB, deleteMsg[1]);
			if (!(!votes[0] && !votes[1])) deniedEmbed.addField(string("VOTE_TOTAL_HEADER"), `${string("VOTE_COUNT_OPINION")} ${isNaN(votes[2]) ? string("UNKNOWN") : (votes[2] > 0 ? `+${votes[2]}` : votes[2])}\n${string("VOTE_COUNT_UP")} ${votes[0]}\n${string("VOTE_COUNT_DOWN")} ${votes[1]}`);
			qSuggestionDB.attachment ? deniedEmbed.setImage(qSuggestionDB.attachment) : "";
			client.channels.cache.get(qServerDB.config.channels.denied).send(deniedEmbed);
		}

		if (qServerDB.config.channels.log) {
			let logs = logEmbed(qSuggestionDB, message.author, "DELETED_LOG", "red")
				.addField(string("SUGGESTION_HEADER"), qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"));

			reason ? logs.addField(string("REASON_GIVEN"), reason) : "";
			if (qSuggestionDB.attachment) {
				logs.setImage(qSuggestionDB.attachment);
				logs.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment);
			}
			serverLog(logs, qServerDB, client);
		}

	}
};
