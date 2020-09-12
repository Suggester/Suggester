const { string } = require("../../utils/strings");
const { fetchUser, suggestionEmbed, logEmbed, dmEmbed, reviewEmbed } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { dbQuery } = require("../../utils/db");
const { baseConfig, checkSuggestions, checkReview } = require("../../utils/checks");
const { Suggestion } = require("../../utils/schemas");
module.exports = {
	controls: {
		name: "massapprove",
		permission: 3,
		usage: "massapprove [suggestion ids] -r (comment)",
		aliases: ["mapprove", "multiapprove", "maccept", "myes"],
		description: "Approves multiple suggestions at once",
		image: "images/Mapprove.gif",
		enabled: true,
		examples: "`{{p}}massapprove 1 2 3`\nApproves suggestions 1, 2, and 3\n\n`{{p}}massapprove 1 2 3 -r Nice suggestion!`\nApproves suggestions 1, 2, and 3 and comments on each of them with \"Nice suggestion!\"",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(string(locale, "MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error"));

		if (!args[0]) return message.channel.send(string(locale, "NONE_SPECIFIED_MASS_ERROR", {}, "error"));

		let reason;
		let reasonSplit = args.join(" ").split("-r");
		if (!reasonSplit[0]) return message.channel.send(string(locale, "NONE_SPECIFIED_MASS_ERROR", {}, "error"));
		let suggestions = reasonSplit[0].split(" ");
		if (reasonSplit[1]) {
			reason = reasonSplit[1].split(" ").splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(string(locale, "COMMENT_TOO_LONG_ERROR", {}, "error"));
		}

		if (suggestions[suggestions.length - 1] === "") suggestions.pop();
		if (suggestions.some(isNaN)) return message.channel.send(string(locale, "NAN_MASS_APPROVE_ERROR", {}, "error"));

		let checkSuggest = checkSuggestions(locale, message.guild, qServerDB);
		if (checkSuggest) return message.channel.send(checkSuggest);

		let checkStaff = checkReview(locale, message.guild, qServerDB);
		if (checkStaff) return message.channel.send(checkStaff);

		let su = suggestions.map(Number);
		let msg = await message.channel.send(string(locale, "PROCESSING"));

		let preApprove = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let alreadyApproved = preApprove.filter((s) => s.status !== "awaiting_review");

		let notApprovedId = alreadyApproved.map((s) => s.suggestionId);
		su.filter(num => !notApprovedId.includes(num));

		let newSet = {
			status: "approved",
			staff_member: message.author.id
		};
		if (reason) newSet["comments"] = [{
			comment: reason,
			author: message.author.id,
			id: 1,
			created: new Date()
		}];

		let { nModified } = await Suggestion.update({
			suggestionId: { $in: su },
			status: "awaiting_review"
		}, {
			$set: newSet
		}, {
			multi: true
		});

		let postApprove = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let approved = postApprove.filter((s) => s.status === "approved" && !notApprovedId.includes(s.suggestionId));
		let approvedId = approved.map((s) => s.suggestionId);

		await msg.edit(
			new Discord.MessageEmbed()
				.setDescription(string(locale, "MASS_APPROVE_SUCCESS_TITLE", { some: nModified.toString(), total: postApprove.length }, nModified !== 0 ? "success" : "error"))
				.addField(string(locale, "RESULT_FIELD_TITLE"), `${approvedId.length > 0 ? string(locale, "MASS_APPROVE_APPROVE_RESULTS_DETAILED", { list: approvedId.join(", ") }, "success") : ""}\n${notApprovedId.length > 0 ? string(locale, "MASS_APPROVE_FAIL_RESULTS_DETAILED", { list: notApprovedId.join(", ") }, "error") : ""}`)
				.setColor(approvedId.length !== 0 ? client.colors.green : client.colors.red)
				.setFooter(nModified !== su.length ? string(locale, "MASS_APPROVE_ERROR_DETAILS") : "")
		);

		for (let s in approved) {
			// eslint-disable-next-line no-prototype-builtins
			if (approved.hasOwnProperty(s)) {
				let qSuggestionDB = approved[s];
				if (qServerDB.config.channels.suggestions !== qSuggestionDB.channels.suggestions) {
					let checkSuggest = checkSuggestions(locale, message.guild, qServerDB, qSuggestionDB);
					if (checkSuggest) continue;
				}

				let suggester = await fetchUser(qSuggestionDB.suggester, client);
				let embedSuggest = await suggestionEmbed(guildLocale, qSuggestionDB, qServerDB, client);
				client.channels.cache.get(qServerDB.config.channels.suggestions).send(embedSuggest).then(async posted => {
					qSuggestionDB.messageId = posted.id;

					if (qServerDB.config.react) {
						let reactEmojiUp = qServerDB.config.emojis.up;
						let reactEmojiMid = qServerDB.config.emojis.mid;
						let reactEmojiDown = qServerDB.config.emojis.down;
						if (reactEmojiUp !== "none") await posted.react(reactEmojiUp).catch(async () => {
							await posted.react("👍");
							reactEmojiUp = "👍";
						});
						if (reactEmojiMid !== "none") await posted.react(reactEmojiMid).catch(async () => {
							await posted.react("🤷");
							reactEmojiMid = "🤷";
						});
						if (reactEmojiDown !== "none") await posted.react(reactEmojiDown).catch(async () => {
							await posted.react("👎");
							reactEmojiDown = "👎";
						});
						qSuggestionDB.emojis = {
							up: reactEmojiUp,
							mid: reactEmojiMid,
							down: reactEmojiDown
						};
					}

					let qUserDB = await dbQuery("User", { id: suggester.id });
					if (qServerDB.config.notify && qUserDB.notify) suggester.send((dmEmbed(qUserDB.locale || locale, client, qSuggestionDB, "green", {
						string: "APPROVED_DM_TITLE",
						guild: message.guild.name
					}, qSuggestionDB.attachment, qServerDB.config.channels.suggestions, reason ? {
						header: string(locale, "COMMENT_TITLE", {
							user: message.author.tag,
							id: `${qSuggestionDB.suggestionId.toString()}_1`
						}), reason: reason
					} : null))).catch(() => {
					});

					if (qServerDB.config.approved_role && message.guild.roles.cache.get(qServerDB.config.approved_role) && message.guild.members.cache.get(suggester.id) && message.guild.me.permissions.has("MANAGE_ROLES")) await message.guild.members.cache.get(suggester.id).roles.add(qServerDB.config.approved_role, string(locale, "SUGGESTION_APPROVED_TITLE"));

					if (qServerDB.config.channels.log) {
						let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "APPROVED_LOG", "green")
							.addField(string(guildLocale, "SUGGESTION_HEADER"), qSuggestionDB.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"));
						reason ? embedLog.addField(string(guildLocale, "COMMENT_TITLE", {
							user: message.author.tag,
							id: `${qSuggestionDB.suggestionId.toString()}_1`
						}), reason) : "";
						if (qSuggestionDB.attachment) {
							embedLog.addField(string(guildLocale, "WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
								.setImage(qSuggestionDB.attachment);
						}

						serverLog(embedLog, qServerDB, client);
					}

					if (qSuggestionDB.reviewMessage && (qSuggestionDB.channels.staff || qServerDB.config.channels.staff)) {
						let doReview = true;
						if (qSuggestionDB.channels.staff !== qServerDB.config.channels.staff) {
							let checkStaff = checkReview(locale, message.guild, qServerDB, qSuggestionDB);
							if (checkStaff) doReview = false;
						}
						if (doReview) client.channels.cache.get(qSuggestionDB.channels.staff || qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit((reviewEmbed(guildLocale, qSuggestionDB, suggester, "green", string(guildLocale, "APPROVED_BY", {user: message.author.tag}))))).catch(() => {});
					}
					await approved[s].save();
				});
			}
		}
	}
};
