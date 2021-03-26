const { string } = require("../../utils/strings");
const { fetchUser, logEmbed, reviewEmbed } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { notifyFollowers } = require("../../utils/actions");
const { Suggestion } = require("../../utils/schemas");
const { checkDenied, baseConfig, checkReview } = require("../../utils/checks");
const { cleanCommand } = require("../../utils/actions");
const { actCard } = require("../../utils/trello");
module.exports = {
	controls: {
		name: "massdeny",
		permission: 3,
		usage: "massdeny [suggestion ids] -r (reason)",
		aliases: ["mdeny", "multideny", "mreject", "mno"],
		description: "Denies multiple suggestions at once",
		image: "images/Mdeny.gif",
		enabled: true,
		examples: "`{{p}}massdeny 1 2 3`\nDenies suggestions 1, 2, and 3\n\n`{{p}}massdeny 1 2 3 -r This isn't something we're interested in doing`\nDenies suggestions 1, 2, and 3 with a reason of \"This isn't something we're interested in doing\"",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20,
		docs: "staff/massdeny"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(`${string(locale, "MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error")}\n${string(locale, "DENY_AUTOAPPROVE_DELETE_REDIRECT", { command: `${qServerDB.config.prefix}massdelete` })}`).then(sent => cleanCommand(message, sent, qServerDB));

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
			if (reason.length > 1024) return message.channel.send(string(locale, "DENIAL_REASON_TOO_LONG_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		}

		if (suggestions[suggestions.length - 1] === "") suggestions.pop();
		if (suggestions.some(isNaN)) return message.channel.send(string(locale, "NAN_MASS_DENY_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		let su = suggestions.map(Number);
		let msg = await message.channel.send(string(locale, "PROCESSING"));

		let preDeny = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let alreadyDenied = preDeny.filter((s) => s.status !== "awaiting_review");

		let notDeniedId = alreadyDenied.map((s) => s.suggestionId);
		su.filter(num => !notDeniedId.includes(num));

		let { nModified } = await Suggestion.update({
			suggestionId: { $in: su },
			status: "awaiting_review"
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
				.setDescription(string(locale, "MASS_DENY_SUCCESS_TITLE", { some: nModified.toString(), total: postDeny.length }, nModified !== 0 ? "success" : "error"))
				.addField(string(locale, "RESULT_FIELD_TITLE"), `${deniedId.length > 0 ? string(locale, "MASS_DENY_SUCCESS_RESULTS_DETAILED", { list: deniedId.join(", ") }, "success") : ""}\n${notDeniedId.length > 0 ? string(locale, "MASS_DENY_FAIL_RESULTS_DETAILED", { list: notDeniedId.join(", ") }, "error") : ""}`)
				.setColor(deniedId.length !== 0 ? client.colors.green : client.colors.red)
				.setFooter(nModified !== su.length ? string(locale, "MASS_DENY_ERROR_DETAILS") : "")
		).then(sent => cleanCommand(message, sent, qServerDB));

		for (let s in denied) {
			// eslint-disable-next-line no-prototype-builtins
			if (denied.hasOwnProperty(s)) {
				let qSuggestionDB = denied[s];
				let suggester = await fetchUser(qSuggestionDB.suggester, client);

				await notifyFollowers(client, qServerDB, qSuggestionDB, "red", { string: "DENIED_DM_TITLE", guild: message.guild.name }, qSuggestionDB.attachment, null, reason ? { header: "REASON_GIVEN", reason: reason } : null);

				if (qServerDB.config.channels.denied) {
					let deniedEmbed = new Discord.MessageEmbed()
						.setTitle(string(guildLocale, "SUGGESTION_DENIED_TITLE"))
						.setAuthor(string(guildLocale, "SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({format: "png", dynamic: true}))
						.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}))
						.setDescription(qSuggestionDB.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"))
						.setFooter(string(guildLocale, "SUGGESTION_FOOTER", {id: qSuggestionDB.suggestionId.toString()}))
						.setTimestamp(qSuggestionDB.submitted)
						.setColor(client.colors.red);
					reason ? deniedEmbed.addField(string(guildLocale, "REASON_GIVEN"), reason) : "";
					qSuggestionDB.attachment ? deniedEmbed.setImage(qSuggestionDB.attachment) : "";
					if (qSuggestionDB.anon) deniedEmbed.setAuthor(string(locale, "ANON_SUGGESTION"), client.user.displayAvatarURL({ format: "png" })).setThumbnail("");
					client.channels.cache.get(qServerDB.config.channels.denied).send(deniedEmbed);
				}

				if (qServerDB.config.channels.log) {
					let logs = logEmbed(guildLocale, qSuggestionDB, message.author, "DENIED_LOG", "red")
						.setDescription(qSuggestionDB.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"));

					reason ? logs.addField(string(guildLocale, "REASON_GIVEN"), reason) : "";
					if (qSuggestionDB.attachment) {
						logs.setImage(qSuggestionDB.attachment);
						logs.addField(string(guildLocale, "WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment);
					}
					serverLog(logs, qServerDB, client);
				}

				await actCard("deny", qServerDB, qSuggestionDB, suggester, `${string(guildLocale, "DENIED_BY", { user: message.author.tag })}${qSuggestionDB.denial_reason ? `\n${string(guildLocale, "BLOCK_REASON_HEADER")} ${qSuggestionDB.denial_reason}` : ""}`);

				if (qSuggestionDB.reviewMessage && (qSuggestionDB.channels.staff || qServerDB.config.channels.staff)) {
					let doReview = true;
					if (qSuggestionDB.channels.staff !== qServerDB.config.channels.staff) {
						let checkStaff = checkReview(locale, message.guild, qServerDB, qSuggestionDB);
						if (checkStaff) doReview = false;
					}
					if (doReview) client.channels.cache.get(qSuggestionDB.channels.staff || qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => {
						let re = reviewEmbed(locale, qSuggestionDB, suggester, "red", string(locale, "DENIED_BY", { user: message.author.tag }));
						reason ? re.addField(string(locale, "REASON_GIVEN"), reason) : "";
						fetched.edit(re);
						fetched.reactions.removeAll();
					}).catch(() => {});
				}

				await denied[s].save();
			}
		}
	}
};
