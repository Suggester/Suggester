const { string } = require("../../utils/strings");
const { fetchUser, logEmbed, reviewEmbed } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { Suggestion } = require("../../utils/schemas");
const { checkDenied, baseConfig, checkSuggestions, checkReview } = require("../../utils/checks");
const { deleteFeedMessage, checkVotes, notifyFollowers } = require("../../utils/actions");
const { cleanCommand } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "massdelete",
		permission: 3,
		usage: "massdelete [suggestion ids] -r (reason)",
		aliases: ["mdelete", "multidelete"],
		description: "Deletes multiple suggestions at once, removing them from the suggestions feed",
		image: "images/Mdelete.gif",
		enabled: true,
		examples: "`{{p}}massdelete 1 2 3`\nDeletes suggestions 1, 2, and 3\n\n`{{p}}massdelete 1 2 3 -r Cleaning up suggestions`\nDeletes suggestions 1, 2, and 3 with a reason of \"Cleaning up suggestions\"",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		let suggestionsCheck = checkSuggestions(locale, message.guild, qServerDB);
		if (suggestionsCheck) return message.channel.send(suggestionsCheck);

		let checkStaff = checkReview(locale, message.guild, qServerDB);
		if (checkStaff) return message.channel.send(checkStaff);

		let deniedCheck = checkDenied(locale, message.guild, qServerDB);
		if (deniedCheck) return message.channel.send(deniedCheck);

		if (!args[0]) return message.channel.send(string(locale, "NONE_SPECIFIED_MASS_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let reason;
		let reasonSplit = args.join(" ").split("-r");
		if (!reasonSplit[0]) return message.channel.send(string(locale, "NONE_SPECIFIED_MASS_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		let suggestions = reasonSplit[0].split(" ");
		if (reasonSplit[1]) {
			reason = reasonSplit[1].split(" ").splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(string(locale, "DELETION_REASON_TOO_LONG_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		}

		if (suggestions[suggestions.length - 1] === "") suggestions.pop();
		if (suggestions.some(isNaN)) return message.channel.send(string(locale, "NAN_MASS_DENY_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		let su = suggestions.map(Number);
		let msg = await message.channel.send(string(locale, "PROCESSING"));

		let preDeny = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let alreadyDenied = preDeny.filter((s) => s.status !== "approved" || s.implemented);

		let notDeniedId = alreadyDenied.map((s) => s.suggestionId);
		su.filter(num => !notDeniedId.includes(num));

		let { nModified } = await Suggestion.update({
			suggestionId: { $in: su },
			status: "approved"
		}, {
			$set: {
				status: "denied",
				staff_member: message.author.id,
				denial_reason: reason
			},
		}, {
			multi: true
		});

		let postDeny = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let denied = postDeny.filter((s) => s.status === "denied" && !notDeniedId.includes(s.suggestionId));
		let deniedId = denied.map((s) => s.suggestionId);

		await msg.edit(
			new Discord.MessageEmbed()
				.setDescription(string(locale, "MASS_DELETE_SUCCESS_TITLE", { some: nModified.toString(), total: postDeny.length }, nModified !== 0 ? "success" : "error"))
				.addField(string(locale, "RESULT_FIELD_TITLE"), `${deniedId.length > 0 ? string(locale, "MASS_DELETE_SUCCESS_RESULTS_DETAILED", { list: deniedId.join(", ") }, "success") : ""}\n${notDeniedId.length > 0 ? string(locale, "MASS_DELETE_FAIL_RESULTS_DETAILED", { list: notDeniedId.join(", ") }, "error") : ""}`)
				.setColor(deniedId.length !== 0 ? client.colors.green : client.colors.red)
				.setFooter(nModified !== su.length ? string(locale, "MASS_DELETE_ERROR_DETAILS") : "")
		).then(sent => cleanCommand(message, sent, qServerDB));

		for (let s in denied) {
			// eslint-disable-next-line no-prototype-builtins
			if (denied.hasOwnProperty(s)) {
				let qSuggestionDB = denied[s];
				let suggester = await fetchUser(qSuggestionDB.suggester, client);

				let deleteMsg = await deleteFeedMessage(locale, qSuggestionDB, qServerDB, client);

				if (qServerDB.config.channels.denied) {
					let deniedEmbed = new Discord.MessageEmbed()
						.setTitle(string(guildLocale, "SUGGESTION_DELETED_TITLE"))
						.setAuthor(string(guildLocale, "SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({format: "png", dynamic: true}))
						.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}))
						.setDescription(qSuggestionDB.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"))
						.setFooter(string(guildLocale, "SUGGESTION_FOOTER", {id: qSuggestionDB.suggestionId.toString()}))
						.setTimestamp(qSuggestionDB.submitted)
						.setColor(client.colors.red);
					reason ? deniedEmbed.addField(string(guildLocale, "REASON_GIVEN"), reason) : "";
					let votes = checkVotes(guildLocale, qSuggestionDB, deleteMsg[1]);
					if (votes[0] || votes[1]) deniedEmbed.addField(string(locale, "VOTES_TITLE"), `${string(locale, "VOTE_COUNT_OPINION")} ${isNaN(votes[2]) ? string(locale, "UNKNOWN") : (votes[2] > 0 ? `+${votes[2]}` : votes[2])}\n${string(locale, "VOTE_COUNT_UP")} ${votes[0]} \`${((votes[0]/(votes[0]+votes[1]))*100).toFixed(2)}%\`\n${string(locale, "VOTE_COUNT_DOWN")} ${votes[1]} \`${((votes[1]/(votes[0]+votes[1]))*100).toFixed(2)}%\``);
					qSuggestionDB.attachment ? deniedEmbed.setImage(qSuggestionDB.attachment) : "";
					client.channels.cache.get(qServerDB.config.channels.denied).send(deniedEmbed);
				}

				if (qServerDB.config.channels.log) {
					let logs = logEmbed(guildLocale, qSuggestionDB, message.author, "DELETED_LOG", "red")
						.setDescription(qSuggestionDB.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"));

					reason ? logs.addField(string(guildLocale, "REASON_GIVEN"), reason) : "";
					if (qSuggestionDB.attachment) {
						logs.setImage(qSuggestionDB.attachment);
						logs.addField(string(guildLocale, "WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment);
					}
					serverLog(logs, qServerDB, client);
				}

				if (qSuggestionDB.reviewMessage && (qSuggestionDB.channels.staff || qServerDB.config.channels.staff)) {
					let doReview = true;
					if (qSuggestionDB.channels.staff !== qServerDB.config.channels.staff) {
						let checkStaff = checkReview(locale, message.guild, qServerDB, qSuggestionDB);
						if (checkStaff) doReview = false;
					}
					if (doReview) client.channels.cache.get(qSuggestionDB.channels.staff || qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit((reviewEmbed(guildLocale, qSuggestionDB, suggester, "red", string(locale, "DELETED_BY", { user: message.author.tag }))))).catch(() => {});
				}

				await denied[s].save();

				await notifyFollowers(client, qServerDB, qSuggestionDB, "red", { string: "DELETED_DM_TITLE", guild: message.guild.name }, qSuggestionDB.attachment, null, reason ? { header: "REASON_GIVEN", reason: reason } : null);
			}
		}
	}
};
